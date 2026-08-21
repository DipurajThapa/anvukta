"use server";

import { randomBytes } from "node:crypto";

import { headers } from "next/headers";

import { prisma } from "@/lib/db";
import { guard } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { retrieve } from "@/lib/chat-retrieval";
import type { ChatState, ChatTurn } from "@/lib/chat-types";
import { handoverSchema } from "@/lib/validation";

/**
 * Chat server actions.
 *
 * The bot only ever repeats a passage that already exists on this site. When
 * retrieval finds nothing good enough it says so and offers a person, and the
 * conversation moves to the admin queue where a human answers it.
 */

const MAX_QUESTION = 500;

/**
 * Every public entry point here writes rows, so each one is capped. The global
 * figures are the backstop against someone cycling through identities: they sit
 * far above real traffic and only bite during a flood.
 */
const LIMITS = {
  start: {
    perClient: { limit: 5, windowSeconds: 60 * 60 },
    anonymous: { limit: 80, windowSeconds: 60 * 60 },
    global: { limit: 1000, windowSeconds: 60 * 60 },
  },
  ask: {
    perClient: { limit: 30, windowSeconds: 15 * 60 },
    anonymous: { limit: 200, windowSeconds: 15 * 60 },
    global: { limit: 3000, windowSeconds: 15 * 60 },
  },
  human: {
    perClient: { limit: 3, windowSeconds: 60 * 60 },
    anonymous: { limit: 20, windowSeconds: 60 * 60 },
    global: { limit: 200, windowSeconds: 60 * 60 },
  },
} as const;

/** One thread cannot grow without end, however patient the sender is. */
const MAX_MESSAGES_PER_CONVERSATION = 120;

/** Two failed answers in a row is our signal to stop guessing and fetch a person. */
const FAILURES_BEFORE_OFFER = 2;

/**
 * Shown when the chat is refusing new threads. It says so plainly and points at
 * the other two channels, so a real visitor who lands here is never left staring
 * at an empty panel.
 */
const BUSY: ChatState = {
  token: "",
  status: "bot",
  turns: [
    {
      id: "busy",
      role: "bot",
      body: `The chat is handling a lot of requests right now, so I cannot start a new conversation. Email ${site.contact.email} or message us on WhatsApp and a person will pick it up.`,
      sourceHref: null,
      sourceTopic: null,
      at: new Date(0).toISOString(),
    },
  ],
  waitingForHuman: false,
};

function toTurn(row: {
  id: string;
  role: string;
  body: string;
  sourceHref: string | null;
  sourceTopic: string | null;
  createdAt: Date;
}): ChatTurn {
  return {
    id: row.id,
    role: row.role === "visitor" ? "visitor" : row.role === "human" ? "human" : "bot",
    body: row.body,
    sourceHref: row.sourceHref,
    sourceTopic: row.sourceTopic,
    at: row.createdAt.toISOString(),
  };
}

async function loadState(token: string): Promise<ChatState> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { token },
    select: {
      token: true,
      status: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          body: true,
          sourceHref: true,
          sourceTopic: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) return { token, status: "bot", turns: [], waitingForHuman: false };

  return {
    token: conversation.token,
    status: conversation.status === "human" ? "human" : conversation.status === "closed" ? "closed" : "bot",
    turns: conversation.messages.map(toTurn),
    waitingForHuman: conversation.status === "human",
  };
}

/** Starts a thread, or returns the one this browser already holds. */
export async function startChat(existingToken?: string): Promise<ChatState> {
  if (existingToken) {
    const found = await prisma.chatConversation.findUnique({
      where: { token: existingToken },
      select: { id: true },
    });
    if (found) return loadState(existingToken);
  }

  const limit = await guard("chat-start", LIMITS.start);
  if (!limit.allowed) return BUSY;

  const token = randomBytes(18).toString("base64url");
  const headerList = await headers();

  await prisma.chatConversation.create({
    data: {
      token,
      status: "bot",
      ipHash: limit.fingerprint,
      userAgent: headerList.get("user-agent")?.slice(0, 300) ?? null,
    },
  });

  return { token, status: "bot", turns: [], waitingForHuman: false };
}

export async function askChat(token: string, question: string): Promise<ChatState> {
  const trimmed = question.trim().slice(0, MAX_QUESTION);
  if (!trimmed) return loadState(token);

  const conversation = await prisma.chatConversation.findUnique({
    where: { token },
    select: { id: true, status: true, _count: { select: { messages: true } } },
  });

  // An unknown token used to open a fresh thread, which made this a way to
  // create rows without limit. Say nothing and write nothing instead.
  if (!conversation) return { token, status: "bot", turns: [], waitingForHuman: false };

  const limit = await guard("chat-ask", LIMITS.ask);

  // Checked before anything is written, so a blocked caller cannot keep filling
  // the table with the very messages we are refusing to answer.
  if (!limit.allowed) return loadState(token);

  if (conversation._count.messages >= MAX_MESSAGES_PER_CONVERSATION) {
    return loadState(token);
  }

  await prisma.chatMessage.create({
    data: { conversationId: conversation.id, role: "visitor", body: trimmed },
  });

  // Once a person is on the thread the bot stays quiet.
  if (conversation.status === "human") {
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    return loadState(token);
  }

  const result = await retrieve(trimmed);

  if (result.answers.length === 0) {
    const recent = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id, role: "bot" },
      orderBy: { createdAt: "desc" },
      take: FAILURES_BEFORE_OFFER,
      select: { unanswered: true },
    });

    const repeated =
      recent.length >= FAILURES_BEFORE_OFFER && recent.every((message) => message.unanswered);

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "bot",
        unanswered: true,
        body: repeated
          ? "I still cannot find that in what we have published, so let me stop guessing. Ask for a person and someone here will answer you directly."
          : "I could not find that in anything we have published, and I would rather say so than make something up. Try asking it another way, or ask for a person.",
      },
    });

    return loadState(token);
  }

  for (const answer of result.answers) {
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "bot",
        body: answer.text,
        sourceTopic: answer.topic,
        sourceHref: answer.href,
      },
    });
  }

  return loadState(token);
}

/** Hands the conversation to a person and puts it in the admin queue. */
export async function requestHuman(
  token: string,
  contact?: { name?: string; email?: string },
): Promise<ChatState> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { token },
    select: { id: true, status: true },
  });
  if (!conversation) return { token, status: "bot", turns: [], waitingForHuman: false };

  // Already with a person. Repeating the request must not repeat the message.
  if (conversation.status === "human") return loadState(token);

  const limit = await guard("chat-human", LIMITS.human);
  if (!limit.allowed) return loadState(token);

  const parsed = handoverSchema.safeParse({
    name: contact?.name ?? "",
    email: contact?.email ?? "",
  });
  const details = parsed.success ? parsed.data : { name: "", email: "" };

  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: {
      status: "human",
      escalatedAt: new Date(),
      name: details.name || null,
      email: details.email || null,
    },
  });

  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: "bot",
      body: details.email
        ? "Thanks. A person here will pick this up and reply, and we will email you as well so you do not have to keep this window open."
        : "Thanks. A person here will pick this up. Keep this window open and their reply will appear right here.",
    },
  });

  return loadState(token);
}

/** Polled by the panel so a human reply appears without a refresh. */
export async function pollChat(token: string): Promise<ChatState> {
  return loadState(token);
}

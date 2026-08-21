import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/db";
import { cx, formatDate, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Chats" };
export const dynamic = "force-dynamic";

export default async function AdminChatsPage() {
  const conversations = await prisma.chatConversation.findMany({
    where: { messages: { some: {} } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      status: true,
      name: true,
      email: true,
      escalatedAt: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, role: true },
      },
      _count: { select: { messages: true } },
    },
  });

  const waiting = conversations.filter((c) => c.status === "human").length;

  return (
    <>
      <h1 className="t-h2">Chats</h1>
      <p className="t-small mt-3 max-w-[56ch] text-[color:var(--color-text-muted)]">
        The assistant answers from published content only. When it cannot answer,
        or a visitor asks for a person, the conversation lands here.
        {waiting > 0 ? ` ${waiting} waiting for a reply.` : ""}
      </p>

      {conversations.length === 0 ? (
        <div className="mt-10 border-t border-[color:var(--color-line)] pt-8">
          <h2 className="t-h3">No conversations yet</h2>
          <p className="mt-3 text-[color:var(--color-text-muted)]">
            They will appear here as soon as someone uses the chat on the site.
          </p>
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <caption className="sr-only">Chat conversations</caption>
            <thead>
              <tr className="border-b border-[color:var(--color-line-strong)]">
                <th scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">Visitor</th>
                <th scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">Last message</th>
                <th scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">Turns</th>
                <th scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">Status</th>
                <th scope="col" className="t-label py-3 text-[color:var(--color-text-muted)]">Updated</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conversation) => (
                <tr key={conversation.id} className="border-b border-[color:var(--color-line)]">
                  <th scope="row" className="py-4 pr-4 font-normal">
                    <Link
                      href={`/admin/chats/${conversation.id}`}
                      className="text-[length:var(--text-body)] underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current"
                    >
                      {conversation.name || "Anonymous visitor"}
                    </Link>
                    {conversation.email ? (
                      <span className="t-caption block text-[color:var(--color-text-muted)]">
                        {conversation.email}
                      </span>
                    ) : null}
                  </th>
                  <td className="t-small py-4 pr-4 text-[color:var(--color-text-muted)]">
                    {truncate(conversation.messages[0]?.body ?? "", 70)}
                  </td>
                  <td className="t-small py-4 pr-4 tabular-nums">
                    {conversation._count.messages}
                  </td>
                  <td className="py-4 pr-4">
                    <span className={cx("pill", conversation.status === "human" && "pill--active")}>
                      {conversation.status === "human" ? "needs a person" : conversation.status}
                    </span>
                  </td>
                  <td className="t-small py-4">{formatDate(conversation.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { closeChat, deleteChatConversation, replyToChat } from "@/app/actions/admin";
import { prisma } from "@/lib/db";
import { cx, formatDate, isoDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Chat" };
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function AdminChatPage({ params }: { params: Params }) {
  const { id } = await params;

  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      name: true,
      email: true,
      escalatedAt: true,
      createdAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          body: true,
          sourceTopic: true,
          sourceHref: true,
          unanswered: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) notFound();

  const unanswered = conversation.messages.filter((m) => m.unanswered).length;

  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="t-caption flex flex-wrap items-center gap-2 text-[color:var(--color-text-muted)]">
          <li>
            <Link href="/admin" className="hover:underline">
              Overview
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/admin/chats" className="hover:underline">
              Chats
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{conversation.name || "Anonymous visitor"}</li>
        </ol>
      </nav>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="t-h2">{conversation.name || "Anonymous visitor"}</h1>
        <p className="t-caption text-[color:var(--color-text-muted)]">
          Started{" "}
          <time dateTime={isoDate(conversation.createdAt)}>
            {formatDate(conversation.createdAt)}
          </time>
        </p>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="transcript-heading">
          <h2 id="transcript-heading" className="t-label text-[color:var(--color-text-muted)]">
            Transcript
          </h2>

          <ol className="mt-5 flex flex-col gap-4">
            {conversation.messages.map((message) => (
              <li
                key={message.id}
                className={cx(
                  "flex flex-col",
                  message.role === "visitor" ? "items-start" : "items-end",
                )}
              >
                <p className="t-label mb-1.5 text-[color:var(--color-text-muted)]">
                  {message.role === "visitor"
                    ? "Visitor"
                    : message.role === "human"
                      ? "You"
                      : "Assistant"}
                </p>
                <div
                  className={cx(
                    "max-w-[46ch] px-4 py-3 text-[length:var(--text-small)] leading-[1.6]",
                    message.role === "visitor"
                      ? "bg-[color:var(--color-paper-warm)]"
                      : message.role === "human"
                        ? "bg-[color:var(--color-ink)] text-[color:var(--color-text-invert)]"
                        : cx(
                            "border border-[color:var(--color-line)]",
                            message.unanswered && "border-[color:var(--color-warning)]",
                          ),
                  )}
                >
                  {message.sourceTopic ? (
                    <p className="t-label mb-2 text-[color:var(--color-accent-text)]">
                      {message.sourceTopic}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  {message.sourceHref ? (
                    <p className="t-caption mt-2 text-[color:var(--color-text-muted)]">
                      Source: {message.sourceHref}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          <form action={replyToChat} className="mt-8 border-t-2 border-[color:var(--color-ink)] pt-5">
            <input type="hidden" name="id" value={conversation.id} />
            <div className="field">
              <label className="field__label" htmlFor="reply">
                Reply as Anvukta
              </label>
              <p className="field__hint" id="reply-hint">
                This appears in the visitor&rsquo;s chat window straight away.
              </p>
              <textarea
                id="reply"
                name="body"
                required
                minLength={2}
                maxLength={2000}
                className="field__control"
                aria-describedby="reply-hint"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="submit" className="btn btn-primary">
                Send reply
              </button>
            </div>
          </form>
        </section>

        <aside aria-labelledby="chat-side-heading">
          <div className="border-t-2 border-[color:var(--color-ink)] pt-5">
            <h2 id="chat-side-heading" className="t-label text-[color:var(--color-text-muted)]">
              This conversation
            </h2>
            <dl className="mt-4">
              {[
                ["Status", conversation.status === "human" ? "Needs a person" : conversation.status],
                ["Email", conversation.email ?? "Not given"],
                [
                  "Asked for a person",
                  conversation.escalatedAt ? formatDate(conversation.escalatedAt) : "No",
                ],
                ["Questions we could not answer", String(unanswered)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 border-t border-[color:var(--color-line)] py-3 last:border-b sm:flex-row sm:gap-4"
                >
                  <dt className="t-caption w-[13rem] shrink-0 text-[color:var(--color-text-muted)]">
                    {label}
                  </dt>
                  <dd className="t-small">{value}</dd>
                </div>
              ))}
            </dl>

            {unanswered > 0 ? (
              <p className="t-caption mt-5 border-l-2 border-[color:var(--color-warning)] pl-4 text-[color:var(--color-text-muted)]">
                {unanswered} question{unanswered === 1 ? "" : "s"} had no answer in
                published content. That is usually a sign the site is missing a page.
              </p>
            ) : null}
          </div>

          {conversation.email ? (
            <div className="mt-10 border-t border-[color:var(--color-line)] pt-5">
              <h2 className="t-label text-[color:var(--color-text-muted)]">Reply by email</h2>
              <a
                href={`mailto:${conversation.email}?subject=${encodeURIComponent("Following up on your question")}`}
                className="btn btn-secondary mt-4 w-full"
              >
                Email {conversation.name?.split(" ")[0] ?? "them"}
              </a>
            </div>
          ) : null}

          <form action={closeChat} className="mt-10">
            <input type="hidden" name="id" value={conversation.id} />
            <button type="submit" className="btn btn-secondary w-full">
              Mark as closed
            </button>
          </form>

          {/* Erasure. The privacy notice promises this, so it needs a button. */}
          <div className="mt-10 border-t border-[color:var(--color-line)] pt-5">
            <h2 className="t-eyebrow">Erase</h2>
            <p className="t-caption mt-3 text-[color:var(--color-text-muted)]">
              Deletes this record for good. Use it when someone asks us to remove
              their data. There is no undo.
            </p>
            <form action={deleteChatConversation} className="mt-4">
              <input type="hidden" name="id" value={conversation.id} />
              <button type="submit" className="btn btn-secondary w-full">
                Delete this conversation
              </button>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}

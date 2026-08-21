"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { askChat, pollChat, requestHuman, startChat } from "@/app/actions/chat";
import { onChatOpen } from "@/components/chat/chat-store";
import { Icon } from "@/components/ui/Icon";
import { CHAT_STORAGE_KEY, type ChatState } from "@/lib/chat-types";
import { mailtoHref, site, whatsappHref } from "@/lib/site";
import { cx } from "@/lib/utils";

const SUGGESTIONS = [
  "What do you actually do?",
  "How much does a diagnostic cost?",
  "Our AI pilot is stuck. Can you help?",
  "How do your engagements work?",
];

/** How often we check for a reply once a person is on the thread. */
const POLL_MS = 6000;

/**
 * The chat panel.
 *
 * Answers are passages retrieved from this site's own content, shown with a
 * link to where they live. Nothing is generated, so the chat can only repeat
 * something a person here has already written. When it cannot find an answer it
 * says so and offers to fetch a person, and a real reply lands in the same
 * window.
 */
export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ChatState | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHandover, setShowHandover] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  /** Set when a close should send focus back, so the effect knows to move it. */
  const returnFocusRef = useRef(false);

  /* ---------------- open / close ---------------- */

  const ensureStarted = useCallback(async () => {
    const stored =
      typeof window === "undefined" ? null : window.localStorage.getItem(CHAT_STORAGE_KEY);
    const next = await startChat(stored ?? undefined);
    // A refused start comes back without a token; storing that empty value
    // would leave a dead key behind for the next visit to read.
    if (next.token) window.localStorage.setItem(CHAT_STORAGE_KEY, next.token);
    setState(next);
    return next;
  }, []);

  const reveal = useCallback(
    (question?: string) => {
      setOpen(true);
      if (question) setDraft(question);
      // Starting the thread here, rather than in an effect that watches state,
      // keeps the open action in one place and avoids a cascading render.
      setState((current) => {
        if (!current) void ensureStarted();
        return current;
      });
    },
    [ensureStarted],
  );

  useEffect(() => onChatOpen(reveal), [reveal]);

  // Escape closes the panel. Focus goes back in the effect below, not here: the
  // launcher is display:none while the panel is open, so focusing it in the same
  // tick lands on nothing and the caret falls to the body.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      returnFocusRef.current = true;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Hand focus back once the launcher is on screen again.
  useEffect(() => {
    if (open || !returnFocusRef.current) return;
    returnFocusRef.current = false;
    launcherRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, state]);

  // Keep the newest turn in view.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [state]);

  /* ---------------- polling for a human reply ---------------- */

  useEffect(() => {
    if (!open || !state?.token || state.status !== "human") return;
    const id = window.setInterval(async () => {
      setState(await pollChat(state.token));
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [open, state?.token, state?.status]);

  /* ---------------- actions ---------------- */

  const send = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || busy) return;

      const current = state ?? (await ensureStarted());
      setBusy(true);
      setDraft("");

      // Show the visitor's line immediately rather than after the round trip.
      setState({
        ...current,
        turns: [
          ...current.turns,
          {
            id: `local-${Date.now()}`,
            role: "visitor",
            body: text,
            sourceHref: null,
            sourceTopic: null,
            at: new Date().toISOString(),
          },
        ],
      });

      try {
        setState(await askChat(current.token, text));
      } finally {
        setBusy(false);
      }
    },
    [busy, state, ensureStarted],
  );

  const handover = useCallback(
    async (name: string, email: string) => {
      const current = state ?? (await ensureStarted());
      setBusy(true);
      try {
        setState(await requestHuman(current.token, { name, email }));
        setShowHandover(false);
      } finally {
        setBusy(false);
      }
    },
    [state, ensureStarted],
  );

  const lastWasUnanswered =
    state?.turns.at(-1)?.role === "bot" &&
    !state?.turns.at(-1)?.sourceHref &&
    state?.status !== "human";

  /* ---------------- render ---------------- */

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => reveal()}
        aria-expanded={open}
        aria-controls="anvukta-chat"
        title="Chat with us"
        className={cx(
          // A round icon at every size. The worded version had to shrink on a
          // phone, and swapping the label in and out let it wrap inside a button
          // too narrow to hold it. One shape, nothing to reflow.
          "fixed bottom-5 right-5 z-[60] grid h-14 w-14 place-items-center rounded-full",
          "bg-[color:var(--color-ink)] text-[color:var(--color-text-invert)]",
          "shadow-[0_6px_24px_rgba(10,23,33,0.28)]",
          "transition-colors duration-150 hover:bg-[color:var(--color-accent-text)]",
          open && "hidden",
        )}
      >
        <Icon name="chat" size="lg" />
        <span className="sr-only">Chat with us</span>
      </button>

      <div
        id="anvukta-chat"
        ref={panelRef}
        hidden={!open}
        role="dialog"
        aria-label="Chat with Anvukta"
        className={cx(
          "fixed z-[60] flex flex-col border border-[color:var(--color-line-strong)]",
          "bg-[color:var(--color-paper)]",
          "inset-x-0 bottom-0 top-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(34rem,calc(100dvh-2.5rem))] sm:w-[24rem]",
        )}
      >
        {/* Header */}
        <div className="surface-ink flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="t-label text-[color:var(--color-accent-invert)]">
              {state?.status === "human" ? "A person is on this" : "Ask us anything"}
            </p>
            <p className="t-caption mt-1 text-[color:var(--color-text-invert-muted)]">
              {state?.status === "human"
                ? "Replies land right here."
                : "Answers come from what we have published."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              returnFocusRef.current = true;
            }}
            className="on-ink grid h-[2.75rem] w-[2.75rem] place-items-center text-[color:var(--color-text-invert)]"
          >
            <span className="sr-only">Close chat</span>
            <Icon name="close" size="md" />
          </button>
        </div>

        {/* Log */}
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto px-5 py-5"
          aria-live="polite"
          aria-atomic="false"
        >
          {!state || state.turns.length === 0 ? (
            <div>
              <p className="text-[length:var(--text-body)]">
                Ask about our services, how we work, or what something costs. If I
                cannot find it in what we have published, I will say so and get you
                a person.
              </p>
              <ul className="mt-5 flex flex-col gap-2">
                {SUGGESTIONS.map((question) => (
                  <li key={question}>
                    <button
                      type="button"
                      onClick={() => void send(question)}
                      className="t-small w-full border border-[color:var(--color-line-strong)] px-4 py-3 text-left transition-colors duration-150 hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-paper-warm)]"
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ol className="flex flex-col gap-4">
              {state.turns.map((turn) => (
                <li
                  key={turn.id}
                  className={cx(
                    "flex flex-col",
                    turn.role === "visitor" ? "items-end" : "items-start",
                  )}
                >
                  {turn.role !== "visitor" ? (
                    <p className="t-label mb-1.5 text-[color:var(--color-text-muted)]">
                      {turn.role === "human" ? "Anvukta" : "Assistant"}
                    </p>
                  ) : null}

                  <div
                    className={cx(
                      "max-w-[92%] px-4 py-3 text-[length:var(--text-small)] leading-[1.6]",
                      turn.role === "visitor"
                        ? "bg-[color:var(--color-ink)] text-[color:var(--color-text-invert)]"
                        : turn.role === "human"
                          ? "border-l-2 border-[color:var(--color-accent)] bg-[color:var(--color-paper-warm)]"
                          : "bg-[color:var(--color-paper-warm)]",
                    )}
                  >
                    {turn.sourceTopic ? (
                      <p className="t-label mb-2 text-[color:var(--color-accent-text)]">
                        {turn.sourceTopic}
                      </p>
                    ) : null}
                    <p>{turn.body}</p>
                    {turn.sourceHref ? (
                      <Link
                        href={turn.sourceHref}
                        onClick={() => setOpen(false)}
                        className="link t-caption mt-2 inline-flex min-h-[2rem] items-center gap-1.5"
                      >
                        Read the full page
                        <Icon name="arrow-right" size="sm" />
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {busy ? (
            <p className="t-caption mt-4 text-[color:var(--color-text-muted)]">Looking…</p>
          ) : null}

          {lastWasUnanswered && !showHandover ? (
            <button
              type="button"
              onClick={() => setShowHandover(true)}
              className="btn btn-primary mt-5 w-full"
            >
              Get me a person
            </button>
          ) : null}

          {showHandover ? <HandoverForm busy={busy} onSubmit={handover} /> : null}
        </div>

        {/* Composer */}
        <form
          className="border-t border-[color:var(--color-line)] p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="chat-input">
              Your question
            </label>
            <input
              ref={inputRef}
              id="chat-input"
              className="field__control"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                state?.status === "human" ? "Write to the team" : "Ask a question"
              }
              autoComplete="off"
              maxLength={500}
            />
            <button
              type="submit"
              className="btn btn-primary min-h-[3rem] px-4"
              disabled={busy || draft.trim().length === 0}
            >
              <span className="sr-only">Send</span>
              <Icon name="arrow-right" size="md" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="t-caption text-[color:var(--color-text-muted)]">
              Rather not chat?
            </span>
            <a
              className="grid h-[2.25rem] w-[2.25rem] place-items-center rounded-full border border-[color:var(--color-line-strong)] transition-colors duration-150 hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)] hover:text-white"
              href={mailtoHref()}
              title={`Email ${site.contact.email}`}
            >
              <Icon name="mail" size="sm" />
              <span className="sr-only">Email {site.contact.email}</span>
            </a>
            <a
              className="grid h-[2.25rem] w-[2.25rem] place-items-center rounded-full border border-[color:var(--color-line-strong)] transition-colors duration-150 hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)] hover:text-white"
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              title={`WhatsApp ${site.contact.whatsappDisplay}`}
            >
              <Icon name="whatsapp" size="sm" />
              <span className="sr-only">
                WhatsApp {site.contact.whatsappDisplay}, opens in a new tab
              </span>
            </a>
          </div>
        </form>
      </div>
    </>
  );
}

function HandoverForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (name: string, email: string) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <form
      className="mt-5 border-t-2 border-[color:var(--color-ink)] pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(name, email);
      }}
    >
      <p className="t-label">Hand this to a person</p>
      <p className="t-caption mt-2 text-[color:var(--color-text-muted)]">
        Leave an email and we can reply even if you close this window. Both fields
        are optional.
      </p>

      <div className="mt-3 flex flex-col gap-2">
        <label className="sr-only" htmlFor="chat-name">
          Your name
        </label>
        <input
          id="chat-name"
          className="field__control"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          autoComplete="name"
        />
        <label className="sr-only" htmlFor="chat-email">
          Your email
        </label>
        <input
          id="chat-email"
          type="email"
          className="field__control"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Work email"
          autoComplete="email"
        />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Sending…" : "Ask for a person"}
        </button>
      </div>
    </form>
  );
}

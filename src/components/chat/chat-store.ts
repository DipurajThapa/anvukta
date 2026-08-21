"use client";

/**
 * A one-line pub/sub so any button anywhere can open the chat panel without
 * threading state through the tree or pulling in a state library.
 */

const EVENT = "anvukta:chat-open";

export function openChat(question?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { question } }));
}

export function onChatOpen(handler: (question?: string) => void): () => void {
  const listener = (event: Event) => {
    handler((event as CustomEvent<{ question?: string }>).detail?.question);
  };
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

/**
 * Shapes shared between the chat panel and the server actions.
 * They live outside the "use server" module because an action file may only
 * export async functions.
 */

export type ChatRole = "visitor" | "bot" | "human";

export type ChatTurn = {
  id: string;
  role: ChatRole;
  body: string;
  /** Where a bot answer came from. Every bot turn links back to a real page. */
  sourceHref: string | null;
  sourceTopic: string | null;
  at: string;
};

export type ChatStatus = "bot" | "human" | "closed";

export type ChatState = {
  token: string;
  status: ChatStatus;
  turns: ChatTurn[];
  waitingForHuman: boolean;
};

export const CHAT_STORAGE_KEY = "anvukta_chat_token";

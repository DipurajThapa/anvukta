"use server";

import { createHash } from "node:crypto";

import { redirect } from "next/navigation";

import { authenticate, createSession, destroySession } from "@/lib/auth";
import type { LoginState } from "@/lib/form-state";
import { guard, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

const LIMITS = {
  perClient: { limit: 8, windowSeconds: 15 * 60 },
  /**
   * Sign-in attempts from callers carrying no cookie, which is what a guessing
   * script looks like. Kept apart from the ceiling below so that a stranger
   * hammering this form cannot lock the real administrator out of their own site.
   */
  anonymous: { limit: 40, windowSeconds: 15 * 60 },
  /** Everybody together. Only reachable during a genuine attack. */
  global: { limit: 600, windowSeconds: 15 * 60 },
} as const;

/**
 * Attempts allowed against one account, whoever is asking.
 *
 * Without this, guessing is only limited per client, and a client identifier
 * can be thrown away between attempts. Tying the count to the account being
 * targeted is what actually stops a password being worn down.
 */
const PER_ACCOUNT_ATTEMPTS = 10;
const PER_ACCOUNT_WINDOW_SECONDS = 15 * 60;

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });

  // Identical response for a malformed input, a missing account and a wrong
  // password — nothing here reveals whether an account exists.
  const genericError = "Email or password is incorrect.";

  if (!parsed.success) return { error: genericError };

  const tooMany = (seconds: number): LoginState => {
    const minutes = Math.ceil(seconds / 60);
    return {
      error: `Too many sign-in attempts. Try again in about ${minutes} minute${
        minutes === 1 ? "" : "s"
      }.`,
    };
  };

  const limit = await guard("login", LIMITS);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  // Counted against the account, not the caller, so rotating identity does not
  // reset it. The email is hashed so the table never lists who has been probed.
  const account = createHash("sha256")
    .update(parsed.data.email.toLowerCase())
    .digest("hex")
    .slice(0, 32);

  const perAccount = await rateLimit(
    `login-account:${account}`,
    PER_ACCOUNT_ATTEMPTS,
    PER_ACCOUNT_WINDOW_SECONDS,
  );
  if (!perAccount.allowed) return tooMany(perAccount.retryAfterSeconds);

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return { error: genericError };

  await resetRateLimit(`login-account:${account}`);
  await createSession(user.id);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

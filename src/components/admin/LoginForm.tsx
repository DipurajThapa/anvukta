"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { login } from "@/app/actions/auth";
import { initialLoginState } from "@/lib/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialLoginState);

  return (
    <form action={formAction} className="on-ink flex flex-col gap-5" noValidate>
      {state.error ? (
        <p
          role="alert"
          className="border-l-2 border-[color:var(--color-danger)] bg-[color:var(--color-ink-raised)] p-3 text-[length:var(--text-small)] text-[color:var(--color-text-invert)]"
        >
          {state.error}
        </p>
      ) : null}

      <div className="field">
        <label
          className="field__label text-[color:var(--color-text-invert)]"
          htmlFor="email"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="field__control bg-[color:var(--color-ink-raised)] text-[color:var(--color-text-invert)]"
          style={{ borderColor: "var(--color-line-invert)" }}
        />
      </div>

      <div className="field">
        <label
          className="field__label text-[color:var(--color-text-invert)]"
          htmlFor="password"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field__control bg-[color:var(--color-ink-raised)] text-[color:var(--color-text-invert)]"
          style={{ borderColor: "var(--color-line-invert)" }}
        />
      </div>

      <SubmitButton />
    </form>
  );
}

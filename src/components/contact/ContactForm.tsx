"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { submitContact } from "@/app/actions/contact";
import { initialContactState } from "@/lib/form-state";
import { SERVICE_INTERESTS, site } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="field__error" id={id}>
      <Icon name="error" size="sm" className="mt-0.5" />
      <span>{message}</span>
    </p>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContact, initialContactState);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const loadedAtRef = useRef<HTMLInputElement | null>(null);

  // Stamped on the DOM node rather than held in state: the value differs between
  // server and client, and it must not participate in rendering.
  useEffect(() => {
    if (loadedAtRef.current) loadedAtRef.current.value = String(Date.now());
  }, []);

  // Move focus to the result message so it is announced and reachable.
  useEffect(() => {
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="border-t-2 border-[color:var(--color-success)] pt-8"
      >
        <p className="t-eyebrow" style={{ color: "var(--color-success)" }}>
          <Icon name="check-circle" size="sm" />
          Message received
        </p>
        <h2 className="t-h2 mt-4 max-w-[18ch]">Thank you. That has reached us.</h2>
        <p className="measure mt-4 text-[color:var(--color-text-muted)]">
          {state.message}
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/blog" className="btn btn-secondary">
            Read our Insights
          </Link>
          <Link href="/" className="btn btn-secondary gap-2">
            <Icon name="arrow-left" size="sm" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const error = (field: string) => state.fieldErrors[field];
  const describedBy = (field: string) =>
    error(field) ? `${field}-error` : undefined;

  return (
    <form id="contact-form" action={formAction} noValidate className="flex flex-col gap-6">
      <div
        ref={statusRef}
        tabIndex={-1}
        role={state.status === "error" ? "alert" : undefined}
        className={cx(
          state.status === "error"
            ? "border-l-2 border-[color:var(--color-danger)] bg-[color:var(--color-paper-warm)] p-4"
            : "sr-only",
        )}
      >
        {state.status === "error" ? (
          <p className="t-small font-medium text-[color:var(--color-danger)]">
            {state.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label className="field__label" htmlFor="name">
            Full name <span aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="field__control"
            aria-invalid={error("name") ? true : undefined}
            aria-describedby={describedBy("name")}
          />
          <FieldError id="name-error" message={error("name")} />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="email">
            Work email <span aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            className="field__control"
            aria-invalid={error("email") ? true : undefined}
            aria-describedby={describedBy("email")}
          />
          <FieldError id="email-error" message={error("email")} />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="company">
            Company <span aria-hidden="true">*</span>
          </label>
          <input
            id="company"
            name="company"
            type="text"
            required
            autoComplete="organization"
            className="field__control"
            aria-invalid={error("company") ? true : undefined}
            aria-describedby={describedBy("company")}
          />
          <FieldError id="company-error" message={error("company")} />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="jobTitle">
            Job title <span className="normal-case opacity-60">(optional)</span>
          </label>
          <input
            id="jobTitle"
            name="jobTitle"
            type="text"
            autoComplete="organization-title"
            className="field__control"
            aria-invalid={error("jobTitle") ? true : undefined}
            aria-describedby={describedBy("jobTitle")}
          />
          <FieldError id="jobTitle-error" message={error("jobTitle")} />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="phone">
            Phone <span className="normal-case opacity-60">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            className="field__control"
            aria-invalid={error("phone") ? true : undefined}
            aria-describedby={describedBy("phone")}
          />
          <FieldError id="phone-error" message={error("phone")} />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="serviceInterest">
            Service of interest{" "}
            <span className="normal-case opacity-60">(optional)</span>
          </label>
          <select
            id="serviceInterest"
            name="serviceInterest"
            defaultValue=""
            className="field__control"
            aria-describedby={describedBy("serviceInterest")}
          >
            <option value="">Select an area</option>
            {SERVICE_INTERESTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError
            id="serviceInterest-error"
            message={error("serviceInterest")}
          />
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="message">
          Message / business challenge <span aria-hidden="true">*</span>
        </label>
        <p className="field__hint" id="message-hint">
          What is stalling, and what would a good outcome look like? A few
          sentences is plenty.
        </p>
        <textarea
          id="message"
          name="message"
          required
          minLength={20}
          maxLength={4000}
          className="field__control"
          aria-invalid={error("message") ? true : undefined}
          aria-describedby={
            error("message") ? "message-hint message-error" : "message-hint"
          }
        />
        <FieldError id="message-error" message={error("message")} />
      </div>

      <div className="field field--check">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          value="on"
          aria-invalid={error("consent") ? true : undefined}
          aria-describedby={describedBy("consent")}
        />
        <div>
          <label htmlFor="consent" className="t-small">
            I agree that Anvukta Consulting Service may use these details to respond to my
            enquiry. <span aria-hidden="true">*</span>
          </label>
          <p className="t-caption mt-2 text-[color:var(--color-text-muted)]">
            We use them for nothing else. See the{" "}
            <Link href="/privacy" className="link">
              privacy notice
            </Link>{" "}
            for what we keep and how to have it removed.
          </p>
          <FieldError id="consent-error" message={error("consent")} />
        </div>
      </div>

      {/* Spam controls — hidden from people, present for automation. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input
        ref={loadedAtRef}
        type="hidden"
        name="formLoadedAt"
        defaultValue=""
      />

      <div className="flex flex-col gap-4 border-t border-[color:var(--color-line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="t-caption max-w-[42ch] text-[color:var(--color-text-muted)]">
          Fields marked <span aria-hidden="true">*</span>
          <span className="sr-only">with an asterisk</span> are required. Or email{" "}
          <a href={`mailto:${site.contact.email}`} className="link">
            {site.contact.email}
          </a>
          .
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}

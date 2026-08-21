"use server";

import { headers } from "next/headers";

import { prisma } from "@/lib/db";
import { sendContactNotification } from "@/lib/mail";
import { guard } from "@/lib/rate-limit";
import type { ContactState } from "@/lib/form-state";
import { site } from "@/lib/site";
import { contactSchema, toFieldErrors } from "@/lib/validation";

const LIMITS = {
  perClient: { limit: 5, windowSeconds: 60 * 60 },
  /**
   * Enquiries from callers carrying no cookie. Comfortably above a real hour of
   * first-time visitors, far below what a flood needs, and separate from the
   * ceiling below so that filling it cannot turn away a returning visitor.
   */
  anonymous: { limit: 40, windowSeconds: 60 * 60 },
  /** Everybody together. Only reachable during a genuine attack. */
  global: { limit: 500, windowSeconds: 60 * 60 },
} as const;

/**
 * A genuine person needs at least a few seconds to complete the form.
 *
 * This reads the browser's clock and the browser can lie, so treat it as a
 * filter for careless automation rather than as a defence. The limits below are
 * the defence.
 */
const MIN_FILL_MS = 3000;

export async function submitContact(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    company: formData.get("company") ?? "",
    jobTitle: formData.get("jobTitle") ?? "",
    phone: formData.get("phone") ?? "",
    serviceInterest: formData.get("serviceInterest") ?? "",
    message: formData.get("message") ?? "",
    consent: formData.get("consent") ?? "",
    website: formData.get("website") ?? "",
    formLoadedAt: formData.get("formLoadedAt") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  // Spam control 1 — honeypot. Only automation fills a hidden field.
  if (data.website && data.website.length > 0) {
    return {
      status: "error",
      message: "This submission could not be accepted.",
      fieldErrors: {},
    };
  }

  // Spam control 2 — time trap.
  if (data.formLoadedAt && Date.now() - data.formLoadedAt < MIN_FILL_MS) {
    return {
      status: "error",
      message:
        "That was submitted very quickly. Please take a moment and send it again.",
      fieldErrors: {},
    };
  }

  // Spam control 3 — the real one: this sender's allowance, under a site-wide
  // ceiling that no amount of switching identities gets past.
  const limit = await guard("contact", LIMITS);
  const fingerprint = limit.fingerprint;

  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return {
      status: "error",
      message: `You have sent several messages recently. Please try again in about ${minutes} minute${
        minutes === 1 ? "" : "s"
      }, or email ${site.contact.email} directly.`,
      fieldErrors: {},
    };
  }

  try {
    const headerList = await headers();

    const submission = await prisma.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        company: data.company,
        jobTitle: data.jobTitle || null,
        phone: data.phone || null,
        serviceInterest: data.serviceInterest ?? null,
        message: data.message,
        consent: data.consent,
        status: "new",
        source: "website",
        ipHash: fingerprint,
        userAgent: headerList.get("user-agent")?.slice(0, 300) ?? null,
      },
    });

    const notification = await sendContactNotification({
      subject: `New enquiry from ${data.company}`,
      text: [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Company: ${data.company}`,
        data.jobTitle ? `Job title: ${data.jobTitle}` : null,
        data.phone ? `Phone: ${data.phone}` : null,
        data.serviceInterest ? `Service of interest: ${data.serviceInterest}` : null,
        "",
        data.message,
        "",
        `Reference: ${submission.id}`,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    });

    if (notification.sent) {
      await prisma.contactSubmission.update({
        where: { id: submission.id },
        data: { notifiedAt: new Date() },
      });
    }

    return {
      status: "success",
      message:
        "Thank you. Your message has reached us. A person reads every enquiry here, and we will reply within two working days.",
      fieldErrors: {},
    };
  } catch (error) {
    console.error("[contact] submission failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });

    return {
      status: "error",
      message: `Something went wrong saving your message. Please try again, or email ${site.contact.email} directly.`,
      fieldErrors: {},
    };
  }
}

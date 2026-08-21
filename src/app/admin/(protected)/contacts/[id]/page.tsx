import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteContactSubmission, updateContactStatus } from "@/app/actions/admin";
import { prisma } from "@/lib/db";
import { cx, formatDate, isoDate } from "@/lib/utils";
import { CONTACT_STATUSES } from "@/lib/validation";

export const metadata: Metadata = { title: "Enquiry" };
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ContactDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const entry = await prisma.contactSubmission.findUnique({ where: { id } });
  if (!entry) notFound();

  const details = [
    { label: "Name", value: entry.name },
    { label: "Work email", value: entry.email, href: `mailto:${entry.email}` },
    { label: "Company", value: entry.company },
    { label: "Job title", value: entry.jobTitle },
    {
      label: "Phone",
      value: entry.phone,
      href: entry.phone ? `tel:${entry.phone.replace(/[^+\d]/g, "")}` : undefined,
    },
    { label: "Service of interest", value: entry.serviceInterest },
    { label: "Consent given", value: entry.consent ? "Yes" : "No" },
    { label: "Source", value: entry.source },
    {
      label: "Notification email",
      value: entry.notifiedAt
        ? `Sent ${formatDate(entry.notifiedAt)}`
        : "Not sent. SMTP is not configured.",
    },
  ];

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
            <Link href="/admin/contacts" className="hover:underline">
              Enquiries
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{entry.name}</li>
        </ol>
      </nav>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="t-h2">{entry.name}</h1>
        <p className="t-caption text-[color:var(--color-text-muted)]">
          Received{" "}
          <time dateTime={isoDate(entry.createdAt)}>
            {formatDate(entry.createdAt)}
          </time>
        </p>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="message-heading">
          <h2 id="message-heading" className="t-eyebrow">
            Message
          </h2>
          <p className="measure mt-4 whitespace-pre-wrap text-[length:var(--text-body-lg)] leading-[1.7]">
            {entry.message}
          </p>

          <h2 className="t-eyebrow mt-12">Details</h2>
          <dl className="mt-4">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="flex flex-col gap-1 border-t border-[color:var(--color-line)] py-3 sm:flex-row sm:gap-6 last:border-b"
              >
                <dt className="t-caption w-[12rem] shrink-0 text-[color:var(--color-text-muted)]">
                  {detail.label}
                </dt>
                <dd className="t-small">
                  {detail.value ? (
                    detail.href ? (
                      <a href={detail.href} className="link">
                        {detail.value}
                      </a>
                    ) : (
                      detail.value
                    )
                  ) : (
                    <span className="text-[color:var(--color-text-muted)]">–</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <aside aria-labelledby="status-heading">
          <div className="border-t-2 border-[color:var(--color-ink)] pt-5">
            <h2 id="status-heading" className="t-eyebrow">
              Status
            </h2>
            <p className="t-small mt-4 text-[color:var(--color-text-muted)]">
              Currently <strong className="font-semibold">{entry.status}</strong>.
            </p>

            <ul className="mt-5 flex flex-col gap-2">
              {CONTACT_STATUSES.map((value) => (
                <li key={value}>
                  <form action={updateContactStatus}>
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="status" value={value} />
                    <button
                      type="submit"
                      disabled={entry.status === value}
                      className={cx(
                        "btn w-full",
                        entry.status === value ? "btn-primary" : "btn-secondary",
                      )}
                      aria-current={entry.status === value ? "true" : undefined}
                    >
                      Mark {value}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 border-t border-[color:var(--color-line)] pt-5">
            <h2 className="t-eyebrow">Reply</h2>
            <a
              href={`mailto:${entry.email}?subject=${encodeURIComponent(
                `Re: your enquiry, ${entry.company}`,
              )}`}
              className="btn btn-primary mt-4 w-full"
            >
              Email {entry.name.split(" ")[0]}
            </a>
          </div>

          {/* Erasure. The privacy notice promises this, so it needs a button. */}
          <div className="mt-10 border-t border-[color:var(--color-line)] pt-5">
            <h2 className="t-eyebrow">Erase</h2>
            <p className="t-caption mt-3 text-[color:var(--color-text-muted)]">
              Deletes this record for good. Use it when someone asks us to remove
              their data. There is no undo.
            </p>
            <form action={deleteContactSubmission} className="mt-4">
              <input type="hidden" name="id" value={entry.id} />
              <button type="submit" className="btn btn-secondary w-full">
                Delete this enquiry
              </button>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}

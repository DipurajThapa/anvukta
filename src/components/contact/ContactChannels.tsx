"use client";


import { Icon, type IconName } from "@/components/ui/Icon";
import { openChat } from "@/components/chat/chat-store";
import { mailtoHref, site, whatsappHref } from "@/lib/site";
import { cx } from "@/lib/utils";

type Tone = "ink" | "paper";

const CHANNELS: {
  id: string;
  icon: IconName;
  label: string;
  detail: string;
  blurb: string;
}[] = [
  {
    id: "email",
    icon: "mail",
    label: "Email us",
    detail: site.contact.email,
    blurb: "Best for a considered question. A person replies within two working days.",
  },
  {
    id: "whatsapp",
    icon: "whatsapp",
    label: "WhatsApp",
    detail: site.contact.whatsappDisplay,
    blurb: "Best when you want a quick answer during GCC working hours.",
  },
  {
    id: "chat",
    icon: "chat",
    label: "Chat with us",
    detail: "Answers from our own material",
    blurb: "Ask about our work and get a straight answer, with a person one click away.",
  },
];

/**
 * The three ways to start a conversation, shown as one consistent block.
 *
 * Email and WhatsApp are ordinary links, so they work with JavaScript off and
 * on any device. Chat opens the on-site panel.
 */
export function ContactChannels({
  tone = "paper",
  subject,
  className,
}: {
  tone?: Tone;
  /** Pre-fills the email subject and the first WhatsApp message. */
  subject?: string;
  className?: string;
}) {
  const dark = tone === "ink";

  const card = cx(
    "group flex h-full flex-col border p-5 text-left transition-colors duration-150",
    dark
      ? "border-[color:var(--color-line-invert)] hover:border-[color:var(--color-accent-invert)] hover:bg-[color:var(--color-ink-raised)]"
      : "border-[color:var(--color-line-strong)] hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-paper-warm)]",
  );

  const detailClass = cx(
    "t-caption mt-1 block break-words",
    dark ? "text-[color:var(--color-accent-invert)]" : "text-[color:var(--color-accent-text)]",
  );

  const blurbClass = cx(
    "t-caption mt-3 block text-pretty",
    dark ? "text-[color:var(--color-text-invert-muted)]" : "text-[color:var(--color-text-muted)]",
  );

  const iconWrap = cx(
    "grid h-[2.25rem] w-[2.25rem] place-items-center rounded-full transition-colors duration-150",
    dark
      ? "bg-[color:var(--color-ink-raised)] text-[color:var(--color-accent-invert)] group-hover:bg-[color:var(--color-accent-invert)] group-hover:text-[color:var(--color-ink)]"
      : "bg-[color:var(--color-paper-warm-2)] text-[color:var(--color-accent-text)] group-hover:bg-[color:var(--color-accent)] group-hover:text-white",
  );

  const body = (channel: (typeof CHANNELS)[number]) => (
    <>
      <span className={iconWrap}>
        <Icon name={channel.icon} size="sm" />
      </span>
      <span className="mt-4 block text-[length:var(--text-body)] font-semibold leading-snug">
        {channel.label}
      </span>
      <span className={detailClass}>{channel.detail}</span>
      <span className={blurbClass}>{channel.blurb}</span>
    </>
  );

  return (
    // Three across only once the column is wide enough for them. Below that
    // they stack, which reads better than three 170px slivers.
    <ul className={cx("grid gap-4 xl:grid-cols-3", className)}>
      {CHANNELS.map((channel) => (
        <li key={channel.id} className="contents">
          {channel.id === "email" ? (
            <a className={card} href={mailtoHref(subject)}>
              {body(channel)}
            </a>
          ) : channel.id === "whatsapp" ? (
            <a
              className={card}
              href={whatsappHref(
                subject
                  ? `Hello Anvukta, I am getting in touch about ${subject}.`
                  : undefined,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              {body(channel)}
            </a>
          ) : (
            <button type="button" className={card} onClick={() => openChat()}>
              {body(channel)}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * The compact form: a row of icon buttons.
 *
 * Icon-only, so it stays quiet next to a headline, but every button carries a
 * real accessible name and a hover tooltip. A short worded lead-in beside the
 * row tells a first-time reader what the icons are for, which is what stops an
 * unlabelled icon row from being a guessing game.
 */
export function ContactChannelLinks({
  tone = "paper",
  label = "Talk to us",
  className,
}: {
  tone?: Tone;
  /** Set to null to drop the lead-in where the surrounding copy already says it. */
  label?: string | null;
  className?: string;
}) {
  const dark = tone === "ink";

  const button = cx(
    "grid h-[3rem] w-[3rem] place-items-center rounded-full border transition-colors duration-150",
    dark
      ? "border-[color:var(--color-line-invert)] text-[color:var(--color-text-invert)] hover:border-[color:var(--color-accent-invert)] hover:bg-[color:var(--color-accent-invert)] hover:text-[color:var(--color-ink)]"
      : "border-[color:var(--color-line-strong)] hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)] hover:text-white",
  );

  return (
    <div className={cx("flex flex-wrap items-center gap-4", className)}>
      {label ? (
        <span
          className={cx(
            "t-action",
            dark
              ? "text-[color:var(--color-text-invert-muted)]"
              : "text-[color:var(--color-text-muted)]",
          )}
        >
          {label}
        </span>
      ) : null}

      <ul className="flex flex-wrap items-center gap-3">
        <li>
          <a className={button} href={mailtoHref()} title={`Email ${site.contact.email}`}>
            <Icon name="mail" size="md" />
            <span className="sr-only">Email {site.contact.email}</span>
          </a>
        </li>
        <li>
          <a
            className={button}
            href={whatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            title={`WhatsApp ${site.contact.whatsappDisplay}`}
          >
            <Icon name="whatsapp" size="md" />
            <span className="sr-only">
              WhatsApp {site.contact.whatsappDisplay}, opens in a new tab
            </span>
          </a>
        </li>
        <li>
          <button
            type="button"
            className={button}
            onClick={() => openChat()}
            title="Chat with us"
          >
            <Icon name="chat" size="md" />
            <span className="sr-only">Chat with us</span>
          </button>
        </li>
        {site.social.linkedin ? (
          <li>
            <a
              className={button}
              href={site.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              title="Anvukta on LinkedIn"
            >
              <Icon name="linkedin" size="md" />
              <span className="sr-only">Anvukta on LinkedIn, opens in a new tab</span>
            </a>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

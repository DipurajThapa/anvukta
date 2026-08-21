import type { ReactNode } from "react";

import { cx } from "@/lib/utils";

/** Motif 1 — the corner bracket that precedes every eyebrow label. */
export function BracketMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
      className={cx("shrink-0", className)}
    >
      <path
        d="M1 11V1h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Eyebrow({
  children,
  as: Tag = "p",
  className,
  id,
}: {
  children: ReactNode;
  as?: "p" | "h2" | "span" | "div";
  className?: string;
  id?: string;
}) {
  return (
    <Tag id={id} className={cx("t-eyebrow", className)}>
      <BracketMark />
      <span>{children}</span>
    </Tag>
  );
}

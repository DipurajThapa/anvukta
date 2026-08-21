import { cx } from "@/lib/utils";

/**
 * Original Anvukta Consulting Service mark.
 * Two angled strokes rise to a point and are joined by a horizontal bar — the
 * bridge between intent and execution described throughout the site.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="32"
      height="32"
      aria-hidden="true"
      focusable="false"
      className={cx("shrink-0", className)}
    >
      <path
        d="M4 28 16 4l12 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d="M9 19h14" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="19" r="2.75" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  className,
  showDescriptor = true,
}: {
  className?: string;
  showDescriptor?: boolean;
}) {
  return (
    <span className={cx("inline-flex items-center gap-3", className)}>
      <LogoMark className="h-[3rem] w-[3rem]" />
      <span className="flex flex-col leading-none">
        <span
          className="font-sans text-[0.9375rem] font-semibold uppercase tracking-[0.22em]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Anvukta
        </span>
        {showDescriptor ? (
          <span className="mt-1 text-[0.5625rem] uppercase tracking-[0.2em] opacity-70">
            Business, Technology &amp; AI
          </span>
        ) : null}
      </span>
    </span>
  );
}

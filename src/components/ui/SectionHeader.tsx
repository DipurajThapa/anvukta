import type { ReactNode } from "react";

import { Eyebrow } from "@/components/ui/Marks";
import { cx } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  heading: ReactNode;
  lead?: ReactNode;
  /** Heading level — sections on a page below the h1 use h2 by default. */
  level?: 2 | 3;
  headingId?: string;
  className?: string;
  rule?: boolean;
  align?: "start" | "center";
};

export function SectionHeader({
  eyebrow,
  heading,
  lead,
  level = 2,
  headingId,
  className,
  rule = false,
  align = "start",
}: SectionHeaderProps) {
  const Heading = level === 2 ? "h2" : "h3";

  return (
    <div
      className={cx(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Heading
        id={headingId}
        className={cx(level === 2 ? "t-h2" : "t-h3", "max-w-[20ch] sm:max-w-[24ch]")}
      >
        {heading}
      </Heading>
      {lead ? (
        <p className={cx("t-lead", align === "center" ? "measure-lead" : "measure-lead")}>
          {lead}
        </p>
      ) : null}
      {rule ? <hr className="rule mt-2" /> : null}
    </div>
  );
}

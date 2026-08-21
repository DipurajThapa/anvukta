"use client";

import { useEffect, useState } from "react";

import { pad2 } from "@/lib/utils";

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 122;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Spacing between the two centre lines, in the drawing's own units. */
const CENTRE_LINE_HEIGHT = 26;

/**
 * The engagement model, drawn as a ring that fills as the reader scrolls.
 *
 * A scroll listener tracks which stage has passed a reading line just above the
 * middle of the viewport. The arc fills to that stage and its node lights up, so
 * the diagram always shows the stage the words beside it are describing.
 *
 * Every transition is declared in CSS (see .ring-* in globals.css), so the
 * global reduced-motion rule switches them all off without any JavaScript
 * having to ask.
 *
 * The same information is in the list beside it, so a reader who never sees this
 * diagram loses nothing.
 */
export function EngagementRing({
  stages,
  titleId,
}: {
  stages: readonly { name: string }[];
  titleId: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const steps = Array.from(
      document.querySelectorAll<HTMLElement>("[data-stage-index]"),
    );
    if (steps.length === 0) return;

    // The active stage is the last one whose heading has passed a reading line
    // set a little above the middle of the viewport. That is deterministic, it
    // matches what the reader is actually looking at, and unlike an
    // intersection ratio it always reaches the final stage at the end of a page.
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.42;

      let next = 0;
      for (const step of steps) {
        if (step.getBoundingClientRect().top <= line) {
          next = Number(step.dataset["stageIndex"] ?? 0);
        }
      }
      setActive(next);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    frame = requestAnimationFrame(update);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const point = (index: number) => {
    const angle = ((index * (360 / stages.length) - 90) * Math.PI) / 180;
    return {
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    };
  };

  // Two words joined by an ampersand are the only names long enough to need a
  // second line, and the ampersand is the natural place to break.
  const activeName = stages[active]?.name ?? "";
  const centreLines = activeName.includes("&")
    ? [`${activeName.split("&")[0]?.trim()} &`, activeName.split("&")[1]?.trim() ?? ""]
    : [activeName];

  // Fill through the middle of the active node, so the arc ends on it.
  const progress = (active + 0.5) / stages.length;
  const description = `A ring of ${stages.length} engagement stages: ${stages
    .map((stage) => stage.name)
    .join(", ")}. Stage ${active + 1}, ${stages[active]?.name}, is showing.`;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-labelledby={titleId}
      focusable="false"
      className="h-auto w-full max-w-[20rem]"
      style={{ aspectRatio: "1 / 1" }}
    >
      <title id={titleId}>{description}</title>

      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.16"
        strokeWidth="1"
      />

      <circle
        className="ring-fill"
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
      />

      {stages.map((stage, index) => {
        const { x, y } = point(index);
        const isActive = index === active;
        const isDone = index < active;

        return (
          <g key={stage.name}>
            <circle
              className="ring-node"
              cx={x}
              cy={y}
              r="17"
              fill={isActive ? "var(--color-accent)" : "var(--color-paper)"}
              stroke={isActive || isDone ? "var(--color-accent)" : "currentColor"}
              strokeOpacity={isActive || isDone ? 1 : 0.35}
              strokeWidth={isActive ? 2 : 1}
            />
            <text
              className="ring-numeral t-micro"
              x={x}
              y={y + 4}
              textAnchor="middle"
              fontWeight={isActive ? 600 : 400}
              fill={isActive ? "#ffffff" : "currentColor"}
              fillOpacity={isActive ? 1 : isDone ? 0.85 : 0.55}
            >
              {pad2(index + 1)}
            </text>
          </g>
        );
      })}

      {/* Centre: the stage currently being read.

          SVG text does not wrap, so a two-part name like "Mobilise & Govern"
          would run straight out through the ring. Split it at the ampersand and
          draw it as two lines that sit inside the circle. */}
      <text
        x={CENTER}
        y={CENTER - (centreLines.length > 1 ? 26 : 14)}
        textAnchor="middle"
        fill="currentColor"
        fillOpacity="0.55"
        className="ring-label"
      >
        STAGE {pad2(active + 1)}
      </text>
      <text
        x={CENTER}
        y={CENTER + (centreLines.length > 1 ? 2 : 12)}
        textAnchor="middle"
        fill="currentColor"
        className="ring-stage"
      >
        {centreLines.map((line, index) => (
          <tspan key={line} x={CENTER} dy={index === 0 ? 0 : CENTRE_LINE_HEIGHT}>
            {line}
          </tspan>
        ))}
      </text>
    </svg>
  );
}

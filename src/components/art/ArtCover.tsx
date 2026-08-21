import { cx } from "@/lib/utils";

type ArtCoverProps = {
  /** Any stable string (a slug) — the same seed always draws the same cover. */
  seed: string;
  className?: string;
  variant?: "wide" | "square";
};

function hash(seed: string): number {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

/**
 * Deterministic original cover art for Insights articles that have no hero
 * image. Structural geometry, not decoration for its own sake — and only a few
 * hundred bytes, so it costs nothing on mobile.
 */
export function ArtCover({ seed, className, variant = "wide" }: ArtCoverProps) {
  const value = hash(seed);
  const width = 600;
  const height = variant === "square" ? 600 : 400;

  const bars = 9;
  const step = width / (bars + 1);
  const heights = Array.from({ length: bars }, (_, index) => {
    const local = (value >> (index % 12)) % 100;
    return 0.24 + (local / 100) * 0.62;
  });

  const diagonalFromTop = value % 2 === 0;

  return (
    <div
      className={cx(
        "relative w-full overflow-hidden bg-[color:var(--color-ink)] text-[color:var(--color-accent-invert)]",
        className,
      )}
      style={{ aspectRatio: variant === "square" ? "1 / 1" : "3 / 2" }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 h-full w-full"
      >
        <g stroke="currentColor" strokeOpacity="0.16" strokeWidth="1">
          {Array.from({ length: 6 }, (_, index) => (
            <line
              key={`grid-${index}`}
              x1="0"
              y1={(height / 6) * (index + 1)}
              x2={width}
              y2={(height / 6) * (index + 1)}
            />
          ))}
        </g>

        <g fill="currentColor">
          {heights.map((ratio, index) => (
            <rect
              key={`bar-${index}`}
              x={step * (index + 1) - 9}
              y={height - height * ratio}
              width="18"
              height={height * ratio}
              opacity={index % 3 === 0 ? 0.5 : 0.22}
            />
          ))}
        </g>

        <path
          d={
            diagonalFromTop
              ? `M0 ${height * 0.18} L${width} ${height * 0.72}`
              : `M0 ${height * 0.76} L${width} ${height * 0.2}`
          }
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.75"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

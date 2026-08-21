import { ImageResponse } from "next/og";

import { site } from "@/lib/site";

export const alt = `${site.name} | ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Site-wide social card. Generated once at build time as a real PNG, so every
 * page has a reliable Open Graph preview without shipping a binary asset.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a1721",
          color: "#f7f5f1",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <svg width="48" height="48" viewBox="0 0 32 32">
            <path
              d="M4 28 16 4l12 24"
              fill="none"
              stroke="#dfae63"
              strokeWidth="2"
            />
            <path d="M9 19h14" fill="none" stroke="#dfae63" strokeWidth="2" />
            <circle cx="16" cy="19" r="2.75" fill="#dfae63" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 26,
                letterSpacing: "8px",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Anvukta
            </span>
            <span
              style={{
                fontSize: 14,
                letterSpacing: "4px",
                textTransform: "uppercase",
                color: "#b7c4ce",
                marginTop: 6,
              }}
            >
              Business, Technology &amp; AI
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 84, lineHeight: 1.05, letterSpacing: "-2px" }}>
            {site.tagline}
          </span>
          <span
            style={{
              fontSize: 28,
              lineHeight: 1.45,
              color: "#b7c4ce",
              marginTop: 28,
              maxWidth: 900,
            }}
          >
            Senior-led advisory connecting executive intent, technology decisions
            and disciplined delivery.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            borderTop: "2px solid #dfae63",
            paddingTop: 24,
            fontSize: 22,
            color: "#b7c4ce",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          Diagnose · Prioritise · Design · Mobilise · Measure
        </div>
      </div>
    ),
    size,
  );
}

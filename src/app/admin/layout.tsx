import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

/** Nothing under /admin is ever indexable. */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Anvukta Admin" },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a1721",
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

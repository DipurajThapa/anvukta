import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/ui/Logo";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Already signed in — no reason to show the form again.
  if (await getSessionUser()) redirect("/admin");

  return (
    <main className="surface-ink flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-[26rem]">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>

        <h1 className="t-h2 mt-10 text-[color:var(--color-text-invert)]">
          Sign in
        </h1>
        <p className="t-small mt-3 text-[color:var(--color-text-invert-muted)]">
          Administration for Insights and contact enquiries.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>

        <p className="t-caption mt-8 text-[color:var(--color-text-invert-muted)]">
          <Link href="/" className="link">
            Return to the website
          </Link>
        </p>
      </div>
    </main>
  );
}

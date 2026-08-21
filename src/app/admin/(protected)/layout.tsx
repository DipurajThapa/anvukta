import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/ui/Logo";
import { getSessionUser } from "@/lib/auth";

const adminNav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/blog", label: "Insights" },
  { href: "/admin/contacts", label: "Enquiries" },
  { href: "/admin/chats", label: "Chats" },
];

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();

  // Server-side gate. Every action re-checks independently.
  if (!user) redirect("/admin/login");

  return (
    <>
      <a className="skip-link" href="#admin-main">
        Skip to content
      </a>

      <header className="surface-ink">
        <div className="frame flex flex-wrap items-center justify-between gap-4 py-4">
          <Link href="/admin" className="py-1">
            <Logo showDescriptor={false} />
          </Link>

          <nav aria-label="Admin">
            <ul className="flex flex-wrap items-center gap-6">
              {adminNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="navlink">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <span className="t-caption text-[color:var(--color-text-invert-muted)]">
              {user.name}
            </span>
            <Link
              href="/"
              className="t-caption text-[color:var(--color-text-invert-muted)] underline underline-offset-4"
            >
              View site
            </Link>
            <form action={logout}>
              <button type="submit" className="btn btn-secondary min-h-[2.75rem] px-4">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main id="admin-main" className="frame py-10">
        {children}
      </main>
    </>
  );
}

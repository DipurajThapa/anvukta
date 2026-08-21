"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { PRIMARY_CTA, primaryNav, site, whatsappHref } from "@/lib/site";
import { cx } from "@/lib/utils";

/**
 * The header sits over the dark hero on the homepage and turns solid once the
 * page scrolls. Everywhere else it is solid from the start.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  // On the contact page itself the call to action would otherwise reload the
  // page you are already on. Send it to the form instead.
  const ctaHref =
    pathname === PRIMARY_CTA.href ? `${PRIMARY_CTA.href}#contact-form` : PRIMARY_CTA.href;

  const [pastTop, setPastTop] = useState(false);
  const [open, setOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  // Only the homepage has a dark hero for the header to sit over.
  const scrolled = !isHome || pastTop;

  useEffect(() => {
    if (!isHome) return;

    const onScroll = () => setPastTop(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Catch a page restored mid-scroll, without setting state in the effect body.
    const frame = requestAnimationFrame(onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isHome]);

  // Lock body scroll and trap focus while the mobile panel is open.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const inPanel = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      // The toggle doubles as the close button and lives outside the panel, so
      // add it to the front of the cycle. Without it the only way out by
      // keyboard is Escape, which not everyone will think to try.
      const focusables = [toggleRef.current, ...Array.from(inPanel ?? [])].filter(
        (element): element is HTMLElement => element !== null,
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const isCurrent = useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  const overHero = isHome && !scrolled && !open;

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 transition-colors duration-200",
        // The header owns a stacking context, so the open menu inside it can
        // never rise above the floating chat button unless the header does
        // first. Without this the button hovers over the open menu.
        open ? "z-[70]" : "z-50",
        overHero
          ? "on-ink border-b border-transparent text-[color:var(--color-text-invert)]"
          : "border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)] text-[color:var(--color-text)]",
      )}
    >
      <div className="frame flex h-[var(--header-h)] items-center justify-between gap-6">
        <Link href="/" className="-ml-1 rounded-[1px] px-1 py-2">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="navlink"
                  aria-current={
                    pathname === item.href
                      ? "page"
                      : isCurrent(item.href)
                        ? "true"
                        : undefined
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href={ctaHref} className="btn btn-primary">
            {PRIMARY_CTA.label}
          </Link>

          {/* For anyone who would rather not write a message at all. */}
          <a
            href={whatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            title={`WhatsApp ${site.contact.whatsappDisplay}`}
            className="grid h-[3rem] w-[3rem] place-items-center rounded-full border border-[color:var(--color-line-strong)] transition-colors duration-150 hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)] hover:text-white"
          >
            <Icon name="whatsapp" size="md" />
            <span className="sr-only">
              WhatsApp {site.contact.whatsappDisplay}, opens in a new tab
            </span>
          </a>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="-mr-2 flex h-[3rem] w-[3rem] items-center justify-center lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className="relative block h-4 w-[1.5rem]">
            <span
              className={cx(
                "absolute left-0 block h-[2px] w-[1.5rem] bg-current transition-transform duration-200",
                open ? "top-[7px] rotate-45" : "top-0",
              )}
            />
            <span
              className={cx(
                "absolute left-0 top-[7px] block h-[2px] w-[1.5rem] bg-current transition-opacity duration-200",
                open ? "opacity-0" : "opacity-100",
              )}
            />
            <span
              className={cx(
                "absolute left-0 block h-[2px] w-[1.5rem] bg-current transition-transform duration-200",
                open ? "top-[7px] -rotate-45" : "top-[14px]",
              )}
            />
          </span>
        </button>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-nav"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-[65] overflow-y-auto border-t border-[color:var(--color-line)] bg-[color:var(--color-paper)] lg:hidden"
      >
        <nav aria-label="Primary mobile" className="frame py-6">
          <ul className="flex flex-col">
            {primaryNav.map((item) => (
              <li key={item.href} className="border-b border-[color:var(--color-line)]">
                <Link
                  href={item.href}
                  className="flex min-h-14 items-center justify-between py-4 font-serif text-[1.375rem]"
                  aria-current={
                    pathname === item.href
                      ? "page"
                      : isCurrent(item.href)
                        ? "true"
                        : undefined
                  }
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-3">
            <Link
              href={ctaHref}
              className="btn btn-primary flex-1"
              onClick={() => setOpen(false)}
            >
              {PRIMARY_CTA.label}
            </Link>

            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              title={`WhatsApp ${site.contact.whatsappDisplay}`}
              onClick={() => setOpen(false)}
              className="grid h-[3rem] w-[3rem] flex-none place-items-center rounded-full border border-[color:var(--color-line-strong)] transition-colors duration-150 hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)] hover:text-white"
            >
              <Icon name="whatsapp" size="md" />
              <span className="sr-only">
                WhatsApp {site.contact.whatsappDisplay}, opens in a new tab
              </span>
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}

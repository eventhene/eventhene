"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    function onScroll() {
      close();
    }
    function onTouchMove(e: TouchEvent) {
      const menu = document.getElementById("mobile-nav-panel");
      if (menu && !menu.contains(e.target as Node)) {
        e.preventDefault();
        close();
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, [open, close]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 bg-black/60 z-30"
            onClick={close}
          />

          {/* Menu panel */}
          <div
            id="mobile-nav-panel"
            className="fixed top-16 inset-x-0 z-40 bg-[#0a0a0c] border-t border-white/10 px-5 py-6 animate-fade-up"
          >
            <div className="flex flex-col gap-1 text-sm font-semibold">
              <MLink href="/events" onClick={close}>Discover</MLink>
              <MLink href="/pricing" onClick={close}>Pricing</MLink>
              <MLink href="/services" onClick={close}>Services</MLink>
              <MLink href="/tickets/lookup" onClick={close}>Find ticket</MLink>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" onClick={close} className="btn-ghost-dark btn-lg w-full">Dashboard</Link>
                  <Link href="/dashboard/events/new" onClick={close} className="btn-gold btn-lg w-full">New event</Link>
                </>
              ) : (
                <>
                  <Link href="/sign-in" onClick={close} className="btn-ghost-dark btn-lg w-full">Sign in</Link>
                  <Link href="/sign-up" onClick={close} className="btn-gold btn-lg w-full">Get started</Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-3 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition"
    >
      {children}
    </Link>
  );
}

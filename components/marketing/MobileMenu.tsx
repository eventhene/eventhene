"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

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
        <div className="absolute top-16 inset-x-0 glass-dark border-t border-white/5 px-5 py-6 animate-fade-up">
          <div className="flex flex-col gap-1 text-sm font-semibold">
            <MLink href="/events" onClick={() => setOpen(false)}>Discover</MLink>
            <MLink href="/pricing" onClick={() => setOpen(false)}>Pricing</MLink>
            <MLink href="/services" onClick={() => setOpen(false)}>Services</MLink>
            <MLink href="/tickets/lookup" onClick={() => setOpen(false)}>Find ticket</MLink>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-ghost-dark btn-lg w-full">Dashboard</Link>
                <Link href="/dashboard/events/new" onClick={() => setOpen(false)} className="btn-gold btn-lg w-full">New event</Link>
              </>
            ) : (
              <>
                <Link href="/sign-in" onClick={() => setOpen(false)} className="btn-ghost-dark btn-lg w-full">Sign in</Link>
                <Link href="/sign-up" onClick={() => setOpen(false)} className="btn-gold btn-lg w-full">Get started</Link>
              </>
            )}
          </div>
        </div>
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

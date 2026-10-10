"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, Shield, LayoutDashboard, ListChecks, CalendarDays, Users, MessageSquare, Briefcase,
  Headphones, Ticket, Mail, Globe, ArrowLeft,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";

const GROUPS: { label: string; items: { href: string; label: string; icon: React.ReactNode }[] }[] = [
  {
    label: "Manage",
    items: [
      { href: "/superadmin", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" /> },
      { href: "/superadmin/free-events", label: "Free event queue", icon: <ListChecks className="w-5 h-5" /> },
      { href: "/superadmin/events", label: "All events", icon: <CalendarDays className="w-5 h-5" /> },
      { href: "/superadmin/organizers", label: "Organizers", icon: <Users className="w-5 h-5" /> },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/superadmin/sms", label: "SMS and Sender IDs", icon: <MessageSquare className="w-5 h-5" /> },
      { href: "/superadmin/services", label: "Service inquiries", icon: <Briefcase className="w-5 h-5" /> },
      { href: "/superadmin/support", label: "Support", icon: <Headphones className="w-5 h-5" /> },
      { href: "/superadmin/coupons", label: "Coupons", icon: <Ticket className="w-5 h-5" /> },
      { href: "/superadmin/email", label: "Email setup", icon: <Mail className="w-5 h-5" /> },
      { href: "/superadmin/domain", label: "Domain", icon: <Globe className="w-5 h-5" /> },
    ],
  },
];

export function AdminMobileNav({ email, role }: { email: string; role: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 glass-dark px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo variant="icon" size="md" />
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-crimson">
            <Shield className="w-3.5 h-3.5" />
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-2 -mr-2 rounded-xl text-white/70 hover:bg-white/5"
          aria-label="Open admin menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[84%] max-w-sm overflow-y-auto border-l border-white/10 bg-[#0f0f13] p-4 pb-10 shadow-2xl">
            <div className="flex items-center justify-between px-1 pb-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{email}</p>
                <p className="text-[11px] font-semibold text-crimson">{role}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 text-white/50" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>

            {GROUPS.map((g) => (
              <div key={g.label} className="mt-3">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{g.label}</p>
                {g.items.map((it) => {
                  const active = pathname === it.href;
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                        active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5"
                      }`}
                    >
                      {it.icon}
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            ))}

            <div className="mt-3">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">Account</p>
              <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/65 hover:bg-white/5">
                <ArrowLeft className="w-5 h-5" />
                My dashboard
              </Link>
              <SignOutButton className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/50 hover:bg-white/5" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

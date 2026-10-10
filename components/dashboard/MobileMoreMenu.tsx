"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, PlusCircle, Users, Briefcase, Settings, X, ScrollText } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

export function MobileMoreMenu({ isOwner }: { isOwner: boolean }) {
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

  const item = "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/5 transition";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-0.5 text-[10px] py-1.5 font-semibold text-white/40"
        aria-label="More"
      >
        <MoreHorizontal className="w-4 h-4" />
        More
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 rounded-t-3xl border-t border-white/10 bg-[#121216] p-4 pb-8 shadow-2xl">
            <div className="flex items-center justify-between px-2 pb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">More</p>
              <button onClick={() => setOpen(false)} className="p-1.5 text-white/40" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Link href="/dashboard/events/new" className={`${item} text-accent`}>
              <PlusCircle className="w-5 h-5" />
              Create event
            </Link>
            {isOwner && (
              <Link href="/dashboard/team" className={item}>
                <Users className="w-5 h-5" />
                Team
              </Link>
            )}
            <Link href="/dashboard/services" className={item}>
              <Briefcase className="w-5 h-5" />
              Services
            </Link>
            <Link href="/dashboard/audit" className={item}>
              <ScrollText className="w-5 h-5" />
              Activity log
            </Link>
            {isOwner && (
              <Link href="/dashboard/settings" className={item}>
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            )}
            <SignOutButton className={`${item} w-full text-left text-white/50`} />
          </div>
        </div>
      )}
    </>
  );
}

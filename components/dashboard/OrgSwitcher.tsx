"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

interface Org {
  id: string;
  name: string;
  access: "OWNER" | "MANAGER";
}

export function OrgSwitcher({ currentId, orgs, compact }: { currentId: string; orgs: Org[]; compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const current = orgs.find((o) => o.id === currentId) ?? orgs[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function choose(id: string) {
    if (id === currentId) return setOpen(false);
    setBusyId(id);
    try {
      const res = await fetch("/api/team/switch", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizerId: id }),
      });
      if (res.ok) {
        setOpen(false);
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-left ${compact ? "px-2.5 py-1.5" : "px-3 py-2.5"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="block text-[9px] uppercase tracking-wider text-white/35">Working in</span>
          <span className="block text-sm font-semibold text-white truncate">{current.name}</span>
        </span>
        <ChevronsUpDown className="w-4 h-4 text-white/40 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[220px] rounded-xl border border-white/10 bg-[#121216] p-1.5 shadow-2xl" role="listbox">
          {orgs.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={o.id === currentId}
              onClick={() => choose(o.id)}
              className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-white/5 transition"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white truncate">{o.name}</span>
                <span className="block text-[10px] uppercase tracking-wider text-white/40">{o.access === "OWNER" ? "Your organizer" : "Manager"}</span>
              </span>
              {busyId === o.id ? <Loader2 className="w-4 h-4 animate-spin text-white/50" /> : o.id === currentId ? <Check className="w-4 h-4 text-accent" /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

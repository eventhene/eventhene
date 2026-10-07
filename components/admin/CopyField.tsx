"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyField({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {}
  }
  return (
    <div>
      {label && <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">{label}</p>}
      <button
        type="button"
        onClick={copy}
        className="w-full flex items-center justify-between gap-3 rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-left hover:bg-black/40 transition"
      >
        <span className="font-mono text-xs sm:text-sm text-white break-all">{value}</span>
        <span className="shrink-0 text-white/40">{done ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}</span>
      </button>
    </div>
  );
}

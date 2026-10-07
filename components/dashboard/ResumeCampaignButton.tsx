"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";

export function ResumeCampaignButton({ campaignId, pending }: { campaignId: string; pending: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(pending);
  const [err, setErr] = useState("");

  async function resume() {
    setBusy(true);
    setErr("");
    try {
      for (let i = 0; i < 400; i++) {
        const res = await fetch(`/api/sms/campaigns/${campaignId}/run`, { method: "POST", credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not continue sending.");
        setLeft(data.remaining);
        if (data.done) break;
        if (data.busy) await new Promise((r) => setTimeout(r, 2500));
      }
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={resume}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 border border-accent/30 px-2.5 py-1 text-[11px] font-bold text-accent hover:bg-accent/25 transition disabled:opacity-70"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
        {busy ? `Sending... ${left} left` : `Resume (${left} left)`}
      </button>
      {err && <p className="text-[10px] text-red-400 mt-1">{err}</p>}
    </div>
  );
}

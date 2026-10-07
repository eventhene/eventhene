"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";

export function ServiceInquiryForm({
  serviceType,
  serviceTitle,
  dark = false,
  defaults,
}: {
  serviceType: string;
  serviceTitle: string;
  dark?: boolean;
  defaults?: { name?: string; email?: string; phone?: string };
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/services/inquiries", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceType,
          contactName: fd.get("contactName"),
          contactEmail: fd.get("contactEmail"),
          contactPhone: (fd.get("contactPhone") as string) || undefined,
          message: fd.get("message"),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit. Please check your details and try again.");
      setDone(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const input = dark ? "input text-white text-sm" : "input text-sm";

  if (done) {
    return (
      <div className="mt-5 rounded-xl bg-emerald-500/10 text-emerald-400 p-4 text-sm flex items-center gap-2">
        <CheckCircle className="w-4 h-4 shrink-0" />
        Got it. We will be in touch within 24 hours.
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={`${dark ? "btn-ghost-dark" : "btn-ghost"} btn-sm mt-5`}>
        Request this service
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-2">
      <p className={`text-xs ${dark ? "text-white/40" : "text-ink-muted"}`}>
        Request: <strong className={dark ? "text-white" : ""}>{serviceTitle}</strong>
      </p>
      <input name="contactName" required defaultValue={defaults?.name} placeholder="Your name" className={input} />
      <input name="contactEmail" type="email" required defaultValue={defaults?.email} placeholder="Email" className={input} />
      <input name="contactPhone" defaultValue={defaults?.phone} placeholder="Phone (optional)" className={input} />
      <textarea name="message" required minLength={5} placeholder="Tell us about your event..." className={input} rows={3} />
      {err && <p className="text-xs text-red-400">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={`${dark ? "btn-gold" : "btn-primary"} btn-sm flex-1 flex items-center justify-center gap-2`}>
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {busy ? "Sending..." : "Send request"}
        </button>
        <button type="button" onClick={() => setOpen(false)} disabled={busy} className={`${dark ? "btn-ghost-dark" : "btn-ghost"} btn-sm`}>
          Cancel
        </button>
      </div>
    </form>
  );
}

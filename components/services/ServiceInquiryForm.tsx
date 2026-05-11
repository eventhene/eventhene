"use client";

import { useState } from "react";

export function ServiceInquiryForm({
  serviceType,
  serviceTitle
}: {
  serviceType: string;
  serviceTitle: string;
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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceType,
          contactName: fd.get("contactName"),
          contactEmail: fd.get("contactEmail"),
          contactPhone: fd.get("contactPhone"),
          message: fd.get("message")
        })
      });
      if (!res.ok) throw new Error("Failed to submit");
      setDone(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary mt-4 text-sm">
        Request this service
      </button>
    );
  }

  if (done) {
    return (
      <div className="mt-4 rounded-xl bg-success/10 text-success p-4 text-sm">
        ✓ Got it. We'll be in touch within 24 hours.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-2">
      <p className="text-xs text-ink-muted">Request: <strong>{serviceTitle}</strong></p>
      <input name="contactName" required placeholder="Your name" className="input text-sm" />
      <input name="contactEmail" type="email" required placeholder="Email" className="input text-sm" />
      <input name="contactPhone" placeholder="Phone (optional)" className="input text-sm" />
      <textarea name="message" required placeholder="Tell us about your event…" className="input text-sm" rows={3} />
      {err && <p className="err">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary text-sm flex-1">
          {busy ? "Sending…" : "Send request"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";

export default function TicketLookupPage() {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setResults(null);
    try {
      const params = new URLSearchParams();
      if (ref) params.set("ref", ref);
      else if (email) params.set("email", email);
      const res = await fetch(`/api/tickets/lookup?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setResults(data.tickets);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="h-display text-3xl mb-2">Find my ticket</h1>
      <p className="text-ink-muted mb-6">Enter your ticket reference or the email you used.</p>

      <form onSubmit={lookup} className="card p-6 space-y-4">
        <div>
          <label className="label">Ticket reference</label>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="WOR-DJKAY-4134123"
            className="input font-mono"
          />
        </div>
        <p className="text-center text-sm text-ink-muted">— or —</p>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>
        <button disabled={busy || (!ref && !email)} className="btn-primary w-full justify-center">
          {busy ? "Looking…" : "Find my ticket"}
        </button>
        {err && <p className="err">{err}</p>}
      </form>

      {results && (
        <div className="mt-6 space-y-3">
          {results.length === 0 && <p className="text-sm text-ink-muted">No tickets found.</p>}
          {results.map((t) => (
            <div key={t.id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{t.eventTitle}</p>
                <p className="text-xs text-ink-muted">{t.attendeeName}</p>
                <p className="font-mono text-sm text-primary mt-1">{t.visibleRef}</p>
              </div>
              {t.pdfUrl ? (
                <a href={t.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                  Download
                </a>
              ) : (
                <span className="chip-muted">{t.status}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

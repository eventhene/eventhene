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
    <div className="section max-w-xl py-16">
      <p className="chip-outline mb-5">Lookup</p>
      <h1 className="h-section mb-2">Find my ticket.</h1>
      <p className="text-ink-muted mb-10">Enter your ticket reference or the email you used.</p>

      <form onSubmit={lookup} className="card p-7 space-y-4">
        <div>
          <label className="label">Ticket reference</label>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="WOR-DJKAY-4134123"
            className="input font-mono"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="hr-soft flex-1" />
          <span className="text-xs text-ink-muted">or</span>
          <div className="hr-soft flex-1" />
        </div>
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
        <button disabled={busy || (!ref && !email)} className="btn-primary btn-lg w-full">
          {busy && <span className="spinner" />}
          {busy ? "Looking..." : "Find my ticket"}
        </button>
        {err && <p className="err">{err}</p>}
      </form>

      {results && (
        <div className="mt-8 space-y-3">
          {results.length === 0 && <p className="text-sm text-ink-muted">No tickets found.</p>}
          {results.map((t) => (
            <div key={t.id} className="card p-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{t.eventTitle}</p>
                <p className="text-xs text-ink-muted">{t.attendeeName}</p>
                <p className="font-mono text-xs text-royal-2 mt-1">{t.visibleRef}</p>
              </div>
              {t.pdfUrl ? (
                <a href={t.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
                  Download
                </a>
              ) : (
                <span className="chip-outline">{t.status}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

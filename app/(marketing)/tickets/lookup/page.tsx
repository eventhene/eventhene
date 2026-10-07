"use client";

import { useState } from "react";
import { Search, Loader2, Ticket, Download } from "lucide-react";

export default function TicketLookupPage() {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 3) return;
    setBusy(true);
    setErr(null);
    setResults(null);
    try {
      const res = await fetch(`/api/tickets/lookup?q=${encodeURIComponent(query.trim())}`);
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
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
          <Ticket className="w-7 h-7 text-accent" />
        </div>
        <h1 className="h-section text-white">Find my ticket</h1>
        <p className="text-white/40 mt-3 text-lg">
          Enter your ticket reference code to view or download your ticket.
        </p>
      </div>

      <form onSubmit={lookup} className="card-glass rounded-2xl p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. KOF-FIRE-1234"
            className="input text-white pl-12 text-base py-4 w-full font-mono tracking-wide"
            autoFocus
          />
        </div>
        <button
          disabled={busy || query.trim().length < 3}
          className="btn-gold btn-lg w-full flex items-center justify-center gap-2"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Find my ticket
            </>
          )}
        </button>
        <p className="text-xs text-white/20 text-center">
          Your reference code was sent to you via SMS after purchase.
        </p>
        {err && <p className="text-sm text-red-400 text-center">{err}</p>}
      </form>

      {results !== null && (
        <div className="mt-8 space-y-3">
          {results.length === 0 && (
            <div className="card-glass rounded-2xl p-10 text-center">
              <p className="text-white/40">No tickets found. Double-check your reference code and try again.</p>
            </div>
          )}
          {results.map((t) => (
            <div key={t.id} className="card-glass rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white truncate">{t.eventTitle}</p>
                <p className="text-sm text-white/50 mt-0.5">{t.attendeeName}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono text-xs text-accent">{t.visibleRef}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 uppercase font-bold">
                    {t.ticketType}
                  </span>
                  <StatusChip status={t.status} />
                </div>
              </div>
              {t.pdfUrl ? (
                <a
                  href={t.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold btn-sm flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </a>
              ) : (
                <span className="text-xs text-white/30 shrink-0">No PDF</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  if (status === "ATTENDED") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase">Attended</span>;
  if (status === "TICKET_ISSUED" || status === "REGISTERED") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold uppercase">Valid</span>;
  if (status === "REFUNDED") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold uppercase">Refunded</span>;
  return null;
}

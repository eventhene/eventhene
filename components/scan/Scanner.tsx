"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Search, Loader2, UserCheck, X } from "lucide-react";

const QrScanner = dynamic(() => import("@yudiel/react-qr-scanner").then((m) => m.Scanner), {
  ssr: false,
  loading: () => <div className="aspect-square w-full bg-white/5 animate-pulse rounded-2xl" />,
});

interface Result {
  result: string;
  attendeeName?: string;
  ticketType?: string;
  eventTitle?: string;
  visibleRef?: string;
  previouslyScannedAt?: string;
}

export function Scanner({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchErr, setSearchErr] = useState<string | null>(null);

  async function onDecode(value: string) {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/tickets/validate", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ qr: value, eventId }),
      });
      const data = await r.json();
      setResult(data);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(data.result === "VALID" ? 80 : [50, 50, 50]);
      }
    } catch {
      setResult({ result: "INVALID" });
    } finally {
      setTimeout(() => setBusy(false), 1800);
    }
  }

  async function manualLookup(e?: React.FormEvent) {
    e?.preventDefault();
    if (!manualQuery.trim() || manualQuery.trim().length < 2) return;
    setSearching(true);
    setSearchErr(null);
    try {
      const r = await fetch(`/api/tickets/search?q=${encodeURIComponent(manualQuery.trim())}&eventId=${eventId}`, { credentials: "include" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Search failed");
      setSearchResults(data.tickets || []);
      if ((data.tickets || []).length === 0) setSearchErr("No tickets found");
    } catch (e: any) {
      setSearchErr(e.message);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function manualCheckIn(ticketId: string) {
    setBusy(true);
    const r = await fetch(`/api/tickets/${ticketId}/check-in`, { method: "POST" });
    const data = await r.json();
    setResult(data);
    setShowManual(false);
    setSearchResults([]);
    setManualQuery("");
    setSearchErr(null);
    setTimeout(() => setBusy(false), 1800);
  }

  const status = result?.result;
  const bg =
    status === "VALID" ? "from-emerald/40 to-emerald/0" :
    status === "ALREADY_USED" ? "from-accent/40 to-accent/0" :
    status ? "from-crimson/40 to-crimson/0" : "from-transparent to-transparent";

  const title =
    status === "VALID" ? "Welcome in" :
    status === "ALREADY_USED" ? "Already scanned" :
    status === "WRONG_EVENT" ? "Wrong event" :
    status === "NOT_PAID" ? "Not paid" :
    status === "REFUNDED" ? "Refunded" :
    status === "CANCELLED" ? "Cancelled" :
    status === "INVALID_SIGNATURE" ? "Invalid signature" :
    status ? "Invalid ticket" : "";

  const symbol =
    status === "VALID" ? "✓" :
    status === "ALREADY_USED" ? "!" :
    status ? "✕" : "";

  return (
    <div className="min-h-screen bg-canvas text-white flex flex-col relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-b ${bg} transition-colors duration-500 pointer-events-none`} />

      <header className="relative z-10 px-5 py-4 flex items-center justify-between border-b border-white/5">
        <Link href="/scan" className="text-white/60 text-sm hover:text-white">← Events</Link>
        <p className="text-sm font-medium truncate max-w-[55%]">{eventTitle}</p>
        <button onClick={() => setShowManual(true)} className="text-xs text-accent hover:underline">Manual</button>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-5 gap-6">
        {!showManual && (
          <div className="aspect-square w-full max-w-sm rounded-3xl overflow-hidden ring-1 ring-white/10 bg-black shadow-2xl">
            <QrScanner
              onScan={(detected) => {
                const v = detected?.[0]?.rawValue;
                if (v) onDecode(v);
              }}
              onError={() => {}}
              constraints={{ facingMode: "environment" }}
              styles={{ container: { width: "100%", height: "100%" } }}
            />
          </div>
        )}

        {showManual && (
          <div className="w-full max-w-sm card-glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-white text-lg">Manual check-in</p>
              <button onClick={() => { setShowManual(false); setSearchResults([]); setSearchErr(null); }} className="p-1.5 rounded-full hover:bg-white/10 transition">
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>
            <p className="text-xs text-white/40">Search by name, phone number, or ticket reference.</p>
            <form onSubmit={manualLookup} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="e.g. Kofi, 0241234567, KOF-FIRE-1234"
                  className="input text-white pl-10 w-full"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={searching || manualQuery.trim().length < 2}
                className="btn-gold btn-md w-full flex items-center justify-center gap-2"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Find attendee
                  </>
                )}
              </button>
            </form>
            {searchErr && <p className="text-sm text-white/40 text-center">{searchErr}</p>}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((t) => (
                  <div key={t.id} className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{t.attendeeName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-accent">{t.visibleRef}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50 uppercase font-bold">{t.ticketType}</span>
                      </div>
                      {t.attendeePhone && <p className="text-[11px] text-white/30 mt-0.5">{t.attendeePhone}</p>}
                    </div>
                    {t.status === "ATTENDED" ? (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold shrink-0">Already in</span>
                    ) : (
                      <button onClick={() => manualCheckIn(t.id)} className="btn-gold btn-sm flex items-center gap-1.5 shrink-0">
                        <UserCheck className="w-3.5 h-3.5" />
                        Check in
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="w-full max-w-sm">
            <div className="glass-dark rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl font-bold shrink-0 ${
                  status === "VALID" ? "bg-emerald text-white" :
                  status === "ALREADY_USED" ? "bg-accent text-ink" :
                  "bg-crimson text-white"
                }`}>
                  {symbol}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-2xl">{title}</p>
                  {result.attendeeName && <p className="text-xl truncate">{result.attendeeName}</p>}
                </div>
              </div>
              {(result.ticketType || result.visibleRef) && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-1 text-sm">
                  {result.ticketType && <p className="text-white/70">Tier: <span className="text-white">{result.ticketType}</span></p>}
                  {result.visibleRef && <p className="font-mono text-white/70">{result.visibleRef}</p>}
                  {result.previouslyScannedAt && (
                    <p className="text-xs text-white/50 mt-2">
                      Previously scanned: {new Date(result.previouslyScannedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-10 px-5 py-3 flex items-center justify-center gap-2">
        <img src="/logo-icon.png" alt="" className="h-4 w-4 object-contain opacity-40" />
        <span className="text-xs text-white/40 font-mono tracking-widest">EVENTHENE SCANNER</span>
      </footer>
    </div>
  );
}

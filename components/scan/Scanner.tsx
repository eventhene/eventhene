"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

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
  const [manualRef, setManualRef] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  async function onDecode(value: string) {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/tickets/validate", {
        method: "POST",
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

  async function manualLookup() {
    if (!manualRef) return;
    const r = await fetch(`/api/tickets/lookup?ref=${encodeURIComponent(manualRef.toUpperCase())}`);
    const data = await r.json();
    setSearchResults(data.tickets || []);
  }

  async function manualCheckIn(ticketId: string) {
    setBusy(true);
    const r = await fetch(`/api/tickets/${ticketId}/check-in`, { method: "POST" });
    const data = await r.json();
    setResult(data);
    setShowManual(false);
    setSearchResults([]);
    setManualRef("");
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
          <div className="w-full max-w-sm card p-6 space-y-3 bg-white text-ink">
            <p className="font-medium">Manual lookup</p>
            <input
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value)}
              placeholder="WOR-DJKAY-4134123"
              className="input font-mono"
            />
            <button onClick={manualLookup} className="btn-primary btn-md w-full">Find</button>
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((t) => (
                  <div key={t.id} className="border border-border rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t.attendeeName}</p>
                      <p className="text-xs text-ink-muted font-mono">{t.visibleRef}</p>
                    </div>
                    <button onClick={() => manualCheckIn(t.id)} className="btn-primary btn-sm">Check in</button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { setShowManual(false); setSearchResults([]); }} className="text-sm text-ink-muted">Cancel</button>
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

      <footer className="relative z-10 px-5 py-3 text-center text-xs text-white/40 font-mono tracking-widest">
        EVENTHENE SCANNER
      </footer>
    </div>
  );
}

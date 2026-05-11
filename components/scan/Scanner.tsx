"use client";

import { useState } from "react";
import Link from "next/link";

// Dynamically import the QR scanner to avoid SSR issues
import dynamic from "next/dynamic";
const QrScanner = dynamic(() => import("@yudiel/react-qr-scanner").then((m) => m.Scanner), {
  ssr: false,
  loading: () => <div className="aspect-square w-full bg-ink animate-pulse rounded-2xl" />
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
        body: JSON.stringify({ qr: value, eventId })
      });
      const data = await r.json();
      setResult(data);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(data.result === "VALID" ? 80 : [50, 50, 50]);
      }
    } catch (e) {
      setResult({ result: "INVALID" });
    } finally {
      // Re-arm scanner after 2s
      setTimeout(() => {
        setBusy(false);
      }, 2000);
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
    setTimeout(() => setBusy(false), 2000);
  }

  const status = result?.result;
  const bgColor =
    status === "VALID" ? "bg-success" :
    status === "ALREADY_USED" ? "bg-warning" :
    status ? "bg-danger" : "bg-ink";

  const title =
    status === "VALID" ? "✓ Welcome" :
    status === "ALREADY_USED" ? "⚠️ Already scanned" :
    status === "WRONG_EVENT" ? "❌ Wrong event" :
    status === "NOT_PAID" ? "❌ Not paid" :
    status === "REFUNDED" ? "❌ Refunded" :
    status === "CANCELLED" ? "❌ Cancelled" :
    status === "INVALID_SIGNATURE" ? "❌ Invalid signature" :
    status ? "❌ Invalid ticket" : "";

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col">
      <header className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <Link href="/scan" className="text-white/60 text-sm">← Events</Link>
        <p className="text-sm font-medium truncate max-w-[60%]">{eventTitle}</p>
        <button onClick={() => setShowManual(true)} className="text-xs text-accent">Manual</button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        {!showManual && (
          <div className="aspect-square w-full max-w-sm rounded-2xl overflow-hidden bg-black">
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
          <div className="w-full max-w-sm bg-white text-ink rounded-2xl p-4 space-y-3">
            <p className="font-medium">Manual lookup</p>
            <input
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value)}
              placeholder="WOR-DJKAY-4134123"
              className="input font-mono"
            />
            <button onClick={manualLookup} className="btn-primary w-full justify-center">Find</button>
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((t) => (
                  <div key={t.id} className="border border-border rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t.attendeeName}</p>
                      <p className="text-xs text-ink-muted">{t.visibleRef}</p>
                    </div>
                    <button onClick={() => manualCheckIn(t.id)} className="btn-primary text-xs">Check in</button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { setShowManual(false); setSearchResults([]); }} className="text-sm text-ink-muted">Cancel</button>
          </div>
        )}

        {result && (
          <div className={`${bgColor} text-white rounded-2xl p-6 w-full max-w-sm text-center transition`}>
            <p className="text-2xl font-display mb-2">{title}</p>
            {result.attendeeName && <p className="text-xl">{result.attendeeName}</p>}
            {result.ticketType && <p className="opacity-80">{result.ticketType}</p>}
            {result.visibleRef && <p className="font-mono mt-2 opacity-90">{result.visibleRef}</p>}
            {result.previouslyScannedAt && (
              <p className="text-xs mt-2 opacity-80">
                Previously scanned: {new Date(result.previouslyScannedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="px-4 py-3 text-center text-xs text-white/40">
        EventHene Scanner • point camera at QR
      </footer>
    </div>
  );
}

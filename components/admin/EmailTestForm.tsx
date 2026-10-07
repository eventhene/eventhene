"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle, XCircle } from "lucide-react";

export function EmailTestForm({ defaultTo }: { defaultTo: string }) {
  const [to, setTo] = useState(defaultTo);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to }),
      });
      setResult(await res.json());
    } catch {
      setResult({ ok: false, error: "Network error", attempts: [] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="input text-white flex-1"
          placeholder="you@example.com"
        />
        <button disabled={busy} className="btn-gold btn-md flex items-center justify-center gap-2 sm:w-44">
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send test email
            </>
          )}
        </button>
      </div>

      {result && (
        <div className={`rounded-xl border p-4 text-sm ${result.ok ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"}`}>
          <div className="flex items-center gap-2 font-semibold text-white">
            {result.ok ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
            {result.ok ? `Sent via ${result.provider}` : result.error || "Failed to send"}
          </div>
          {Array.isArray(result.attempts) && result.attempts.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-white/60 font-mono">
              {result.attempts.map((a: any, i: number) => (
                <li key={i}>
                  {a.provider}: {a.ok ? "ok" : a.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}

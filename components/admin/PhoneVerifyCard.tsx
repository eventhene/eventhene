"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, ShieldCheck } from "lucide-react";

export function PhoneVerifyCard({ defaultPhone }: { defaultPhone: string | null }) {
  const router = useRouter();
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/account/phone/send", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send the code.");
      setSent(data.sentTo);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/account/phone/verify", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That code is not right.");
      setDone(true);
      setTimeout(() => router.refresh(), 1500);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
        <p className="text-sm text-white font-semibold">Phone verified. Thank you.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
          <Phone className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Verify your phone number</p>
          <p className="text-xs text-white/50 mt-0.5">
            Your account was created before phone verification existed. Confirm your number with a quick SMS code.
          </p>
        </div>
      </div>

      {!sent ? (
        <form onSubmit={sendCode} className="flex flex-col sm:flex-row gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="0241234567"
            className="input text-white flex-1"
          />
          <button disabled={busy || phone.trim().length < 9} className="btn-gold btn-md flex items-center justify-center gap-2 sm:w-40">
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send code"
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-2">
          <p className="text-xs text-white/50">We sent a 6-digit code to {sent}.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              autoFocus
              className="input text-white flex-1 font-mono tracking-[0.4em] text-center"
            />
            <button disabled={busy || code.length < 6} className="btn-gold btn-md flex items-center justify-center gap-2 sm:w-40">
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>
          </div>
          <button type="button" onClick={() => sendCode()} disabled={busy} className="text-xs text-accent hover:underline disabled:opacity-50">
            Resend code
          </button>
        </form>
      )}
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Phone, Mail, AlertTriangle } from "lucide-react";

interface Props {
  phone: string | null;
  phoneVerified: boolean;
  email: string;
  emailVerified: boolean;
}

export function AccountVerification({ phone, phoneVerified, email, emailVerified }: Props) {
  // Phone is the important one. If they only confirmed email so far, it is a must (but never blocks event creation).
  const phoneMust = !phoneVerified && emailVerified;
  return (
    <section id="verification" className="card-glass rounded-2xl p-7 space-y-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-accent" />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Account verification</h2>
      </div>
      <p className="text-white/40 text-sm">
        Verified contact details protect your account and make sure buyers, payouts and alerts reach you. You can keep using EventHene while you finish this.
      </p>

      <Row
        channel="phone"
        icon={<Phone className="w-4 h-4" />}
        title="Phone number"
        verified={phoneVerified}
        initialValue={phone ?? ""}
        badge={phoneVerified ? null : phoneMust ? { text: "Required", tone: "red" } : { text: "Important", tone: "amber" }}
        helper={
          phoneMust
            ? "You verified your email first, so please confirm your phone number too. It is how we secure sign-ins and payouts."
            : "Confirm your number with an SMS code."
        }
      />
      <Row
        channel="email"
        icon={<Mail className="w-4 h-4" />}
        title="Email address"
        verified={emailVerified}
        initialValue={email}
        badge={emailVerified ? null : { text: "Recommended", tone: "grey" }}
        helper="Optional extra security. We will email you a code."
      />
    </section>
  );
}

function Row({
  channel, icon, title, verified, initialValue, badge, helper,
}: {
  channel: "phone" | "email";
  icon: React.ReactNode;
  title: string;
  verified: boolean;
  initialValue: string;
  badge: { text: string; tone: "red" | "amber" | "grey" } | null;
  helper: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(initialValue);
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const tone = {
    red: "bg-red-500/15 text-red-400",
    amber: "bg-amber-500/15 text-amber-400",
    grey: "bg-white/10 text-white/50",
  };

  async function send() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/account/${channel}/send`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(channel === "phone" ? { phone } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send the code.");
      setSentTo(data.sentTo);
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
      const res = await fetch(`/api/account/${channel}/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That code is not right.");
      setDone(true);
      setTimeout(() => router.refresh(), 1200);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const isVerified = verified || done;

  return (
    <div className={`rounded-xl border p-4 ${isVerified ? "border-emerald-500/20 bg-emerald-500/5" : badge?.tone === "red" ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-accent shrink-0">{icon}</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white flex items-center gap-2 flex-wrap">
              {title}
              {isVerified ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase">Verified</span>
              ) : (
                badge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${tone[badge.tone]}`}>{badge.text}</span>
              )}
            </p>
            <p className="text-xs text-white/40 mt-0.5 break-all">{initialValue || "Not added yet"}</p>
            {!isVerified && <p className="text-xs text-white/50 mt-1.5 flex items-start gap-1.5">{badge?.tone === "red" && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-px" />}{helper}</p>}
          </div>
        </div>
        {!isVerified && !open && (
          <button onClick={() => setOpen(true)} className="btn-gold btn-sm shrink-0">Verify</button>
        )}
      </div>

      {!isVerified && open && (
        <div className="mt-4 space-y-3">
          {!sentTo ? (
            <div className="flex flex-col sm:flex-row gap-2">
              {channel === "phone" && (
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="0241234567"
                  className="input text-white flex-1"
                />
              )}
              <button
                onClick={send}
                disabled={busy || (channel === "phone" && phone.trim().length < 9)}
                className="btn-gold btn-md flex items-center justify-center gap-2 sm:w-44"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : channel === "phone" ? (
                  "Send SMS code"
                ) : (
                  "Email me a code"
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={verify} className="space-y-2">
              <p className="text-xs text-white/50">We sent a 6-digit code to {sentTo}.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="000000"
                  autoFocus
                  className="input text-white flex-1 font-mono tracking-[0.4em] text-center"
                />
                <button disabled={busy || code.length < 6} className="btn-gold btn-md flex items-center justify-center gap-2 sm:w-44">
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
              <button type="button" onClick={send} disabled={busy} className="text-xs text-accent hover:underline disabled:opacity-50">
                Resend code
              </button>
            </form>
          )}
          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { PasswordInput, RULES } from "@/components/auth/PasswordInput";

export function SecuritySettings({ email, emailVerified }: { email: string; emailVerified: boolean }) {
  return (
    <section id="security" className="space-y-5">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-accent" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Sign-in security</h2>
      </div>
      <ChangeEmail email={email} emailVerified={emailVerified} />
      <ChangePassword />
    </section>
  );
}

/* ---------------- change email ---------------- */

function ChangeEmail({ email, emailVerified }: { email: string; emailVerified: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setOpen(false); setNewEmail(""); setPassword(""); setCode(""); setSentTo(null); setErr(null);
  }

  async function start(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/account/email-change/start", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newEmail, password }),
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

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/account/email-change/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newEmail, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That code is not right.");
      setDone(true);
      setTimeout(() => { reset(); setDone(false); router.refresh(); }, 1800);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-glass rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-accent"><Mail className="h-4 w-4" /></div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Email address</p>
            <p className="break-all text-sm text-white/60">{email}</p>
            <p className="mt-0.5 text-[11px] text-white/35">{emailVerified ? "Verified" : "Not verified yet"}</p>
          </div>
        </div>
        {!open && <button onClick={() => setOpen(true)} className="btn-ghost-dark btn-sm shrink-0">Change</button>}
      </div>

      {open && !done && (
        !sentTo ? (
          <form onSubmit={start} className="space-y-3 border-t border-white/10 pt-4">
            <p className="text-xs text-white/40">We will send a code to your new address to confirm it is yours. For safety we also ask for your current password.</p>
            <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email address" className="input text-white" autoFocus />
            <div className="relative">
              <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Current password" className="input pr-12 text-white" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/60" aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {err && <p className="text-sm text-red-400">{err}</p>}
            <div className="flex gap-2">
              <button disabled={busy || !newEmail || !password} className="btn-gold btn-md flex items-center gap-2">
                {busy ? (<><Loader2 className="h-4 w-4 animate-spin" />Sending code...</>) : "Send code"}
              </button>
              <button type="button" onClick={reset} className="btn-ghost-dark btn-md">Cancel</button>
            </div>
          </form>
        ) : (
          <form onSubmit={confirm} className="space-y-3 border-t border-white/10 pt-4">
            <p className="text-xs text-white/50">We sent a 6-digit code to {sentTo}. Enter it to switch your email.</p>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="000000" autoFocus className="input text-center font-mono text-xl tracking-[0.4em] text-white" />
            {err && <p className="text-sm text-red-400">{err}</p>}
            <div className="flex flex-wrap gap-2">
              <button disabled={busy || code.length < 6} className="btn-gold btn-md flex items-center gap-2">
                {busy ? (<><Loader2 className="h-4 w-4 animate-spin" />Confirming...</>) : "Confirm new email"}
              </button>
              <button type="button" onClick={() => start()} disabled={busy} className="btn-ghost-dark btn-md">Resend code</button>
              <button type="button" onClick={reset} className="btn-ghost-dark btn-md">Cancel</button>
            </div>
          </form>
        )
      )}
      {done && (
        <p className="flex items-center gap-2 border-t border-white/10 pt-4 text-sm font-semibold text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Email updated. We also told your old address.
        </p>
      )}
    </div>
  );
}

/* ---------------- change password ---------------- */

function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const ok = RULES.every((r) => r.test(next)) && next === confirm && confirm.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ok) return setErr("Please meet every requirement and make both passwords match.");
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change your password.");
      setDone(true);
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => { setDone(false); setOpen(false); }, 2500);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-glass rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-accent"><KeyRound className="h-4 w-4" /></div>
          <div>
            <p className="text-sm font-semibold text-white">Password</p>
            <p className="text-xs text-white/40">Changing it signs you out on your other devices.</p>
          </div>
        </div>
        {!open && <button onClick={() => setOpen(true)} className="btn-ghost-dark btn-sm shrink-0">Change</button>}
      </div>

      {open && !done && (
        <form onSubmit={submit} className="space-y-4 border-t border-white/10 pt-4">
          <div>
            <label className="label">Current password</label>
            <div className="relative">
              <input type={showCur ? "text" : "password"} required value={current} onChange={(e) => setCurrent(e.target.value)} className="input pr-12 text-white" autoComplete="current-password" />
              <button type="button" onClick={() => setShowCur((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/60" aria-label={showCur ? "Hide password" : "Show password"}>
                {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-white/30">Forgot it? <a href="/forgot-password" className="text-accent hover:underline">Reset it by email or SMS</a>.</p>
          </div>
          <PasswordInput value={next} onChange={setNext} confirmValue={confirm} onConfirmChange={setConfirm} />
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div className="flex gap-2">
            <button disabled={busy || !current || !ok} className="btn-gold btn-md flex items-center gap-2">
              {busy ? (<><Loader2 className="h-4 w-4 animate-spin" />Updating...</>) : "Update password"}
            </button>
            <button type="button" onClick={() => { setOpen(false); setErr(null); }} className="btn-ghost-dark btn-md">Cancel</button>
          </div>
        </form>
      )}
      {done && (
        <p className="flex items-center gap-2 border-t border-white/10 pt-4 text-sm font-semibold text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Password updated. Other devices were signed out.
        </p>
      )}
    </div>
  );
}

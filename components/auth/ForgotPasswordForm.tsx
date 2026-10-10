"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { PasswordInput, RULES } from "./PasswordInput";

type Step = "request" | "reset" | "done";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [usedChannel, setUsedChannel] = useState<"email" | "sms">("email");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const strong = RULES.every((r) => r.test(password)) && password === confirm && confirm.length > 0;

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setErr(null);
    setResent(false);
    try {
      const res = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send the code.");
      setUsedChannel(data.channel === "sms" ? "sms" : "email");
      setStep("reset");
      if (step === "reset") setResent(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!strong) return setErr("Please meet every password requirement, and make both passwords match.");
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: password, channel: usedChannel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset your password.");
      setStep("done");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "done") {
    return (
      <div className="space-y-5 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Password updated</h2>
          <p className="mt-2 text-sm text-white/50">You have been signed out everywhere. Sign in with your new password.</p>
        </div>
        <Link href="/sign-in" className="btn-gold btn-lg flex w-full items-center justify-center">Go to sign in</Link>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <form onSubmit={resetPassword} className="space-y-4">
        <p className="text-sm text-white/50">
          If an account exists for <strong className="text-white">{email}</strong>, we sent a 6-digit code by {usedChannel === "sms" ? "SMS" : "email"}. Enter it below and choose a new password.
        </p>
        <div>
          <label className="label">Verification code</label>
          <input
            required
            autoFocus
            maxLength={6}
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="input text-center text-2xl font-extrabold tracking-[0.3em]"
            placeholder="------"
          />
        </div>
        <PasswordInput value={password} onChange={setPassword} confirmValue={confirm} onConfirmChange={setConfirm} />
        {err && <div className="rounded-xl border border-crimson/20 bg-crimson/5 px-4 py-3 text-sm font-semibold text-crimson">{err}</div>}
        {resent && <p className="text-sm text-emerald-400">A new code is on its way.</p>}
        <button type="submit" disabled={busy || code.length < 6 || !strong} className="btn-gold btn-lg flex w-full items-center justify-center gap-2">
          {busy ? (<><Loader2 className="h-4 w-4 animate-spin" />Updating password...</>) : "Set new password"}
        </button>
        <button type="button" onClick={() => sendCode()} disabled={busy} className="btn-ghost-dark btn-md w-full">Resend code</button>
        <button type="button" onClick={() => { setStep("request"); setErr(null); }} className="flex w-full items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/70">
          <ArrowLeft className="h-3 w-3" />
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <input type="email" required autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
      </div>
      <div>
        <label className="label">Send my code via</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setChannel("email")} className={`btn-md flex-1 ${channel === "email" ? "btn-gold" : "btn-ghost-dark"}`}>Email</button>
          <button type="button" onClick={() => setChannel("sms")} className={`btn-md flex-1 ${channel === "sms" ? "btn-gold" : "btn-ghost-dark"}`}>SMS</button>
        </div>
        <p className="mt-1.5 text-[11px] text-white/30">SMS goes to the phone number saved on your account.</p>
      </div>
      {err && <div className="rounded-xl border border-crimson/20 bg-crimson/5 px-4 py-3 text-sm font-semibold text-crimson">{err}</div>}
      <button disabled={busy} className="btn-gold btn-lg flex w-full items-center justify-center gap-2">
        {busy ? (<><Loader2 className="h-4 w-4 animate-spin" />Sending code...</>) : "Send reset code"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft, Check, Lock, Phone, User, PartyPopper } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1, label: "You", icon: User },
  { n: 2, label: "Secure", icon: Lock },
  { n: 3, label: "Verify", icon: Phone },
  { n: 4, label: "Done", icon: Check },
] as const;

interface Props {
  token: string;
  role: "MANAGER" | "SCANNER";
  organizerName: string;
  phoneLocal: string;
  signedInAs: { name: string; email: string } | null;
}

export function TeamInviteForm({ token, role, organizerName, phoneLocal, signedInAs }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [alreadyHasAccount, setAlreadyHasAccount] = useState(false);
  const [resent, setResent] = useState(false);
  const [nextPath, setNextPath] = useState(role === "MANAGER" ? "/dashboard" : "/scan");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function acceptInvite(): Promise<boolean> {
    const res = await fetch("/api/team/invites/accept", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not join the team.");
    if (data.next) setNextPath(data.next);
    return true;
  }

  async function joinAsExisting() {
    setBusy(true);
    setErr(null);
    try {
      await acceptInvite();
      setStep(4);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function goStep2(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (fullName.trim().length < 2) return setErr("Please enter your full name.");
    if (!emailOk) return setErr("Please enter a valid email address.");
    setStep(2);
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setAlreadyHasAccount(false);
    if (password.length < 8) return setErr("Your password needs at least 8 characters.");
    if (password !== confirm) return setErr("The two passwords do not match.");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phoneLocal,
          password,
          country: "GH",
          currency: "GHS",
          timezone: "Africa/Accra",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (/already exists|already registered/i.test(data.error || "")) setAlreadyHasAccount(true);
        throw new Error(data.error || "Could not create your account.");
      }
      setStep(3);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otp.trim(), channel: "sms" }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) throw new Error(data.error || "That code is not right.");
      await acceptInvite();
      setStep(4);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setErr(null);
    setResent(false);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), channel: "sms" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not resend the code.");
      setResent(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  // ---------- already signed in: one tap ----------
  if (signedInAs && step !== 4) {
    return (
      <div className="card-glass rounded-2xl p-7 space-y-5 text-center">
        <p className="text-sm text-white/60">
          You are signed in as <strong className="text-white">{signedInAs.name}</strong>
          <span className="block text-xs text-white/35">{signedInAs.email}</span>
        </p>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button onClick={joinAsExisting} disabled={busy} className="btn-gold btn-lg w-full flex items-center justify-center gap-2">
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Joining team...
            </>
          ) : (
            <>Join {organizerName}</>
          )}
        </button>
        <p className="text-[11px] text-white/30">Your phone number on this account must match the number this invite was sent to.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      <div className="card-glass rounded-2xl p-7">
        {step === 1 && (
          <form onSubmit={goStep2} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">Tell us who you are</h2>
              <p className="text-xs text-white/40 mt-1">Step 1 of 3</p>
            </div>
            <Field label="Full name">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ama Mensah" className="input text-white" autoFocus autoComplete="name" />
            </Field>
            <Field label="Email address">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input text-white" autoComplete="email" />
            </Field>
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button className="btn-gold btn-lg w-full flex items-center justify-center gap-2">
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-xs text-white/35">
              Already have an account? <Link href={`/sign-in?next=/invite/team/${token}`} className="text-accent hover:underline">Sign in</Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={createAccount} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">Secure your account</h2>
              <p className="text-xs text-white/40 mt-1">Step 2 of 3</p>
            </div>
            <Field label="Your phone number">
              <div className="input flex items-center justify-between text-white/80 bg-white/5">
                <span className="font-mono">{phoneLocal}</span>
                <span className="text-[10px] uppercase tracking-wide text-emerald-400 font-bold">From your invite</span>
              </div>
              <p className="text-[11px] text-white/30 mt-1">We will text a code to this number in the next step.</p>
            </Field>
            <Field label="Create password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="input text-white" autoComplete="new-password" />
            </Field>
            <Field label="Confirm password">
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again" className="input text-white" autoComplete="new-password" />
            </Field>
            {err && (
              <p className="text-sm text-red-400">
                {err}{" "}
                {alreadyHasAccount && (
                  <Link href={`/sign-in?next=/invite/team/${token}`} className="underline text-accent">Sign in to join instead</Link>
                )}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setErr(null); setStep(1); }} disabled={busy} className="btn-ghost-dark btn-lg flex items-center justify-center px-5" aria-label="Back">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button disabled={busy} className="btn-gold btn-lg flex-1 flex items-center justify-center gap-2">
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account and text me a code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={verify} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">Confirm your number</h2>
              <p className="text-xs text-white/40 mt-1">
                Step 3 of 3. We sent a 6-digit code to <span className="font-mono text-white/70">{phoneLocal}</span>.
              </p>
            </div>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoFocus
              className="input text-white text-center text-2xl tracking-[0.5em] font-mono"
            />
            {err && <p className="text-sm text-red-400">{err}</p>}
            {resent && <p className="text-sm text-emerald-400">A new code is on its way.</p>}
            <button disabled={busy || otp.length < 6} className="btn-gold btn-lg w-full flex items-center justify-center gap-2">
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify and join the team"
              )}
            </button>
            <button type="button" onClick={resend} disabled={busy} className="w-full text-center text-xs text-accent hover:underline disabled:opacity-50">
              Did not get a code? Resend
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <PartyPopper className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">You are on the team</h2>
              <p className="text-sm text-white/50 mt-2">
                {role === "MANAGER"
                  ? `You can now help manage ${organizerName}'s events.`
                  : `You can now scan tickets for ${organizerName}'s events.`}
              </p>
            </div>
            <button
              onClick={() => { router.push(nextPath); router.refresh(); }}
              className="btn-gold btn-lg w-full flex items-center justify-center gap-2"
            >
              {role === "MANAGER" ? "Open dashboard" : "Open scanner"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-between px-2">
      {STEPS.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        const Icon = s.icon;
        return (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition ${
                  done
                    ? "bg-accent border-accent text-black"
                    : active
                    ? "border-accent text-accent bg-accent/10"
                    : "border-white/15 text-white/30"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${active || done ? "text-white/70" : "text-white/25"}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-5 ${step > s.n ? "bg-accent" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  );
}

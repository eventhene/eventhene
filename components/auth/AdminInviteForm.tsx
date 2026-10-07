"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, CheckCircle, ArrowRight } from "lucide-react";

type Step = "setup" | "otp" | "done";

export function AdminInviteForm({ defaultEmail, defaultPhone }: { defaultEmail?: string; defaultPhone?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("setup");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(defaultEmail || "");
  const [phone, setPhone] = useState(defaultPhone || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [otp, setOtp] = useState("");
  const [otpChannel, setOtpChannel] = useState<"sms" | "email">("sms");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          country: "GH",
          currency: "GHS",
          timezone: "Africa/Accra",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign-up failed");
      setOtpChannel(data.otpChannel || "sms");
      setStep("otp");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otp.trim(),
          channel: otpChannel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) throw new Error(data.error || "Invalid code");
      setStep("done");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), channel: otpChannel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");
      setErr(null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "done") {
    return (
      <div className="card-glass rounded-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">You're all set, {fullName.split(" ")[0]}!</h2>
          <p className="text-white/40 mt-2">Your SuperAdmin account is active. You have full access to manage EventHene.</p>
        </div>
        <button
          onClick={() => router.push("/superadmin")}
          className="btn-gold btn-lg w-full flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Access SuperAdmin Panel
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerify} className="card-glass rounded-2xl p-8 space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Verify your phone</h2>
          <p className="text-white/40 mt-2 text-sm">
            We sent a 6-digit code to your {otpChannel === "sms" ? "phone" : "email"}. Enter it below.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Verification code</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="input text-white text-center text-2xl tracking-[0.5em] font-mono mt-2"
            autoFocus
            inputMode="numeric"
          />
        </div>
        <button
          type="submit"
          disabled={busy || otp.length < 6}
          className="btn-gold btn-lg w-full flex items-center justify-center gap-2"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify code"
          )}
        </button>
        {err && <p className="text-sm text-red-400 text-center">{err}</p>}
        <button type="button" onClick={resendOtp} disabled={busy} className="text-xs text-accent hover:underline w-full text-center block">
          Didn't get a code? Resend
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignUp} className="card-glass rounded-2xl p-8 space-y-5">
      <div>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Full name</label>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Kwaku Brimpong"
          className="input text-white mt-2"
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input text-white mt-2"
          readOnly={!!defaultEmail}
        />
        {defaultEmail && <p className="text-[10px] text-white/20 mt-1">Pre-filled from your invite link.</p>}
      </div>
      <div>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Phone number</label>
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0554224429"
          className="input text-white mt-2"
          readOnly={!!defaultPhone}
        />
        <p className="text-[10px] text-white/20 mt-1">We'll send a verification code to this number.</p>
      </div>
      <div>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Create password</label>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          className="input text-white mt-2"
          minLength={8}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Confirm password</label>
        <input
          required
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter password"
          className="input text-white mt-2"
          minLength={8}
        />
      </div>
      {err && <p className="text-sm text-red-400 text-center">{err}</p>}
      <button
        type="submit"
        disabled={busy}
        className="btn-gold btn-lg w-full flex items-center justify-center gap-2"
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            <Shield className="w-4 h-4" />
            Set up my account
          </>
        )}
      </button>
    </form>
  );
}

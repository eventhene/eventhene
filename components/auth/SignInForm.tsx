"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [otpChannel, setOtpChannel] = useState<"email" | "sms">("email");
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpErr, setOtpErr] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, otpChannel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign-in failed");
      if (data.phone) setMaskedPhone(data.phone);
      if (data.otpChannel) setOtpChannel(data.otpChannel);
      setStep("otp");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpBusy(true);
    setOtpErr(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code: otpCode, channel: otpChannel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      router.push(next || "/dashboard");
      router.refresh();
    } catch (e: any) {
      setOtpErr(e.message);
      setOtpBusy(false);
    }
  }

  async function resendCode(channel?: "email" | "sms") {
    const useChannel = channel || otpChannel;
    if (channel) setOtpChannel(useChannel);
    setResending(true);
    setOtpErr(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, channel: useChannel }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resend");
      }
    } catch (e: any) {
      setOtpErr(e.message);
    } finally {
      setResending(false);
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={onVerifyOtp} className="space-y-4">
        <div className="text-center mb-2">
          <p className="text-sm text-ink-muted">
            We sent a 6-digit code to{" "}
            <strong className="text-ink">
              {otpChannel === "sms" ? maskedPhone : email}
            </strong>
          </p>
        </div>
        <div>
          <label className="label">Verification code</label>
          <input
            required
            autoFocus
            maxLength={6}
            inputMode="numeric"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            className="input text-center text-2xl font-extrabold tracking-[0.3em]"
            placeholder="------"
          />
        </div>

        {otpErr && <div className="rounded-xl bg-crimson/5 border border-crimson/20 text-crimson text-sm px-4 py-3 font-semibold">{otpErr}</div>}

        <button type="submit" disabled={otpBusy || otpCode.length < 6} className="btn-primary btn-lg w-full">
          {otpBusy && <span className="spinner" />}
          {otpBusy ? "Verifying..." : "Verify and sign in"}
        </button>
        <button type="button" onClick={() => resendCode()} disabled={resending} className="btn-ghost btn-md w-full">
          {resending ? "Sending..." : "Resend code"}
        </button>
        {maskedPhone && (
          <button
            type="button"
            onClick={() => resendCode(otpChannel === "sms" ? "email" : "sms")}
            disabled={resending}
            className="btn-ghost btn-sm w-full text-ink-muted"
          >
            {otpChannel === "sms" ? "Send to email instead" : `Send to ${maskedPhone} instead`}
          </button>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Password</label>
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="text-[11px] text-ink-muted hover:text-ink"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        <input
          type={showPw ? "text" : "password"}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="Your password"
        />
      </div>

      <div>
        <label className="label">Send code via</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOtpChannel("email")}
            className={`btn-md flex-1 ${otpChannel === "email" ? "btn-primary" : "btn-ghost"}`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setOtpChannel("sms")}
            className={`btn-md flex-1 ${otpChannel === "sms" ? "btn-primary" : "btn-ghost"}`}
          >
            SMS
          </button>
        </div>
      </div>

      {err && <div className="rounded-xl bg-crimson/5 border border-crimson/20 text-crimson text-sm px-4 py-3 font-semibold">{err}</div>}

      <button type="submit" disabled={busy} className="btn-primary btn-lg w-full">
        {busy && <span className="spinner" />}
        {busy ? "Checking..." : "Continue"}
      </button>
    </form>
  );
}

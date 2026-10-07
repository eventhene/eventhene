"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignUpForm({ next }: { next?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          country: "GH",
          currency: "GHS",
          timezone: "Africa/Accra",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign-up failed");
      if (data.phone) setMaskedPhone(data.phone);
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
      router.push(next || "/onboarding");
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
          {otpBusy ? "Verifying..." : "Verify and continue"}
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
        <label className="label">Your name</label>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input"
          placeholder="Kojo Mensah"
          autoComplete="name"
        />
      </div>
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
        <label className="label">Phone number</label>
        <input
          type="tel"
          required
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input"
          placeholder="0241234567"
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
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="At least 8 characters"
        />
        <p className="help">8+ characters, with at least one letter and one number.</p>
      </div>

      {err && <div className="rounded-xl bg-crimson/5 border border-crimson/20 text-crimson text-sm px-4 py-3 font-semibold">{err}</div>}

      <button type="submit" disabled={busy} className="btn-primary btn-lg w-full">
        {busy && <span className="spinner" />}
        {busy ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  { code: "GH", name: "Ghana", currency: "GHS", tz: "Africa/Accra" },
  { code: "NG", name: "Nigeria", currency: "NGN", tz: "Africa/Lagos" },
  { code: "KE", name: "Kenya", currency: "KES", tz: "Africa/Nairobi" },
  { code: "ZA", name: "South Africa", currency: "ZAR", tz: "Africa/Johannesburg" },
  { code: "US", name: "United States", currency: "USD", tz: "America/New_York" },
  { code: "GB", name: "United Kingdom", currency: "GBP", tz: "Europe/London" },
];

export function SignUpForm({ next }: { next?: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("GH");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const c = COUNTRIES.find((x) => x.code === country)!;
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          country,
          currency: c.currency,
          timezone: c.tz,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign-up failed");
      router.push(next || "/onboarding");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
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
          placeholder="you@eventhene.com"
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
      <div>
        <label className="label">Country</label>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="input">
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.currency})
            </option>
          ))}
        </select>
      </div>

      {err && <div className="rounded-xl bg-crimson/5 border border-crimson/20 text-crimson text-sm px-4 py-3">{err}</div>}

      <button type="submit" disabled={busy} className="btn-primary btn-lg w-full">
        {busy && <span className="spinner" />}
        {busy ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}

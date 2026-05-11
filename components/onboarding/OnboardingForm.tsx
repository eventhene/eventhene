"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  { code: "GH", name: "Ghana", currency: "GHS", tz: "Africa/Accra" },
  { code: "NG", name: "Nigeria", currency: "NGN", tz: "Africa/Lagos" },
  { code: "KE", name: "Kenya", currency: "KES", tz: "Africa/Nairobi" },
  { code: "ZA", name: "South Africa", currency: "ZAR", tz: "Africa/Johannesburg" },
  { code: "US", name: "United States", currency: "USD", tz: "America/New_York" },
  { code: "GB", name: "United Kingdom", currency: "GBP", tz: "Europe/London" }
];

export function OnboardingForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("GH");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const c = COUNTRIES.find((x) => x.code === country)!;
    try {
      const res = await fetch("/api/organizers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName,
          country,
          currency: c.currency,
          timezone: c.tz
        })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Setup failed");
      }
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Organizer name</label>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="DJ Kay Live, Praise Tower Church, etc."
          className="input"
        />
        <p className="help">This is what attendees see on your event pages.</p>
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
      {err && <p className="err">{err}</p>}
      <button disabled={busy} className="btn-primary w-full justify-center">
        {busy ? "Setting up…" : "Continue to dashboard"}
      </button>
    </form>
  );
}

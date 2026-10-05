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

export function OnboardingForm({ defaultCountry = "GH" }: { defaultCountry?: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState(defaultCountry);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
          timezone: c.tz,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");
      router.push("/dashboard");
      router.refresh();
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
          placeholder="DJ Kay Live, Praise Tower, etc."
          className="input"
        />
        <p className="help">The name attendees see on your event pages.</p>
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
        {busy ? "Setting up..." : "Continue"}
      </button>
    </form>
  );
}

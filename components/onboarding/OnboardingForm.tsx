"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/organizers", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName,
          country: "GH",
          currency: "GHS",
          timezone: "Africa/Accra",
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
          placeholder="Fire Conference, Kingdom Encounter, etc."
          className="input"
        />
        <p className="help">The name attendees see on your event pages.</p>
      </div>

      {err && <div className="rounded-xl bg-crimson/5 border border-crimson/20 text-crimson text-sm px-4 py-3 font-semibold">{err}</div>}

      <button type="submit" disabled={busy} className="btn-primary btn-lg w-full">
        {busy && <span className="spinner" />}
        {busy ? "Setting up..." : "Continue"}
      </button>
    </form>
  );
}

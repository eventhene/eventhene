"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign-in failed");
      router.push(next || "/dashboard");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="••••••••"
        />
      </div>

      {err && <div className="rounded-xl bg-crimson/5 border border-crimson/20 text-crimson text-sm px-4 py-3">{err}</div>}

      <button type="submit" disabled={busy} className="btn-primary btn-lg w-full">
        {busy && <span className="spinner" />}
        {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

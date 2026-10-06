"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SenderIdForm({
  currentSenderId,
  currentStatus,
  currentNote,
}: {
  currentSenderId: string | null;
  currentStatus: string;
  currentNote: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentSenderId ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sanitized = value.replace(/[^A-Za-z0-9]/g, "").slice(0, 11);
  const canResubmit = currentStatus === "NONE" || currentStatus === "REJECTED" || currentStatus === "APPROVED";
  const locked = currentStatus === "PENDING";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);
    if (sanitized.length < 3) { setErr("Needs at least 3 characters."); return; }
    if (!/[A-Za-z]/.test(sanitized)) { setErr("Must include at least one letter."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/organizers/me/sender-id", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ senderId: sanitized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSuccess("Submitted. An admin will review within 24 hours.");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Requested Sender ID</label>
        <div className="relative">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={locked}
            maxLength={11}
            placeholder="YOURBRAND"
            className="input font-mono uppercase tracking-wider"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-faint font-mono">
            {sanitized.length}/11
          </span>
        </div>
        <p className="help">
          1-11 letters or numbers. We clean out spaces and symbols automatically.
          Will send as: <strong className="font-mono text-ink">{sanitized || "---"}</strong>
        </p>
      </div>

      {currentStatus === "REJECTED" && currentNote && (
        <div className="rounded-xl bg-crimson/5 border border-crimson/20 text-crimson text-sm p-4">
          <p className="font-semibold mb-1">Previously rejected</p>
          <p>{currentNote}</p>
        </div>
      )}
      {currentStatus === "APPROVED" && (
        <div className="rounded-xl bg-emerald/5 border border-emerald/20 text-emerald text-sm p-4">
          Your custom Sender ID <strong className="font-mono">{currentSenderId}</strong> is live.
        </div>
      )}
      {currentStatus === "PENDING" && (
        <div className="rounded-xl bg-sky/5 border border-sky/20 text-sky text-sm p-4">
          Request pending review. Current: <strong className="font-mono">{currentSenderId}</strong>
        </div>
      )}

      {err && <div className="rounded-xl bg-crimson/5 border border-crimson/20 text-crimson text-sm px-4 py-3">{err}</div>}
      {success && <div className="rounded-xl bg-emerald/5 border border-emerald/20 text-emerald text-sm px-4 py-3">{success}</div>}

      <button
        type="submit"
        disabled={busy || locked || !canResubmit}
        className="btn-primary btn-md"
      >
        {busy && <span className="spinner" />}
        {busy ? "Submitting..." : locked ? "Awaiting review" : currentStatus === "APPROVED" ? "Change Sender ID" : "Request Sender ID"}
      </button>
    </form>
  );
}

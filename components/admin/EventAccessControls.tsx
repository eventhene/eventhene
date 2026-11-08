"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, Unlock, Lock, RotateCcw } from "lucide-react";

/**
 * Superadmin override on a finished event. Reopen it for a window so something
 * can be fixed or a late guest let in, shut it early, or clear the override and
 * let the dates decide again.
 */
export function EventAccessControls({
  eventId,
  reopenedUntil,
  forceClosed,
  finished,
}: {
  eventId: string;
  reopenedUntil: string | null;
  forceClosed: boolean;
  finished: boolean;
}) {
  const router = useRouter();
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const openUntil = reopenedUntil ? new Date(reopenedUntil) : null;
  const reopenActive = !forceClosed && openUntil !== null && openUntil.getTime() > Date.now();

  async function act(action: "REOPEN" | "CLOSE" | "CLEAR") {
    setBusy(action);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/access`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, hours }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not change that.");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-sky/25 bg-sky/[0.07] p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-sky" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Platform admin</h2>
      </div>

      <p className="mt-2 text-sm text-white/55">
        {forceClosed
          ? "You closed this event early. Registration is shut regardless of its dates."
          : reopenActive
            ? `Reopened until ${openUntil!.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}. Registration and editing work again until then.`
            : finished
              ? "This event has finished. The organizer cannot edit it or take registrations."
              : "This event is running normally."}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {!reopenActive && (
          <>
            <label className="flex items-center gap-2 text-xs text-white/50">
              Reopen for
              <select
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="input h-9 w-28 py-0 text-sm text-white"
              >
                {[2, 6, 12, 24, 48, 72, 168].map((h) => (
                  <option key={h} value={h}>
                    {h < 24 ? `${h} hours` : `${h / 24} day${h === 24 ? "" : "s"}`}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => act("REOPEN")}
              disabled={busy !== null}
              className="btn-gold btn-md inline-flex items-center gap-2"
            >
              {busy === "REOPEN" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
              {busy === "REOPEN" ? "Reopening..." : "Reopen"}
            </button>
          </>
        )}

        {!forceClosed && (
          <button
            onClick={() => act("CLOSE")}
            disabled={busy !== null}
            className="btn-ghost-dark btn-md inline-flex items-center gap-2"
          >
            {busy === "CLOSE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {busy === "CLOSE" ? "Closing..." : "Close now"}
          </button>
        )}

        {(forceClosed || reopenActive) && (
          <button
            onClick={() => act("CLEAR")}
            disabled={busy !== null}
            className="btn-ghost-dark btn-md inline-flex items-center gap-2"
          >
            {busy === "CLEAR" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            {busy === "CLEAR" ? "Clearing..." : "Back to its dates"}
          </button>
        )}
      </div>

      {err && <p className="mt-3 text-sm text-crimson">{err}</p>}
      <p className="mt-3 text-xs text-white/35">Every change here is written to the admin log.</p>
    </section>
  );
}

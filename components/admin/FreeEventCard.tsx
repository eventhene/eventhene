"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FreeEventCard({ event }: { event: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<null | "edits" | "reject">(null);
  const [note, setNote] = useState("");

  async function approve() {
    setBusy(true);
    await fetch(`/api/admin/events/${event.id}/approve`, { method: "POST" });
    router.refresh();
  }
  async function requestEdits() {
    setBusy(true);
    await fetch(`/api/admin/events/${event.id}/request-edits`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note })
    });
    router.refresh();
  }
  async function reject() {
    setBusy(true);
    await fetch(`/api/admin/events/${event.id}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: note })
    });
    router.refresh();
  }

  return (
    <div className="card p-5">
      <div className="flex justify-between mb-2">
        <h2 className="h-display text-xl">{event.title}</h2>
        <span className="chip-warning">{event.status.replace("_", " ")}</span>
      </div>
      <p className="text-sm text-ink-muted mb-3">
        by <strong>{event.organizer.displayName}</strong> · {event.venue} · {new Date(event.startsAt).toLocaleString()}
      </p>
      <p className="text-sm whitespace-pre-wrap mb-3">{event.description}</p>
      <div className="text-xs text-ink-muted mb-4">
        {event.ticketTypes.length} ticket type(s) · total capacity{" "}
        {event.ticketTypes.reduce((s: number, t: any) => s + t.quantity, 0)}
      </div>

      {!mode && (
        <div className="flex flex-wrap gap-2">
          <button onClick={approve} disabled={busy} className="btn-primary text-sm">✓ Approve</button>
          <button onClick={() => setMode("edits")} className="btn-secondary text-sm">✏️ Request edits</button>
          <button onClick={() => setMode("reject")} className="btn-danger text-sm">✗ Reject</button>
        </div>
      )}
      {mode && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={mode === "edits" ? "What needs to change?" : "Reason for rejection"}
            className="input"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={mode === "edits" ? requestEdits : reject}
              disabled={busy || !note}
              className={mode === "edits" ? "btn-primary text-sm" : "btn-danger text-sm"}
            >
              Confirm {mode === "edits" ? "request" : "reject"}
            </button>
            <button onClick={() => setMode(null)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

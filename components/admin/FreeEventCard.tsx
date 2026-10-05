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
      body: JSON.stringify({ note }),
    });
    router.refresh();
  }
  async function reject() {
    setBusy(true);
    await fetch(`/api/admin/events/${event.id}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: note }),
    });
    router.refresh();
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="h-card">{event.title}</h2>
          <p className="text-sm text-ink-muted mt-1">
            by <strong>{event.organizer.displayName}</strong> · {event.venue} · {new Date(event.startsAt).toLocaleString()}
          </p>
        </div>
        <span className="chip-sky shrink-0">{event.status.replace("_", " ")}</span>
      </div>
      <p className="text-sm whitespace-pre-wrap text-ink-muted mb-4">{event.description}</p>
      <div className="text-xs text-ink-muted mb-5">
        {event.ticketTypes.length} ticket type{event.ticketTypes.length === 1 ? "" : "s"} · total capacity{" "}
        {event.ticketTypes.reduce((s: number, t: any) => s + t.quantity, 0)}
      </div>

      {!mode && (
        <div className="flex flex-wrap gap-2">
          <button onClick={approve} disabled={busy} className="btn-primary btn-md">
            {busy && <span className="spinner" />}
            Approve
          </button>
          <button onClick={() => setMode("edits")} className="btn-ghost btn-md">Request edits</button>
          <button onClick={() => setMode("reject")} className="btn-danger btn-md">Reject</button>
        </div>
      )}
      {mode && (
        <div className="space-y-3">
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
              className={mode === "edits" ? "btn-primary btn-md" : "btn-danger btn-md"}
            >
              {busy && <span className="spinner" />}
              Confirm {mode === "edits" ? "request" : "reject"}
            </button>
            <button onClick={() => setMode(null)} className="btn-ghost btn-md">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SenderIdRow({ organizer }: { organizer: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const [note, setNote] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  async function approve() {
    setBusy("approve");
    await fetch(`/api/admin/sender-ids/${organizer.id}`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "APPROVE", note: note || undefined }),
    });
    router.refresh();
  }

  async function reject() {
    if (!note) return;
    setBusy("reject");
    await fetch(`/api/admin/sender-ids/${organizer.id}`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "REJECT", note }),
    });
    router.refresh();
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{organizer.displayName}</p>
          <p className="text-xs text-ink-muted">{organizer.user.email}</p>
          <p className="mt-3">
            Requested: <strong className="font-mono text-royal-2 text-lg">{organizer.senderId}</strong>
          </p>
        </div>
        <span className="chip-sky">Pending</span>
      </div>

      {!rejectOpen && (
        <div className="flex gap-2 mt-5">
          <button onClick={approve} disabled={busy !== null} className="btn-primary btn-md">
            {busy === "approve" && <span className="spinner" />}
            Approve
          </button>
          <button onClick={() => setRejectOpen(true)} className="btn-danger btn-md">
            Reject
          </button>
        </div>
      )}

      {rejectOpen && (
        <div className="mt-5 space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for rejection (shown to the organizer)"
            className="input"
            rows={2}
          />
          <div className="flex gap-2">
            <button onClick={reject} disabled={busy !== null || !note} className="btn-danger btn-md">
              {busy === "reject" && <span className="spinner" />}
              Confirm reject
            </button>
            <button onClick={() => setRejectOpen(false)} className="btn-ghost btn-md">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

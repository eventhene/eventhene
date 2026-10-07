"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface Props {
  organizerId: string;
  displayName: string;
  eventCount: number;
}

export function DeleteOrganizerButton({ organizerId, displayName, eventCount }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/organizers/${organizerId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete.");
        setDeleting(false);
        return;
      }
      router.refresh();
      setConfirming(false);
    } catch {
      setError("Network error.");
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition"
        title="Delete organizer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => !deleting && setConfirming(false)}>
      <div className="card-glass rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white">Delete organizer?</h3>
        <p className="text-sm text-white/60">
          This will permanently delete <strong className="text-white">{displayName}</strong> and reset their account to attendee.
        </p>
        {eventCount > 0 && (
          <p className="text-sm text-amber-400">
            This organizer has {eventCount} event{eventCount > 1 ? "s" : ""} - they will also be deleted.
          </p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="btn-ghost btn-md flex-1 text-white/60"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger btn-md flex-1 flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

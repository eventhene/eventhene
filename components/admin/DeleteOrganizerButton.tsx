"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

interface Props {
  organizerId: string;
  displayName: string;
  eventCount: number;
  hasPayoutAccount?: boolean;
}

export function DeleteOrganizerButton({ organizerId, displayName, eventCount, hasPayoutAccount }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [deleteAccount, setDeleteAccount] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!confirming) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [confirming]);

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/organizers/${organizerId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deleteAccount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to delete.");
        setDeleting(false);
        return;
      }
      setConfirming(false);
      setDeleting(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setDeleting(false);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={() => !deleting && setConfirming(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#121216] p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Delete organizer?</h3>
        </div>
        <p className="text-sm text-white/60">
          This permanently deletes <strong className="text-white">{displayName}</strong> and resets their account to attendee.
        </p>
        {eventCount > 0 && (
          <p className="text-sm text-amber-400">
            Their {eventCount} event{eventCount > 1 ? "s" : ""} will also be deleted, along with all tickets, attendees, orders and SMS campaigns.
          </p>
        )}
        {hasPayoutAccount && (
          <p className="text-xs text-white/40">
            Their Paystack payout subaccount will be deactivated (Paystack does not allow deleting subaccounts).
          </p>
        )}
        <label className="flex items-start gap-2 text-sm text-white/70 cursor-pointer">
          <input type="checkbox" className="mt-1" checked={deleteAccount} onChange={(e) => setDeleteAccount(e.target.checked)} disabled={deleting} />
          <span>
            Also delete their login account
            <span className="block text-xs text-white/35">Frees the email so it can sign up again. Without this, the login stays as a normal attendee.</span>
          </span>
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition"
        title="Delete organizer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      {confirming && mounted && createPortal(modal, document.body)}
    </>
  );
}

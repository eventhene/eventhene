"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, UndoDot, AlertTriangle } from "lucide-react";
import { binDeleted, onBinRestored, rectOf } from "@/lib/recycle-bus";

export interface AttendeeRow {
  id: string;
  ref: string;
  name: string;
  typeName: string;
  status: string;
  registeredAt: string;
  checkedInAt: string | null;
  values: Record<string, string>;
}
export interface AttendeeCol {
  key: string;
  label: string;
}

function stamp(iso: string | null, tz: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: tz,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function AttendeesTable({
  eventId,
  eventType,
  timezone,
  cols,
  rows: initialRows,
}: {
  eventId: string;
  eventType: "PAID" | "FREE";
  timezone: string;
  cols: AttendeeCol[];
  rows: AttendeeRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState<AttendeeRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uncheckBusy, setUncheckBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => setRows(initialRows), [initialRows]);
  // something was restored from the bin: pull the fresh list
  useEffect(() => onBinRestored((k) => k === "guest" && router.refresh()), [router]);

  async function removeCheckIn(row: AttendeeRow) {
    setUncheckBusy(row.id);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/tickets/${row.id}/uncheckin`, { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not remove the check-in.");
      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status: data.status ?? "REGISTERED", checkedInAt: null } : x)));
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUncheckBusy(null);
    }
  }

  async function confirmDelete(e: React.MouseEvent<HTMLButtonElement>) {
    // capture the button's position NOW, before the modal closes, so the icon can fly from it
    const rect = rectOf(e.currentTarget);
    if (!target) return;
    const row = target;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/tickets/${row.id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete this guest.");
      setTarget(null);
      setRows((r) => r.filter((x) => x.id !== row.id));
      binDeleted("guest", rect);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const statusChip = (r: AttendeeRow) =>
    r.status === "ATTENDED" ? (
      <span className="chip-emerald">Checked in</span>
    ) : (
      <span className="chip-outline">{r.status.replace("_", " ").toLowerCase()}</span>
    );

  const actionBtn = "inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5 transition disabled:opacity-60";

  const modal = target && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => !deleting && setTarget(null)}>
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#121216] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Delete this guest?</h3>
        </div>
        <p className="text-sm text-white/60">
          <strong className="text-white">{target.name}</strong> ({target.ref}) will be removed from the list.
        </p>
        <p className="text-xs text-white/40">
          They go to the recycle bin, where you can restore them. Who deleted them, and when, is saved in the activity log.
        </p>
        {eventType === "PAID" && (
          <p className="text-xs text-amber-400">This does not refund any payment. Handle refunds separately.</p>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={() => setTarget(null)} disabled={deleting} className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={confirmDelete} disabled={deleting} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-70">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );

  if (rows.length === 0) {
    // stay mounted when empty so a restore from the recycle bin brings guests straight back
    return <div className="card p-16 text-center text-ink-muted">No guests yet.</div>;
  }

  return (
    <>
      {error && <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

      {/* phones: one card per guest with every detail */}
      <div className="space-y-2.5 md:hidden">
        {rows.map((r) => (
          <div key={r.id} className="card min-w-0 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 break-words font-semibold">{r.name}</p>
              {statusChip(r)}
            </div>
            <p className="mt-1 break-all font-mono text-xs text-ink-muted">{r.ref}</p>
            <dl className="mt-3 space-y-1.5 text-xs">
              <Detail label="Category" value={r.typeName} />
              {cols.map((c) => (r.values[c.key] ? <Detail key={c.key} label={c.label} value={r.values[c.key]} /> : null))}
              <Detail label="Registered" value={stamp(r.registeredAt, timezone)} />
              <Detail label="Checked in" value={stamp(r.checkedInAt, timezone)} />
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.status === "ATTENDED" && (
                <button onClick={() => removeCheckIn(r)} disabled={uncheckBusy === r.id} className={actionBtn}>
                  {uncheckBusy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UndoDot className="h-3.5 w-3.5" />}
                  {uncheckBusy === r.id ? "Removing..." : "Remove check-in"}
                </button>
              )}
              <button onClick={() => setTarget(r)} className={`${actionBtn} text-red-400`}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* larger screens: a table that scrolls sideways so no column is ever lost */}
      <div className="hidden md:block">
        <p className="mb-2 text-xs text-ink-muted">Scroll sideways to see every column.</p>
        <div className="card overflow-x-auto">
          <table className="min-w-max text-sm">
            <thead className="bg-surface-2 text-left">
              <tr>
                <Th>Reference</Th>
                <Th>Name</Th>
                <Th>Category</Th>
                {cols.map((c) => (
                  <Th key={c.key}>{c.label}</Th>
                ))}
                <Th>Status</Th>
                <Th>Registered</Th>
                <Th>Checked in</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-surface-2/50">
                  <Td mono>{r.ref}</Td>
                  <Td strong>{r.name}</Td>
                  <Td><span className="chip-outline">{r.typeName}</span></Td>
                  {cols.map((c) => (
                    <Td key={c.key}>{r.values[c.key] || "-"}</Td>
                  ))}
                  <Td>{statusChip(r)}</Td>
                  <Td>{stamp(r.registeredAt, timezone)}</Td>
                  <Td>{stamp(r.checkedInAt, timezone)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      {r.status === "ATTENDED" && (
                        <button onClick={() => removeCheckIn(r)} disabled={uncheckBusy === r.id} className={actionBtn}>
                          {uncheckBusy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UndoDot className="h-3.5 w-3.5" />}
                          {uncheckBusy === r.id ? "Removing..." : "Remove check-in"}
                        </button>
                      )}
                      <button onClick={() => setTarget(r)} className={`${actionBtn} text-red-400`} aria-label={`Delete ${r.name}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3.5">{children}</th>;
}
function Td({ children, mono, strong }: { children: React.ReactNode; mono?: boolean; strong?: boolean }) {
  return <td className={`whitespace-nowrap px-4 py-3 ${mono ? "font-mono text-xs" : ""} ${strong ? "font-medium" : "text-ink-muted"}`}>{children}</td>;
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right">{value}</dd>
    </div>
  );
}

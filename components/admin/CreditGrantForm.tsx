"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  organizers: { id: string; name: string; balance: number; email: string; frozen: boolean }[];
}

export function CreditGrantForm({ organizers }: Props) {
  const router = useRouter();
  const [orgId, setOrgId] = useState(organizers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"GRANT" | "PURCHASE" | "ADJUST">("GRANT");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selected = organizers.find((o) => o.id === orgId);

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);
    const n = parseInt(amount, 10);
    if (!orgId || !Number.isFinite(n) || n === 0) {
      setErr("Pick an organizer and a non-zero amount.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/sms/credits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizerId: orgId, amount: n, kind, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSuccess(`Done. New balance: ${data.balanceAfter}.`);
      setAmount("");
      setNote("");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleFreeze() {
    if (!selected) return;
    setFreezing(true);
    try {
      await fetch("/api/admin/sms/freeze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizerId: selected.id, frozen: !selected.frozen }),
      });
      router.refresh();
    } finally {
      setFreezing(false);
    }
  }

  return (
    <div className="card p-6">
      <form onSubmit={grant} className="grid md:grid-cols-[2fr,1fr,1fr,auto] gap-3 items-end">
        <div>
          <label className="label">Organizer</label>
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="input">
            {organizers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.balance} credits) - {o.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Amount</label>
          <input
            type="number"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500"
            className="input font-mono"
          />
        </div>
        <div>
          <label className="label">Kind</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as any)} className="input">
            <option value="GRANT">Grant</option>
            <option value="PURCHASE">Purchase</option>
            <option value="ADJUST">Adjust</option>
          </select>
        </div>
        <button type="submit" disabled={busy} className="btn-primary btn-lg">
          {busy && <span className="spinner" />}
          Apply
        </button>
        <div className="md:col-span-4">
          <label className="label">Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Launch bonus 500 credits" className="input" />
        </div>
      </form>
      {err && <div className="mt-3 rounded-xl bg-crimson/5 border border-crimson/20 text-crimson text-sm px-4 py-3">{err}</div>}
      {success && <div className="mt-3 rounded-xl bg-emerald/5 border border-emerald/20 text-emerald text-sm px-4 py-3">{success}</div>}

      {selected && (
        <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
          <div className="text-sm">
            Freeze flag:{" "}
            {selected.frozen ? (
              <span className="chip-crimson">Frozen (sends blocked)</span>
            ) : (
              <span className="chip-emerald">Normal</span>
            )}
          </div>
          <button onClick={toggleFreeze} disabled={freezing} className={selected.frozen ? "btn-primary btn-sm" : "btn-danger btn-sm"}>
            {freezing && <span className="spinner" />}
            {selected.frozen ? "Unfreeze" : "Freeze"}
          </button>
        </div>
      )}
    </div>
  );
}

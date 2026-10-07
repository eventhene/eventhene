"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Copy, Check, Trash2, Ticket } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  note: string | null;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string;
}

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [quantity, setQuantity] = useState("1");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [created, setCreated] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setCreated([]);
    const qty = customCode.trim() ? 1 : Math.min(20, Math.max(1, parseInt(quantity || "1", 10)));
    const made: string[] = [];
    try {
      for (let i = 0; i < qty; i++) {
        const res = await fetch("/api/admin/coupons", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            code: customCode.trim() || undefined,
            note: note.trim() || undefined,
            maxUses: Math.max(1, parseInt(maxUses || "1", 10)),
            expiresAt: expires ? new Date(expires + "T23:59:59").toISOString() : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error === "Code already exists" ? "That code already exists." : "Could not create the coupon.");
        made.push(data.code);
      }
      setCreated(made);
      setCustomCode("");
      setNote("");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
      if (made.length) {
        setCreated(made);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  async function remove(id: string) {
    if (!confirm("Delete this coupon? It will stop working immediately.")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: "DELETE", credentials: "include" });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={generate} className="card-glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Generate coupons</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Who is it for? (note)">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Grace Chapel youth night" className="input text-white" maxLength={200} />
          </Field>
          <Field label="Custom code (optional)">
            <input value={customCode} onChange={(e) => setCustomCode(e.target.value.toUpperCase())} placeholder="Leave blank to auto-generate" className="input text-white font-mono" maxLength={30} />
          </Field>
          <Field label="Uses per code">
            <input type="number" min={1} max={10000} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="input text-white" />
          </Field>
          <Field label="How many codes">
            <input type="number" min={1} max={20} value={customCode.trim() ? "1" : quantity} disabled={!!customCode.trim()} onChange={(e) => setQuantity(e.target.value)} className="input text-white" />
          </Field>
          <Field label="Expires (optional)">
            <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="input text-white" />
          </Field>
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}

        <button disabled={busy} className="btn-gold btn-md flex items-center gap-2">
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Generate
            </>
          )}
        </button>

        {created.length > 0 && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
            <p className="text-xs font-semibold text-emerald-400">Created. Copy and send to the organizer:</p>
            <div className="flex flex-wrap gap-2">
              {created.map((c) => (
                <button type="button" key={c} onClick={() => copy(c)} className="inline-flex items-center gap-2 rounded-lg bg-black/30 px-3 py-1.5 font-mono text-sm text-white hover:bg-black/50">
                  {c}
                  {copied === c ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      <section>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">All coupons ({coupons.length})</h2>
        {coupons.length === 0 ? (
          <div className="card-glass rounded-2xl p-8 text-center text-sm text-white/40">No coupons yet.</div>
        ) : (
          <div className="space-y-2">
            {coupons.map((c) => {
              const expired = !!c.expiresAt && new Date(c.expiresAt) < new Date();
              const used = c.usedCount >= c.maxUses;
              const status = expired ? "Expired" : used ? "Used up" : "Active";
              const tone = expired || used ? "bg-white/10 text-white/50" : "bg-emerald-500/20 text-emerald-400";
              return (
                <div key={c.id} className="card-glass rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => copy(c.code)} className="font-mono text-sm font-bold text-white hover:text-accent inline-flex items-center gap-1.5">
                        {c.code}
                        {copied === c.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/30" />}
                      </button>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${tone}`}>{status}</span>
                    </div>
                    <p className="text-xs text-white/40 mt-1 truncate">
                      {c.note || "No note"} - used {c.usedCount}/{c.maxUses}
                      {c.expiresAt ? ` - expires ${new Date(c.expiresAt).toLocaleDateString()}` : ""}
                    </p>
                    <p className="text-[11px] text-white/25 truncate">by {c.createdBy} on {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => remove(c.id)}
                    disabled={deleting === c.id}
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition shrink-0"
                    aria-label={`Delete ${c.code}`}
                  >
                    {deleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

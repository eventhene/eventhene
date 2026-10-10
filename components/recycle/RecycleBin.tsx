"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { User, Phone, ListChecks, Users, Loader2, RotateCcw, X, Info } from "lucide-react";
import { PagedList } from "./PagedList";
import {
  onBinChanged,
  onBinFly,
  binRestored,
  type BinKind,
  type FlyDetail,
} from "@/lib/recycle-bus";

interface BinItem {
  id: string;
  kind: BinKind;
  label: string;
  actorName: string;
  createdAt: string;
}

interface Flight {
  id: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  kind: BinKind;
}

const KIND_ICON: Record<BinKind, React.ReactNode> = {
  guest: <User className="w-4 h-4" />,
  contact: <Phone className="w-4 h-4" />,
  contact_list: <ListChecks className="w-4 h-4" />,
  team_member: <Users className="w-4 h-4" />,
};

const KIND_NAME: Record<BinKind, string> = {
  guest: "Guest",
  contact: "SMS contact",
  contact_list: "Contact list",
  team_member: "Team member",
};

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function RecycleBin({ scopeId }: { scopeId: string }) {
  const binRef = useRef<HTMLButtonElement>(null);
  const shake = useAnimationControls();
  const flightId = useRef(0);

  const [items, setItems] = useState<BinItem[]>([]);
  const [open, setOpen] = useState(false);
  const [lidOpen, setLidOpen] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [emptying, setEmptying] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/recycle-bin?scope=${encodeURIComponent(scopeId)}`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {}
  }, [scopeId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const bounce = useCallback(() => {
    shake.start({
      rotate: [0, -16, 13, -9, 6, -3, 0],
      scale: [1, 1.14, 1, 1.07, 1],
      transition: { duration: 0.6, ease: "easeInOut" },
    });
  }, [shake]);

  const land = useCallback(() => {
    setLidOpen(false);
    bounce();
  }, [bounce]);

  // a delete just happened somewhere: fly the icon in (or just pop the lid if there is no origin)
  useEffect(() => {
    return onBinFly((d: FlyDetail) => {
      const target = binRef.current?.getBoundingClientRect();
      setLidOpen(true);
      if (!d.rect || !target) {
        setTimeout(land, 350);
        return;
      }
      const id = ++flightId.current;
      setFlights((f) => [
        ...f,
        {
          id,
          kind: d.kind,
          x0: d.rect!.x + d.rect!.w / 2 - 20,
          y0: d.rect!.y + d.rect!.h / 2 - 20,
          x1: target.left + target.width / 2 - 20,
          y1: target.top + target.height / 2 - 20,
        },
      ]);
    });
  }, [land]);

  useEffect(() => onBinChanged(refetch), [refetch]);

  async function restore(item: BinItem) {
    setBusyId(item.id);
    setRowError((e) => ({ ...e, [item.id]: "" }));
    try {
      const res = await fetch(`/api/recycle-bin/${item.id}/restore`, { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setItems((list) => list.filter((i) => i.id !== item.id));
        setNotice(data.note ? `Restored. ${data.note}` : "Restored.");
        setTimeout(() => setNotice(null), 3500);
        binRestored(item.kind);
      } else {
        setRowError((e) => ({ ...e, [item.id]: data.reason || "Could not restore this item." }));
      }
    } catch {
      setRowError((e) => ({ ...e, [item.id]: "Network error. Try again." }));
    } finally {
      setBusyId(null);
    }
  }

  async function emptyBin() {
    setEmptying(true);
    try {
      const res = await fetch("/api/recycle-bin", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "empty", scope: scopeId }),
      });
      if (res.ok) {
        setItems([]);
        setConfirmEmpty(false);
      }
    } finally {
      setEmptying(false);
    }
  }

  const count = items.length;

  return (
    <>
      {/* ---------- flying icons ---------- */}
      <AnimatePresence>
        {flights.map((f) => (
          <motion.div
            key={f.id}
            className="pointer-events-none fixed left-0 top-0 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-accent text-black shadow-lg"
            initial={{ x: f.x0, y: f.y0, scale: 1, opacity: 1, rotate: 0 }}
            animate={{ x: f.x1, y: f.y1, scale: 0.35, opacity: 0.25, rotate: 35 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={() => {
              setFlights((list) => list.filter((x) => x.id !== f.id));
              land();
              refetch();
            }}
          >
            {KIND_ICON[f.kind]}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ---------- panel ---------- */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-[44]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); setConfirmEmpty(false); }}
            />
            <motion.div
              key="panel"
              role="dialog"
              aria-label="Recycle bin"
              className="fixed bottom-[150px] right-4 z-[46] flex max-h-[68vh] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121216] shadow-2xl md:bottom-[96px] md:right-6"
              style={{ transformOrigin: "bottom right" }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-white">Deleted items</p>
                  <p className="text-[11px] text-white/40">{count === 0 ? "Nothing here" : `${count} can be restored`}</p>
                </div>
                <div className="flex items-center gap-1">
                  {count > 0 && !confirmEmpty && (
                    <button onClick={() => setConfirmEmpty(true)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-400/10 transition">
                      Empty bin
                    </button>
                  )}
                  <button onClick={() => { setOpen(false); setConfirmEmpty(false); }} className="p-1.5 text-white/40 hover:text-white" aria-label="Close">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {confirmEmpty && (
                  <motion.div
                    key="confirm"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-white/10 bg-red-500/5"
                  >
                    <div className="space-y-3 px-4 py-3">
                      <p className="text-xs text-white/70">
                        Empty the bin? This only clears the ability to undo. Your real guests, contacts and lists are not affected.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmEmpty(false)} disabled={emptying} className="flex-1 rounded-lg border border-white/15 py-2 text-xs font-semibold text-white/70 hover:bg-white/5">
                          Cancel
                        </button>
                        <button onClick={emptyBin} disabled={emptying} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-70">
                          {emptying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {emptying ? "Emptying..." : "Yes, empty bin"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {notice && <p className="border-b border-white/10 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">{notice}</p>}

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                <PagedList
                  items={items}
                  storageKey="bin-items"
                  empty={
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <p className="text-sm font-semibold text-white/70">The bin is empty</p>
                      <p className="max-w-[240px] text-xs text-white/35">When you delete a guest, contact or list it lands here, and you can restore it.</p>
                    </div>
                  }
                  render={(item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={false}
                      exit={{ height: 0, opacity: 0, x: 48, marginBottom: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="mb-2 overflow-hidden"
                    >
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-accent">{KIND_ICON[item.kind]}</div>
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-semibold leading-snug text-white">{item.label}</p>
                            <p className="mt-0.5 text-[11px] text-white/40">
                              {KIND_NAME[item.kind]} - deleted by {item.actorName} {timeAgo(item.createdAt)}
                            </p>
                          </div>
                          <button
                            onClick={() => restore(item)}
                            disabled={busyId === item.id}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent/15 px-2.5 py-1.5 text-xs font-bold text-accent hover:bg-accent/25 transition disabled:opacity-70"
                          >
                            {busyId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                            {busyId === item.id ? "Restoring..." : "Restore"}
                          </button>
                        </div>
                        {rowError[item.id] && <p className="mt-2 text-xs text-amber-400">{rowError[item.id]}</p>}
                      </div>
                    </motion.div>
                  )}
                />
              </div>

              <p className="flex items-start gap-1.5 border-t border-white/10 px-4 py-2.5 text-[10px] leading-relaxed text-white/30">
                <Info className="mt-px h-3 w-3 shrink-0" />
                Restoring an item brings back that item only. Things deleted along with it (for example a guest's payment record) are not restored.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ---------- the bin ---------- */}
      <motion.div className="fixed bottom-[76px] right-4 z-[45] md:bottom-6 md:right-6" animate={shake}>
        <button
          ref={binRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={count > 0 ? `Recycle bin, ${count} items` : "Recycle bin"}
          className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#17171c] text-accent shadow-xl transition hover:bg-[#1d1d23]"
        >
          <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden>
            <path
              d="M13 19h22l-1.6 17.2a3 3 0 0 1-3 2.8H17.6a3 3 0 0 1-3-2.8L13 19z"
              fill="currentColor"
              fillOpacity="0.22"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path d="M20 24v10M24 24v10M28 24v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <motion.g
              animate={{ rotate: lidOpen ? -38 : 0, y: lidOpen ? -1 : 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
              style={{ transformBox: "fill-box", transformOrigin: "0% 100%" }}
            >
              <rect x="10" y="13.5" width="28" height="4" rx="2" fill="currentColor" />
              <rect x="19" y="9.5" width="10" height="4" rx="2" stroke="currentColor" strokeWidth="2.2" />
            </motion.g>
          </svg>

          <AnimatePresence>
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 14 }}
                className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white"
              >
                {count > 99 ? "99+" : count}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    </>
  );
}

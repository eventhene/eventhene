"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";

const SIZES = [10, 25, 50, 100];

/**
 * Shows 10 rows by default; the bottom fades into a "Load N more" button, and a footer lets the
 * user pick how many to load at a time (remembered per list).
 */
export function PagedList<T>({
  items,
  storageKey,
  render,
  empty,
}: {
  items: T[];
  storageKey: string;
  render: (item: T, index: number) => React.ReactNode;
  empty?: React.ReactNode;
}) {
  const [pageSize, setPageSize] = useState(10);
  const [shown, setShown] = useState(10);

  useEffect(() => {
    try {
      const saved = parseInt(localStorage.getItem(`eh:pagesize:${storageKey}`) || "", 10);
      if (SIZES.includes(saved)) {
        setPageSize(saved);
        setShown(saved);
      }
    } catch {}
  }, [storageKey]);

  function changeSize(n: number) {
    setPageSize(n);
    setShown(n);
    try {
      localStorage.setItem(`eh:pagesize:${storageKey}`, String(n));
    } catch {}
  }

  if (items.length === 0) return <>{empty ?? null}</>;

  const visible = items.slice(0, shown);
  const left = Math.max(0, items.length - shown);
  const more = Math.min(pageSize, left);
  const fade = left > 0 ? { maskImage: "linear-gradient(to bottom, black calc(100% - 56px), transparent)", WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 56px), transparent)" } : undefined;

  return (
    <div>
      <div style={fade}>
        <AnimatePresence initial={false}>{visible.map((item, i) => render(item, i))}</AnimatePresence>
      </div>
      {left > 0 && (
        <button
          type="button"
          onClick={() => setShown((s) => s + pageSize)}
          className="mx-auto -mt-2 block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/15 transition"
        >
          Load {more} more ({left} left)
        </button>
      )}
      {items.length > 10 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-white/40">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => changeSize(parseInt(e.target.value, 10))}
            className="rounded-md bg-white/10 px-1.5 py-0.5 text-white outline-none"
            aria-label="Rows per page"
          >
            {SIZES.map((n) => (
              <option key={n} value={n} className="bg-[#121216]">{n}</option>
            ))}
          </select>
          <span>at a time</span>
        </div>
      )}
    </div>
  );
}

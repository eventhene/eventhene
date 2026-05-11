"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatMinorAmount } from "@/lib/utils";

interface TicketType {
  id: string;
  name: string;
  priceMinor: number;
  quantity: number;
  sold: number;
  notes: string | null;
  isActive: boolean;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  currency: string;
  type: "PAID" | "FREE";
  buyerPaysFee: boolean;
  country: string;
  ticketTypes: TicketType[];
}

const PLATFORM_FEE_RATE = 0.05;

function processorFeeMinor(amt: number, country: string): number {
  switch (country) {
    case "GH":
      return Math.min(Math.round(amt * 0.0195), 1000);
    case "NG":
      return Math.min(Math.round(amt * 0.015) + (amt >= 250000 ? 10000 : 0), 200000);
    default:
      return Math.round(amt * 0.029);
  }
}

export function TicketSelector({ event }: { event: Event }) {
  const [qty, setQty] = useState<Record<string, number>>({});

  const items = event.ticketTypes
    .map((t) => ({ tt: t, q: qty[t.id] || 0 }))
    .filter((x) => x.q > 0);

  const subtotal = items.reduce((sum, x) => sum + x.tt.priceMinor * x.q, 0);
  const totalQty = items.reduce((sum, x) => sum + x.q, 0);

  const totals = useMemo(() => {
    if (event.type === "FREE" || subtotal === 0) {
      return { subtotal, platformFee: 0, processorFee: 0, total: 0 };
    }
    const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
    if (event.buyerPaysFee) {
      const processor = processorFeeMinor(subtotal + platformFee, event.country);
      return { subtotal, platformFee, processorFee: processor, total: subtotal + platformFee + processor };
    }
    return { subtotal, platformFee: 0, processorFee: 0, total: subtotal };
  }, [subtotal, event.type, event.buyerPaysFee, event.country]);

  function setQ(id: string, q: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, Math.min(10, q)) }));
  }

  // Encode selection into URL for checkout page
  const checkoutHref = useMemo(() => {
    const params = new URLSearchParams();
    items.forEach((x) => params.append("tt", `${x.tt.id}:${x.q}`));
    return `/events/${event.slug}/checkout?${params.toString()}`;
  }, [items, event.slug]);

  return (
    <div className="space-y-3">
      {event.ticketTypes.map((t) => {
        const remaining = t.quantity - t.sold;
        const soldOut = remaining <= 0;
        return (
          <div
            key={t.id}
            className={`rounded-xl border p-4 flex items-center gap-3 ${
              soldOut ? "border-border bg-surface-2 opacity-60" : "border-border bg-white"
            }`}
          >
            <div className="flex-1">
              <p className="font-semibold">{t.name}</p>
              {t.notes && <p className="text-xs text-ink-muted mt-0.5">{t.notes}</p>}
              <p className="text-sm mt-1">
                {event.type === "FREE" || t.priceMinor === 0
                  ? "Free"
                  : formatMinorAmount(t.priceMinor, event.currency)}
              </p>
              {!soldOut && remaining < 20 && (
                <p className="text-xs text-warning mt-1">Only {remaining} left</p>
              )}
            </div>
            {soldOut ? (
              <span className="chip-danger">Sold out</span>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQ(t.id, (qty[t.id] || 0) - 1)}
                  className="w-9 h-9 rounded-full border border-border hover:bg-surface-2 disabled:opacity-30"
                  disabled={!qty[t.id]}
                  aria-label="Decrease"
                >−</button>
                <span className="w-6 text-center font-medium">{qty[t.id] || 0}</span>
                <button
                  onClick={() => setQ(t.id, (qty[t.id] || 0) + 1)}
                  className="w-9 h-9 rounded-full border border-border hover:bg-surface-2 disabled:opacity-30"
                  disabled={(qty[t.id] || 0) >= remaining || (qty[t.id] || 0) >= 10}
                  aria-label="Increase"
                >+</button>
              </div>
            )}
          </div>
        );
      })}

      {totalQty > 0 && (
        <div className="rounded-xl bg-surface-2 p-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal ({totalQty} tickets)</span>
            <span>{event.type === "FREE" ? "Free" : formatMinorAmount(totals.subtotal, event.currency)}</span>
          </div>
          {event.buyerPaysFee && event.type === "PAID" && (
            <>
              <div className="flex justify-between text-ink-muted">
                <span>Platform fee (5%)</span>
                <span>{formatMinorAmount(totals.platformFee, event.currency)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Payment fee</span>
                <span>{formatMinorAmount(totals.processorFee, event.currency)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold pt-2 border-t border-border">
            <span>Total</span>
            <span>{event.type === "FREE" ? "Free" : formatMinorAmount(totals.total, event.currency)}</span>
          </div>
        </div>
      )}

      <Link
        href={totalQty > 0 ? checkoutHref : "#"}
        aria-disabled={totalQty === 0}
        className={`btn-primary w-full justify-center text-base ${
          totalQty === 0 ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {event.type === "FREE" ? "Reserve my seat" : "Continue to checkout"}
      </Link>
      <p className="text-xs text-ink-muted text-center">
        Secured by EventHene. One ticket per attendee.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { formatMinorAmount } from "@/lib/utils";
import { openPaystackPopup } from "@/lib/paystack-popup";

interface Event {
  id: string;
  slug: string;
  title: string;
  currency: string;
  type: "PAID" | "FREE";
  attendeeFields: Array<{
    id: string;
    key: string;
    label: string;
    type: string;
    required: boolean;
    options: string[];
  }>;
}

interface Item {
  ticketType: { id: string; name: string; priceMinor: number };
  quantity: number;
}

export function CheckoutForm({ event, items }: { event: Event; items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Buyer info
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  // Attendees: flat array of attendee objects, one per ticket
  const totalAttendees = items.reduce((s, i) => s + i.quantity, 0);
  const [attendees, setAttendees] = useState<Record<string, any>[]>(
    Array.from({ length: totalAttendees }, () => ({}))
  );

  // Map attendee index -> ticketTypeId
  const attendeeTicketMap: string[] = [];
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) attendeeTicketMap.push(item.ticketType.id);
  }

  function setAttendeeField(idx: number, key: string, value: any) {
    setAttendees((prev) => prev.map((a, i) => (i === idx ? { ...a, [key]: value } : a)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      // Group attendees by ticketTypeId
      const itemsPayload = items.map((item) => {
        const startIdx = attendeeTicketMap.findIndex((tid) => tid === item.ticketType.id);
        const slice = attendees
          .map((a, i) => ({ a, i }))
          .filter((x) => attendeeTicketMap[x.i] === item.ticketType.id)
          .map((x) => x.a);
        return {
          ticketTypeId: item.ticketType.id,
          quantity: item.quantity,
          attendees: slice.map((a) => ({
            fullName: a.fullName ?? buyerName,
            email: a.email ?? buyerEmail,
            phone: a.phone ?? buyerPhone,
            gender: a.gender,
            city: a.city,
            address: a.address,
            organization: a.organization,
            ageRange: a.ageRange,
            emergencyContact: a.emergencyContact,
            customAnswers: a.customAnswers ?? {}
          }))
        };
      });

      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          buyerName,
          buyerEmail,
          buyerPhone,
          items: itemsPayload
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (data.accessCode) {
        await openPaystackPopup({
          accessCode: data.accessCode,
          onSuccess: () => router.push(`/orders/${data.orderId}/success`),
          onClose: () => setBusy(false),
        });
      } else {
        router.push(`/orders/${data.orderId}/success`);
      }
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  const subtotal = items.reduce((s, i) => s + i.ticketType.priceMinor * i.quantity, 0);

  // helper to determine which fields to render per attendee
  function renderAttendeeField(idx: number, f: Event["attendeeFields"][number]) {
    const key = f.key.toLowerCase();
    const val = attendees[idx]?.[mapFieldKey(f.key)] ?? "";

    if (f.type === "TEXTAREA") {
      return (
        <textarea
          required={f.required}
          value={val}
          onChange={(e) => setAttendeeField(idx, mapFieldKey(f.key), e.target.value)}
          className="input"
          rows={3}
        />
      );
    }
    if (f.type === "SELECT") {
      return (
        <select
          required={f.required}
          value={val}
          onChange={(e) => setAttendeeField(idx, mapFieldKey(f.key), e.target.value)}
          className="input"
        >
          <option value="">Choose…</option>
          {f.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        type={f.type === "EMAIL" ? "email" : f.type === "PHONE" ? "tel" : f.type === "NUMBER" ? "number" : "text"}
        required={f.required}
        value={val}
        onChange={(e) => setAttendeeField(idx, mapFieldKey(f.key), e.target.value)}
        className="input"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* BUYER */}
      <div className="card p-6">
        <h2 className="h-display text-xl mb-4">Your details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Full name</label>
            <input required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} className="input" />
            <p className="help">Your tickets will be emailed here.</p>
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="tel" required value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      {/* ATTENDEES */}
      <div className="card p-6">
        <h2 className="h-display text-xl mb-2">Attendee details</h2>
        <p className="text-sm text-ink-muted mb-4">One form per ticket. Each attendee needs their own info.</p>
        {attendees.map((_, idx) => {
          const tt = items.find((i) => i.ticketType.id === attendeeTicketMap[idx])!;
          return (
            <div key={idx} className="border-t border-border pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium">Ticket #{idx + 1}</p>
                <span className="chip-muted">{tt.ticketType.name}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {event.attendeeFields.map((f) => (
                  <div key={f.id} className={f.type === "TEXTAREA" ? "md:col-span-2" : ""}>
                    <label className="label">
                      {f.label} {f.required && <span className="text-danger">*</span>}
                    </label>
                    {renderAttendeeField(idx, f)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* SUMMARY */}
      <div className="card p-6">
        <h2 className="h-display text-xl mb-3">Order summary</h2>
        {items.map((i) => (
          <div key={i.ticketType.id} className="flex justify-between text-sm mb-1.5">
            <span>{i.ticketType.name} × {i.quantity}</span>
            <span>{event.type === "FREE" ? "Free" : formatMinorAmount(i.ticketType.priceMinor * i.quantity, event.currency)}</span>
          </div>
        ))}
        <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold">
          <span>Subtotal</span>
          <span>{event.type === "FREE" ? "Free" : formatMinorAmount(subtotal, event.currency)}</span>
        </div>
        {event.type === "PAID" && (
          <p className="text-xs text-ink-muted mt-2">
            Final total includes platform & payment fees, calculated on the next step.
          </p>
        )}
      </div>

      {err && <div className="rounded-xl bg-danger/10 text-danger p-4 text-sm">{err}</div>}

      <button type="submit" disabled={busy} className="btn-primary w-full justify-center text-base py-4">
        {busy ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </span>
        ) : event.type === "FREE" ? "Reserve my seat" : "Pay now with Paystack"}
      </button>
      <p className="text-xs text-ink-muted text-center">
        By continuing, you agree to EventHene's Terms and Privacy.
      </p>
    </form>
  );
}

function mapFieldKey(k: string): string {
  switch (k) {
    case "FULL_NAME": return "fullName";
    case "PHONE": return "phone";
    case "EMAIL": return "email";
    case "GENDER": return "gender";
    case "CITY": return "city";
    case "ADDRESS": return "address";
    case "ORGANIZATION": return "organization";
    case "AGE_RANGE": return "ageRange";
    case "EMERGENCY_CONTACT": return "emergencyContact";
    default: return "custom";
  }
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { formatMinorAmount } from "@/lib/utils";
import { openPaystackPopup } from "@/lib/paystack-popup";

interface Field {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
}

interface Event {
  id: string;
  slug: string;
  title: string;
  currency: string;
  type: "PAID" | "FREE";
  collectBuyerInfo?: boolean;
  attendeeFields: Field[];
}

interface Item {
  ticketType: { id: string; name: string; priceMinor: number };
  quantity: number;
}

const MAX_GUESTS = 10;

/**
 * mode "ticket":       the original checkout (ticket types chosen on the previous page).
 * mode "registration": free events. No tickets, just the form (one person, or add more).
 */
export function CheckoutForm({
  event,
  items,
  mode = "ticket",
}: {
  event: Event;
  items: Item[];
  mode?: "ticket" | "registration";
}) {
  const router = useRouter();
  const registration = mode === "registration";
  const collectBuyer = event.collectBuyerInfo !== false;

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Buyer info (only when the organizer asks for it)
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  const totalAttendees = items.reduce((s, i) => s + i.quantity, 0);
  const [attendees, setAttendees] = useState<Record<string, any>[]>(
    Array.from({ length: Math.max(1, totalAttendees) }, () => ({}))
  );

  // Attendee index -> ticket type id
  const attendeeTicketMap: string[] = registration
    ? attendees.map(() => items[0].ticketType.id)
    : items.flatMap((item) => Array.from({ length: item.quantity }, () => item.ticketType.id));

  // When the contact step is off, make sure phone and email inputs always exist.
  const fields: Field[] = (() => {
    if (collectBuyer) return event.attendeeFields;
    const out = [...event.attendeeFields];
    if (!out.some((f) => f.key === "PHONE")) out.splice(1, 0, { id: "v-phone", key: "PHONE", label: "Phone number", type: "PHONE", required: false, options: [] });
    if (!out.some((f) => f.key === "EMAIL")) out.splice(2, 0, { id: "v-email", key: "EMAIL", label: "Email", type: "EMAIL", required: false, options: [] });
    if (!out.some((f) => f.key === "FULL_NAME")) out.unshift({ id: "v-name", key: "FULL_NAME", label: "Full name", type: "TEXT", required: true, options: [] });
    return out;
  })();

  function setAttendeeField(idx: number, key: string, value: any) {
    setAttendees((prev) => prev.map((a, i) => (i === idx ? { ...a, [key]: value } : a)));
  }
  // Custom fields are stored by label inside customAnswers, which is what the server saves.
  function setFieldValue(idx: number, f: Field, value: any) {
    if (f.key === "CUSTOM") {
      setAttendees((prev) =>
        prev.map((a, i) => (i === idx ? { ...a, customAnswers: { ...(a.customAnswers ?? {}), [f.label]: value } } : a))
      );
    } else {
      setAttendeeField(idx, mapFieldKey(f.key), value);
    }
  }
  function getFieldValue(idx: number, f: Field): any {
    if (f.key === "CUSTOM") return attendees[idx]?.customAnswers?.[f.label] ?? "";
    return attendees[idx]?.[mapFieldKey(f.key)] ?? "";
  }

  function addPerson() {
    setAttendees((prev) => (prev.length >= MAX_GUESTS ? prev : [...prev, {}]));
  }
  function removePerson(idx: number) {
    setAttendees((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!collectBuyer) {
      for (let i = 0; i < attendees.length; i++) {
        const a = attendees[i];
        const who = attendees.length > 1 ? `guest ${i + 1}` : "you";
        if (!a.fullName?.trim()) return setErr(`Please enter the name for ${who}.`);
        if (!a.phone?.trim() && !a.email?.trim()) {
          return setErr(`Please add a phone number or an email for ${who}. A phone number is best, it is how the ${registration ? "confirmation" : "ticket"} reaches you.`);
        }
      }
    }

    setBusy(true);
    try {
      const itemsPayload = registration
        ? [
            {
              ticketTypeId: items[0].ticketType.id,
              quantity: attendees.length,
              attendees: attendees.map(toAttendeePayload),
            },
          ]
        : items.map((item) => ({
            ticketTypeId: item.ticketType.id,
            quantity: item.quantity,
            attendees: attendees
              .map((a, i) => ({ a, i }))
              .filter((x) => attendeeTicketMap[x.i] === item.ticketType.id)
              .map((x) => toAttendeePayload(x.a)),
          }));

      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          buyerName: collectBuyer ? buyerName : "",
          buyerEmail: collectBuyer ? buyerEmail : "",
          buyerPhone: collectBuyer ? buyerPhone : "",
          items: itemsPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");

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
      setErr(friendlyError(e.message, registration));
      setBusy(false);
    }
  }

  function toAttendeePayload(a: Record<string, any>) {
    return {
      // With the contact step on, an empty guest field falls back to the buyer's details (as before).
      fullName: a.fullName ?? (collectBuyer ? buyerName : ""),
      email: a.email || (collectBuyer ? buyerEmail : "") || undefined,
      phone: a.phone || (collectBuyer ? buyerPhone : "") || undefined,
      gender: a.gender,
      city: a.city,
      address: a.address,
      organization: a.organization,
      ageRange: a.ageRange,
      emergencyContact: a.emergencyContact,
      customAnswers: a.customAnswers ?? {},
    };
  }

  const subtotal = items.reduce((s, i) => s + i.ticketType.priceMinor * i.quantity, 0);
  const isContactKey = (k: string) => k === "PHONE" || k === "EMAIL";

  function renderAttendeeField(idx: number, f: Field) {
    const val = getFieldValue(idx, f);
    // With the contact step off, phone/email are "one of the two" and checked on submit.
    const required = f.required && !(!collectBuyer && isContactKey(f.key));

    if (f.type === "TEXTAREA") {
      return (
        <textarea required={required} value={val} onChange={(e) => setFieldValue(idx, f, e.target.value)} className="input" rows={3} />
      );
    }
    if (f.type === "SELECT") {
      return (
        <select required={required} value={val} onChange={(e) => setFieldValue(idx, f, e.target.value)} className="input">
          <option value="">Choose...</option>
          {f.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        type={f.type === "EMAIL" ? "email" : f.type === "PHONE" ? "tel" : f.type === "NUMBER" ? "number" : "text"}
        required={required}
        value={val}
        onChange={(e) => setFieldValue(idx, f, e.target.value)}
        className="input"
        placeholder={f.key === "PHONE" ? "0241234567" : undefined}
      />
    );
  }

  const shell = registration ? "" : "card p-6";

  return (
    <form onSubmit={onSubmit} className={registration ? "space-y-6" : "space-y-8"}>
      {/* BUYER (optional) */}
      {collectBuyer && (
        <div className={shell}>
          <h2 className="h-display text-xl mb-4">{registration ? "Your details" : "Your details"}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" required value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} className="input" />
              <p className="help">{registration ? "Your confirmation will be emailed here." : "Your tickets will be emailed here."}</p>
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" required value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="input" />
            </div>
          </div>
        </div>
      )}

      {/* GUESTS */}
      <div className={shell}>
        {!registration && (
          <>
            <h2 className="h-display text-xl mb-2">Attendee details</h2>
            <p className="text-sm text-ink-muted mb-4">
              One form per ticket. Each ticket goes to its holder's email if they add one, otherwise to yours.
            </p>
          </>
        )}
        {registration && !collectBuyer && (
          <p className="text-sm text-ink-muted mb-4">
            Add a phone number or an email so we can send your confirmation. A phone number is best.
          </p>
        )}
        {attendees.map((_, idx) => {
          const tt = items.find((i) => i.ticketType.id === attendeeTicketMap[idx]);
          return (
            <div key={idx} className="border-t border-border pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
              {(!registration || attendees.length > 1) && (
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium">{registration ? `Guest ${idx + 1}` : `Ticket #${idx + 1}`}</p>
                  {registration ? (
                    <button type="button" onClick={() => removePerson(idx)} className="text-ink-muted hover:text-danger" aria-label="Remove this guest">
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    tt && <span className="chip-muted">{tt.ticketType.name}</span>
                  )}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                {fields.map((f) => (
                  <div key={f.id} className={f.type === "TEXTAREA" ? "md:col-span-2" : ""}>
                    <label className="label">
                      {f.label}
                      {f.required && !(!collectBuyer && isContactKey(f.key)) && <span className="text-danger"> *</span>}
                      {!collectBuyer && f.key === "PHONE" && <span className="text-ink-muted font-normal"> (best)</span>}
                    </label>
                    {renderAttendeeField(idx, f)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {registration && attendees.length < MAX_GUESTS && (
          <button type="button" onClick={addPerson} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            <Plus className="w-4 h-4" />
            Register another person
          </button>
        )}
      </div>

      {/* SUMMARY (tickets only) */}
      {!registration && (
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
            <p className="text-xs text-ink-muted mt-2">Final total includes platform & payment fees, calculated on the next step.</p>
          )}
        </div>
      )}

      {err && <div className="rounded-xl bg-danger/10 text-danger p-4 text-sm">{err}</div>}

      <button type="submit" disabled={busy} className="btn-primary w-full justify-center text-base py-4">
        {busy ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {registration ? "Registering..." : "Processing..."}
          </span>
        ) : registration ? (
          attendees.length > 1 ? `Register ${attendees.length} people` : "Register"
        ) : event.type === "FREE" ? (
          "Reserve my seat"
        ) : (
          "Pay now with Paystack"
        )}
      </button>
      <p className="text-xs text-ink-muted text-center">By continuing, you agree to EventHene's Terms and Privacy.</p>
    </form>
  );
}

function friendlyError(code: string, registration: boolean): string {
  const word = registration ? "Registration" : "Ticket sales";
  switch (code) {
    case "sold_out": return registration ? "Sorry, registration is full." : "Sorry, that ticket just sold out.";
    case "booking_closed": return `${word} has closed.`;
    case "booking_not_open_yet": return `${word} has not opened yet.`;
    case "event_not_open": return "This event is not open for registration.";
    case "ticket_type_invalid": return "That option is no longer available. Please refresh the page.";
    case "attendee_count_mismatch": return "Please check the details and try again.";
    case "rate_limited": return "Too many attempts. Please wait a minute and try again.";
    default: return code;
  }
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

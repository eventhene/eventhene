"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Music", "Faith", "Conference", "Sports", "Comedy", "Wedding", "Party", "Other"];
const COUNTRIES = [
  { code: "GH", name: "Ghana", currency: "GHS", tz: "Africa/Accra" },
  { code: "NG", name: "Nigeria", currency: "NGN", tz: "Africa/Lagos" },
  { code: "KE", name: "Kenya", currency: "KES", tz: "Africa/Nairobi" },
  { code: "ZA", name: "South Africa", currency: "ZAR", tz: "Africa/Johannesburg" },
  { code: "US", name: "United States", currency: "USD", tz: "America/New_York" },
  { code: "GB", name: "United Kingdom", currency: "GBP", tz: "Europe/London" }
];

const FIELD_OPTIONS = [
  { key: "FULL_NAME", label: "Full name", type: "TEXT" },
  { key: "PHONE", label: "Phone number", type: "PHONE" },
  { key: "EMAIL", label: "Email", type: "EMAIL" },
  { key: "GENDER", label: "Gender", type: "SELECT", options: ["Male", "Female", "Prefer not to say"] },
  { key: "CITY", label: "City / town", type: "TEXT" },
  { key: "ADDRESS", label: "Address", type: "TEXT" },
  { key: "ORGANIZATION", label: "Organization / Church / School", type: "TEXT" },
  { key: "AGE_RANGE", label: "Age range", type: "SELECT", options: ["Under 18", "18-25", "26-35", "36-45", "46-60", "60+"] },
  { key: "EMERGENCY_CONTACT", label: "Emergency contact", type: "TEXT" }
];

interface TicketRow {
  name: string;
  priceMajor: string;
  quantity: string;
  notes: string;
}

interface FieldRow {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
}

export function CreateEventForm({
  defaultCountry,
  defaultCurrency,
  defaultTimezone
}: {
  defaultCountry: string;
  defaultCurrency: string;
  defaultTimezone: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Music");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState(defaultCountry);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [bookingClosesAt, setBookingClosesAt] = useState("");
  const [flyerUrl, setFlyerUrl] = useState("");
  const [type, setType] = useState<"PAID" | "FREE">("PAID");
  const [buyerPaysFee, setBuyerPaysFee] = useState(true);
  const [tickets, setTickets] = useState<TicketRow[]>([
    { name: "Regular", priceMajor: "0", quantity: "100", notes: "" }
  ]);
  const [fields, setFields] = useState<FieldRow[]>([
    { key: "FULL_NAME", label: "Full name", type: "TEXT", required: true, options: [] },
    { key: "PHONE", label: "Phone number", type: "PHONE", required: true, options: [] },
    { key: "EMAIL", label: "Email", type: "EMAIL", required: true, options: [] }
  ]);

  function handleCountry(code: string) {
    const c = COUNTRIES.find((x) => x.code === code);
    if (!c) return;
    setCountry(code);
    setCurrency(c.currency);
    setTimezone(c.tz);
  }

  function addTicket() {
    setTickets([...tickets, { name: "", priceMajor: "0", quantity: "50", notes: "" }]);
  }
  function removeTicket(i: number) {
    setTickets(tickets.filter((_, idx) => idx !== i));
  }
  function updateTicket(i: number, key: keyof TicketRow, val: string) {
    setTickets(tickets.map((t, idx) => (idx === i ? { ...t, [key]: val } : t)));
  }

  function toggleField(opt: typeof FIELD_OPTIONS[number]) {
    const exists = fields.find((f) => f.key === opt.key);
    if (exists) {
      setFields(fields.filter((f) => f.key !== opt.key));
    } else {
      setFields([...fields, { key: opt.key, label: opt.label, type: opt.type, required: false, options: opt.options ?? [] }]);
    }
  }
  function toggleRequired(i: number) {
    setFields(fields.map((f, idx) => (idx === i ? { ...f, required: !f.required } : f)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      // Compose booking window: opens immediately, closes at bookingClosesAt or event start
      const bookingOpensAt = new Date().toISOString();
      const closes = bookingClosesAt || startsAt;

      const payload = {
        title,
        description,
        category,
        venue,
        city: city || undefined,
        country,
        currency,
        timezone,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        bookingOpensAt,
        bookingClosesAt: new Date(closes).toISOString(),
        flyerUrl: flyerUrl || undefined,
        type,
        buyerPaysFee,
        ticketTypes: tickets.map((t, idx) => ({
          name: t.name.trim(),
          priceMinor: type === "FREE" ? 0 : Math.round(parseFloat(t.priceMajor || "0") * 100),
          quantity: parseInt(t.quantity || "0", 10),
          notes: t.notes || undefined,
          isActive: true,
          sortOrder: idx
        })),
        attendeeFields: fields.map((f, idx) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          required: f.required,
          options: f.options,
          sortOrder: idx
        }))
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event");

      // Auto-publish
      await fetch(`/api/events/${data.id}/publish`, { method: "POST" });

      router.push(`/dashboard/events/${data.id}`);
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* SECTION: Basics */}
      <section className="card p-6 space-y-4">
        <h2 className="h-display text-xl">Basics</h2>
        <div>
          <label className="label">Event title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="DJ Kay Birthday Bash" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Event type</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setType("PAID")} className={type === "PAID" ? "btn-primary flex-1" : "btn-secondary flex-1"}>Paid</button>
              <button type="button" onClick={() => setType("FREE")} className={type === "FREE" ? "btn-primary flex-1" : "btn-secondary flex-1"}>Free</button>
            </div>
            {type === "FREE" && <p className="help text-warning">Free events are reviewed by EventHene before going live.</p>}
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="input" rows={5} placeholder="What's the event about? Lineup, what to expect, dress code, anything special." />
        </div>
        <div>
          <label className="label">Flyer image URL (optional for now)</label>
          <input value={flyerUrl} onChange={(e) => setFlyerUrl(e.target.value)} className="input" placeholder="https://..." />
          <p className="help">Paste a link to your flyer (we'll add direct upload in a moment).</p>
        </div>
      </section>

      {/* SECTION: When & Where */}
      <section className="card p-6 space-y-4">
        <h2 className="h-display text-xl">When & where</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Venue</label>
            <input required value={venue} onChange={(e) => setVenue(e.target.value)} className="input" placeholder="Front Back, East Legon" />
          </div>
          <div>
            <label className="label">City (optional)</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="input" placeholder="Accra" />
          </div>
          <div>
            <label className="label">Country</label>
            <select value={country} onChange={(e) => handleCountry(e.target.value)} className="input">
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Currency</label>
            <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className="input" />
          </div>
          <div>
            <label className="label">Starts at</label>
            <input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Ends at</label>
            <input type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Sales close at (optional)</label>
            <input type="datetime-local" value={bookingClosesAt} onChange={(e) => setBookingClosesAt(e.target.value)} className="input" />
            <p className="help">Default: same as event start.</p>
          </div>
        </div>
      </section>

      {/* SECTION: Tickets */}
      <section className="card p-6 space-y-4">
        <h2 className="h-display text-xl">Tickets</h2>
        {tickets.map((t, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4">
              <label className="label">Name</label>
              <input required value={t.name} onChange={(e) => updateTicket(i, "name", e.target.value)} className="input" placeholder="Regular / VIP / VVIP" />
            </div>
            {type === "PAID" && (
              <div className="col-span-3">
                <label className="label">Price ({currency})</label>
                <input type="number" min="0" step="0.01" required value={t.priceMajor} onChange={(e) => updateTicket(i, "priceMajor", e.target.value)} className="input" />
              </div>
            )}
            <div className={type === "PAID" ? "col-span-3" : "col-span-6"}>
              <label className="label">Quantity</label>
              <input type="number" min="1" required value={t.quantity} onChange={(e) => updateTicket(i, "quantity", e.target.value)} className="input" />
            </div>
            <div className="col-span-2 flex">
              {tickets.length > 1 && (
                <button type="button" onClick={() => removeTicket(i)} className="btn-danger text-sm w-full">Remove</button>
              )}
            </div>
            <div className="col-span-12">
              <label className="label">Notes (optional)</label>
              <input value={t.notes} onChange={(e) => updateTicket(i, "notes", e.target.value)} className="input" placeholder="Includes welcome drink, table for 4, etc." />
            </div>
          </div>
        ))}
        <button type="button" onClick={addTicket} className="btn-secondary">+ Add ticket type</button>
        {type === "PAID" && (
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <input id="bpf" type="checkbox" checked={buyerPaysFee} onChange={(e) => setBuyerPaysFee(e.target.checked)} />
            <label htmlFor="bpf" className="text-sm">Buyer pays the platform fee (recommended — you receive the full ticket price)</label>
          </div>
        )}
      </section>

      {/* SECTION: Attendee fields */}
      <section className="card p-6 space-y-4">
        <h2 className="h-display text-xl">Attendee details to collect</h2>
        <p className="text-sm text-ink-muted">Choose what info you want from each ticket holder.</p>
        <div className="flex flex-wrap gap-2">
          {FIELD_OPTIONS.map((opt) => {
            const active = fields.some((f) => f.key === opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleField(opt)}
                className={`chip ${active ? "bg-primary text-white" : "bg-surface-2 text-ink"} cursor-pointer`}
              >
                {active ? "✓" : "+"} {opt.label}
              </button>
            );
          })}
        </div>
        {fields.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-border">
            {fields.map((f, i) => (
              <div key={f.key} className="flex items-center justify-between text-sm">
                <span>{f.label} <span className="text-ink-muted text-xs">({f.type.toLowerCase()})</span></span>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={f.required} onChange={() => toggleRequired(i)} />
                  Required
                </label>
              </div>
            ))}
          </div>
        )}
      </section>

      {err && <div className="rounded-xl bg-danger/10 text-danger p-4 text-sm">{err}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="btn-primary flex-1 justify-center text-base py-4">
          {busy ? "Publishing…" : type === "FREE" ? "Submit for review" : "Publish event"}
        </button>
      </div>
      <p className="text-xs text-ink-muted text-center">
        {type === "FREE" ? "Free events go live after a quick review (usually under 24 hours)." : "Paid events publish instantly."}
      </p>
    </form>
  );
}

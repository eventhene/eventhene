"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

const CATEGORIES = ["Music", "Faith", "Conference", "Sports", "Comedy", "Wedding", "Party", "Other"];
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
  id?: string;
  sold?: number;
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

export interface InitialEvent {
  title: string;
  description: string;
  category: string;
  venue: string;
  city: string | null;
  startsAt: string;
  endsAt: string;
  bookingOpensAt: string;
  bookingClosesAt: string;
  flyerUrl: string | null;
  type: "PAID" | "FREE";
  buyerPaysFee: boolean;
  ticketTypes: { id: string; name: string; priceMinor: number; quantity: number; notes: string | null; sold: number }[];
  attendeeFields: { key: string; label: string; type: string; required: boolean; options: string[] }[];
}

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateEventForm({
  mode = "create",
  eventId,
  initial,
  hasOrders = false,
}: {
  mode?: "create" | "edit";
  eventId?: string;
  initial?: InitialEvent;
  hasOrders?: boolean;
}) {
  const isEdit = mode === "edit" && !!eventId && !!initial;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Music");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.endsAt));
  const [bookingClosesAt, setBookingClosesAt] = useState(toLocalInput(initial?.bookingClosesAt));
  const [flyerUrl, setFlyerUrl] = useState(initial?.flyerUrl ?? "");
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<"PAID" | "FREE">(initial?.type ?? "PAID");
  const [buyerPaysFee, setBuyerPaysFee] = useState(initial?.buyerPaysFee ?? true);
  const [couponCode, setCouponCode] = useState("");
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [tickets, setTickets] = useState<TicketRow[]>(
    initial
      ? initial.ticketTypes.map((t) => ({
          id: t.id,
          sold: t.sold,
          name: t.name,
          priceMajor: String(t.priceMinor / 100),
          quantity: String(t.quantity),
          notes: t.notes ?? "",
        }))
      : [{ name: "Regular", priceMajor: "0", quantity: "100", notes: "" }]
  );
  const [fields, setFields] = useState<FieldRow[]>(
    initial
      ? initial.attendeeFields.map((f) => ({ key: f.key, label: f.label, type: f.type, required: f.required, options: f.options ?? [] }))
      : [
          { key: "FULL_NAME", label: "Full name", type: "TEXT", required: true, options: [] },
          { key: "PHONE", label: "Phone number", type: "PHONE", required: true, options: [] },
          { key: "EMAIL", label: "Email", type: "EMAIL", required: true, options: [] }
        ]
  );

  async function validateCoupon() {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponCode.trim())}`, { credentials: "include" });
      const data = await res.json();
      setCouponValid(data.valid);
      setCouponMsg(data.valid ? "Coupon accepted - your event will publish instantly" : data.reason || "Invalid code");
    } catch {
      setCouponValid(false);
      setCouponMsg("Could not verify coupon");
    }
  }

  async function handleFlyerUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setErr("Flyer must be under 5 MB");
      return;
    }
    setUploading(true);
    setErr(null);
    const preview = URL.createObjectURL(file);
    setFlyerPreview(preview);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/flyer", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFlyerUrl(data.url);
    } catch (e: any) {
      setErr(e.message);
      setFlyerPreview(null);
      setFlyerUrl("");
    } finally {
      setUploading(false);
    }
  }

  function removeFlyerUpload() {
    setFlyerUrl("");
    setFlyerPreview(null);
    if (fileRef.current) fileRef.current.value = "";
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
      const bookingOpensAt = isEdit ? initial!.bookingOpensAt : new Date().toISOString();
      const closes = bookingClosesAt || startsAt;

      if (isEdit) {
        const res = await fetch(`/api/events/${eventId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            category,
            venue,
            city: city || null,
            startsAt: new Date(startsAt).toISOString(),
            endsAt: new Date(endsAt).toISOString(),
            bookingOpensAt,
            bookingClosesAt: new Date(closes).toISOString(),
            flyerUrl: flyerUrl || null,
            type,
            buyerPaysFee,
            ticketTypes: tickets.map((t, idx) => ({
              id: t.id,
              name: t.name.trim(),
              priceMinor: type === "FREE" ? 0 : Math.round(parseFloat(t.priceMajor || "0") * 100),
              quantity: parseInt(t.quantity || "0", 10),
              notes: t.notes || null,
              isActive: true,
              sortOrder: idx,
            })),
            attendeeFields: fields.map((f, idx) => ({
              key: f.key,
              label: f.label,
              type: f.type,
              required: f.required,
              options: f.options,
              sortOrder: idx,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not save your changes.");
        router.push(`/dashboard/events/${eventId}`);
        router.refresh();
        return;
      }

      const payload = {
        title,
        description,
        category,
        venue,
        city: city || undefined,
        country: "GH",
        currency: "GHS",
        timezone: "Africa/Accra",
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        bookingOpensAt,
        bookingClosesAt: new Date(closes).toISOString(),
        flyerUrl: flyerUrl || undefined,
        type,
        buyerPaysFee,
        couponCode: couponCode.trim() || undefined,
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
        credentials: "include",
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
      <section className="card p-7 space-y-5">
        <h2 className="font-display text-2xl">Basics</h2>
        <div>
          <label className="label">Event title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Fire Conference 2026" />
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
              <button type="button" disabled={isEdit && hasOrders} onClick={() => setType("PAID")} className={`btn-md flex-1 ${type === "PAID" ? "btn-primary" : "btn-ghost"}`}>Paid</button>
              <button type="button" disabled={isEdit && hasOrders} onClick={() => setType("FREE")} className={`btn-md flex-1 ${type === "FREE" ? "btn-primary" : "btn-ghost"}`}>Free</button>
            </div>
            {isEdit && hasOrders && <p className="help">Locked because tickets have already been ordered.</p>}
            {!isEdit && type === "FREE" && <p className="help text-sky">Free events are reviewed by EventHene before going live.</p>}
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="input" rows={5} placeholder="What's the event about? Lineup, what to expect, dress code, anything special." />
        </div>
        <div>
          <label className="label">Event flyer (optional)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFlyerUpload(f);
            }}
          />
          {flyerPreview || flyerUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-border group">
              <img
                src={flyerPreview || flyerUrl}
                alt="Flyer preview"
                className="w-full max-h-64 object-contain bg-black/5"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <span className="ml-2 text-white text-sm font-semibold">Uploading...</span>
                </div>
              )}
              {!uploading && (
                <button
                  type="button"
                  onClick={removeFlyerUpload}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-ink/30 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-ink/5 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-ink-muted" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-ink">Click to upload your flyer</p>
                <p className="text-xs text-ink-muted mt-1">JPG, PNG, or WebP - max 5 MB</p>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* SECTION: When & Where */}
      <section className="card p-7 space-y-5">
        <h2 className="font-display text-2xl">When and where</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Venue</label>
            <input required value={venue} onChange={(e) => setVenue(e.target.value)} className="input" placeholder="Christ Temple, East Legon" />
          </div>
          <div>
            <label className="label">City (optional)</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="input" placeholder="Accra" />
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
      <section className="card p-7 space-y-5">
        <h2 className="font-display text-2xl">Tickets</h2>
        {tickets.map((t, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4">
              <label className="label">Name</label>
              <input required value={t.name} onChange={(e) => updateTicket(i, "name", e.target.value)} className="input" placeholder="Regular / VIP / VVIP" />
            </div>
            {type === "PAID" && (
              <div className="col-span-3">
                <label className="label">Price (GHS)</label>
                <input type="number" min="0" step="0.01" required value={t.priceMajor} onChange={(e) => updateTicket(i, "priceMajor", e.target.value)} className="input" />
              </div>
            )}
            <div className={type === "PAID" ? "col-span-3" : "col-span-6"}>
              <label className="label">Quantity</label>
              <input type="number" min={Math.max(1, t.sold ?? 0)} required value={t.quantity} onChange={(e) => updateTicket(i, "quantity", e.target.value)} className="input" />
            </div>
            <div className="col-span-2 flex">
              {tickets.length > 1 && (t.sold ?? 0) === 0 && (
                <button type="button" onClick={() => removeTicket(i)} className="btn-danger btn-sm w-full">Remove</button>
              )}
              {(t.sold ?? 0) > 0 && (
                <p className="text-[11px] text-ink-muted self-end pb-3">{t.sold} sold</p>
              )}
            </div>
            <div className="col-span-12">
              <label className="label">Notes (optional)</label>
              <input value={t.notes} onChange={(e) => updateTicket(i, "notes", e.target.value)} className="input" placeholder="Includes welcome drink, table for 4, etc." />
            </div>
          </div>
        ))}
        <button type="button" onClick={addTicket} className="btn-ghost btn-md">+ Add ticket type</button>
        {type === "PAID" && (
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <input id="bpf" type="checkbox" checked={buyerPaysFee} onChange={(e) => setBuyerPaysFee(e.target.checked)} />
            <label htmlFor="bpf" className="text-sm">Buyer pays the platform fee (recommended, you receive the full ticket price)</label>
          </div>
        )}
      </section>

      {/* SECTION: Attendee fields */}
      <section className="card p-7 space-y-5">
        <h2 className="font-display text-2xl">Attendee details to collect</h2>
        <p className="text-sm text-ink-muted">Choose what info you want from each ticket holder.</p>
        <div className="flex flex-wrap gap-2">
          {FIELD_OPTIONS.map((opt) => {
            const active = fields.some((f) => f.key === opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleField(opt)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${active ? "bg-ink text-white border-ink" : "bg-white text-ink-muted border-border hover:border-ink/30"}`}
              >
                {active ? "✓" : "+"} {opt.label}
              </button>
            );
          })}
        </div>
        {fields.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-border">
            {fields.map((f, i) => (
              <div key={`${f.key}-${i}`} className="flex items-center justify-between text-sm gap-2">
                <span className="truncate">{f.label} <span className="text-ink-muted text-xs">({f.type.toLowerCase()})</span></span>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={f.required} onChange={() => toggleRequired(i)} />
                    Required
                  </label>
                  {f.key === "CUSTOM" && (
                    <button type="button" onClick={() => setFields(fields.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:text-red-400">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="pt-3">
          <p className="text-xs text-ink-muted mb-2">Need a custom field? Add your own below.</p>
          <CustomFieldAdder onAdd={(f) => setFields([...fields, f])} />
        </div>
      </section>

      {/* SECTION: Coupon code */}
      {!isEdit && type === "FREE" && (
        <section className="card p-7 space-y-4">
          <h2 className="font-extrabold text-xl tracking-tight">Have a coupon code?</h2>
          <p className="text-sm text-ink-muted">Enter a coupon code to publish your event instantly without waiting for review.</p>
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponValid(null); setCouponMsg(""); }}
              className="input flex-1"
              placeholder="EH-XXXXXXXX"
            />
            <button type="button" onClick={validateCoupon} className="btn-ghost btn-md" disabled={!couponCode.trim()}>
              Verify
            </button>
          </div>
          {couponMsg && (
            <p className={`text-sm font-semibold ${couponValid ? "text-emerald" : "text-crimson"}`}>{couponMsg}</p>
          )}
        </section>
      )}

      {err && <div className="rounded-xl bg-crimson/5 border border-crimson/20 text-crimson text-sm px-4 py-3 font-semibold">{err}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={busy || uploading} className="btn-primary btn-xl flex-1 flex items-center justify-center gap-2">
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isEdit ? "Saving changes..." : "Publishing..."}
            </>
          ) : isEdit ? "Save changes" : (type === "FREE" && !couponValid) ? "Submit for review" : "Publish event"}
        </button>
      </div>
      <p className="text-xs text-ink-muted text-center font-medium">
        {isEdit
          ? "Changes go live on your event page as soon as you save."
          : type === "FREE" && !couponValid ? "Free events go live after a quick review (usually under 24 hours)." : "Your event will publish instantly."}
      </p>
    </form>
  );
}

const CUSTOM_TYPES = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "SELECT", label: "Dropdown" },
  { value: "TEXTAREA", label: "Long text" },
  { value: "DATE", label: "Date" },
];

function CustomFieldAdder({ onAdd }: { onAdd: (f: FieldRow) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState("TEXT");
  const [required, setRequired] = useState(false);
  const [optionsText, setOptionsText] = useState("");

  function add() {
    if (!label.trim()) return;
    const options = type === "SELECT" ? optionsText.split(",").map((o) => o.trim()).filter(Boolean) : [];
    onAdd({ key: "CUSTOM", label: label.trim(), type, required, options });
    setLabel("");
    setType("TEXT");
    setRequired(false);
    setOptionsText("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost btn-sm text-xs">
        + Add custom field
      </button>
    );
  }

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-white/50">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Field label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="input text-sm" placeholder="e.g. T-shirt size" />
        </div>
        <div>
          <label className="label text-xs">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input text-sm">
            {CUSTOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      {type === "SELECT" && (
        <div>
          <label className="label text-xs">Options (comma-separated)</label>
          <input value={optionsText} onChange={(e) => setOptionsText(e.target.value)} className="input text-sm" placeholder="Small, Medium, Large, XL" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
          Required
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm text-xs">Cancel</button>
          <button type="button" onClick={add} disabled={!label.trim()} className="btn-primary btn-sm text-xs">Add field</button>
        </div>
      </div>
    </div>
  );
}

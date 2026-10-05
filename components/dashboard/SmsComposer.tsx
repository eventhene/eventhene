"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  eventId: string;
  eventTitle: string;
  ticketTypes: { id: string; name: string }[];
  totals: { all: number; attended: number };
}

const TEMPLATES = [
  {
    name: "Registration confirmation",
    text: "Hi {name}, you're confirmed for {event} on {date} at {venue}. Ref: {ref}. See you there. - EventHene",
  },
  {
    name: "Day-before reminder",
    text: "Hi {name}, reminder: {event} is tomorrow at {venue}. Show your QR at the gate. Ref: {ref}.",
  },
  {
    name: "Thank-you after event",
    text: "Thanks for coming to {event}, {name}. We hope you had a great time. Stay tuned for the next one.",
  },
];

export function SmsComposer({ eventId, eventTitle, ticketTypes, totals }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [singlePhone, setSinglePhone] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const effectiveAudience = useMemo(() => {
    if (audience === "PHONE") return singlePhone ? `PHONE:${singlePhone.trim()}` : "PHONE:";
    return audience;
  }, [audience, singlePhone]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setPreviewing(true);
      try {
        const url = `/api/events/${eventId}/sms?audience=${encodeURIComponent(effectiveAudience)}&message=${encodeURIComponent(message)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!cancelled) setPreview(data);
      } finally {
        if (!cancelled) setPreviewing(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [eventId, effectiveAudience, message]);

  const seg = preview?.segments;
  const estCredits = preview?.estimatedCredits ?? 0;
  const balance = preview?.balance ?? 0;
  const senderIdUsed = preview?.senderId ?? "EventHene";
  const notEnough = estCredits > balance;

  async function send() {
    if (!message || !name) return;
    if (notEnough) {
      setErr(`Not enough credits. You need ${estCredits}, have ${balance}. Ask an admin to grant more.`);
      return;
    }
    setErr(null);
    setSuccess(null);
    setSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/sms`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, message, audience: effectiveAudience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSuccess(`Sent to ${data.totalSent} recipient${data.totalSent === 1 ? "" : "s"}. ${data.totalFailed} failed.`);
      setMessage("");
      setName("");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1.3fr,1fr] gap-6">
      {/* ---------- composer ---------- */}
      <div className="card p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Campaign name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g. Day-before reminder"
            />
          </div>
          <div>
            <label className="label">Sending as</label>
            <div className="input flex items-center justify-between font-mono text-sm">
              <span>{senderIdUsed}</span>
              <Link href="/dashboard/sms" className="text-xs text-royal-2 hover:underline">
                Change
              </Link>
            </div>
            <p className="help">Request a custom Sender ID on your SMS page.</p>
          </div>
        </div>

        <div>
          <label className="label">Audience</label>
          <select value={audience} onChange={(e) => setAudience(e.target.value)} className="input">
            <option value="ALL">All attendees ({totals.all})</option>
            <option value="ATTENDED">Attended only ({totals.attended})</option>
            <option value="NOT_ATTENDED">Not attended yet</option>
            <option value="GENDER:Male">Attendees - Male</option>
            <option value="GENDER:Female">Attendees - Female</option>
            {ticketTypes.map((t) => (
              <option key={t.id} value={`TICKET_TYPE:${t.id}`}>
                Ticket type: {t.name}
              </option>
            ))}
            <option value="PHONE">A single phone number</option>
          </select>
          {audience === "PHONE" && (
            <input
              value={singlePhone}
              onChange={(e) => setSinglePhone(e.target.value)}
              placeholder="e.g. 0247123456"
              className="input mt-3"
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Message</label>
            <span className="text-[11px] text-ink-muted font-mono">
              {seg
                ? `${seg.charCount} chars - ${seg.segments} seg - ${seg.encoding}`
                : "..."}
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="input"
            placeholder="Hi {name}, your ticket for {event} is confirmed. Ref: {ref}. See you on {date}."
          />
          <p className="help">
            Use <code className="font-mono">{"{name}"}</code>, <code className="font-mono">{"{ref}"}</code>, <code className="font-mono">{"{event}"}</code>, <code className="font-mono">{"{date}"}</code>, <code className="font-mono">{"{venue}"}</code>. Emoji and non-ASCII are stripped. "https://" is removed from links.
          </p>
        </div>

        <div>
          <p className="label">Templates</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setMessage(t.text)}
                className="chip-outline hover:border-ink text-xs"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {err && <div className="rounded-xl bg-crimson/5 border border-crimson/20 text-crimson text-sm px-4 py-3">{err}</div>}
        {success && <div className="rounded-xl bg-emerald/5 border border-emerald/20 text-emerald text-sm px-4 py-3">{success}</div>}

        <button
          onClick={send}
          disabled={sending || !message || !name || !preview?.count || notEnough}
          className="btn-primary btn-lg w-full"
        >
          {sending && <span className="spinner" />}
          {sending
            ? "Sending..."
            : notEnough
              ? `Need ${estCredits - balance} more credit${estCredits - balance === 1 ? "" : "s"}`
              : `Send to ${preview?.count ?? 0} recipient${preview?.count === 1 ? "" : "s"}`}
        </button>
      </div>

      {/* ---------- preview panel ---------- */}
      <div className="space-y-6">
        <div className="card p-6">
          <p className="label">Preview</p>
          <div className="rounded-2xl bg-canvas text-white p-5">
            <div className="flex items-center justify-between text-xs text-white/50 mb-3">
              <span className="font-mono">{senderIdUsed}</span>
              <span>now</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {preview?.sanitized
                ? preview.sanitized
                    .replace(/\{name\}/gi, "Worship")
                    .replace(/\{ref\}/gi, "WOR-DJKAY-4134123")
                    .replace(/\{event\}/gi, eventTitle)
                    .replace(/\{date\}/gi, "Fri Jun 12")
                    .replace(/\{venue\}/gi, "East Legon")
                : <span className="text-white/40">Your message appears here</span>}
            </p>
          </div>
        </div>

        <div className="card p-6">
          <p className="label">Delivery</p>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Recipients" value={previewing ? "..." : (preview?.count ?? 0).toString()} />
            <Metric label="Segments/msg" value={seg?.segments?.toString() ?? "1"} />
            <Metric label="Credits needed" value={estCredits.toString()} />
            <Metric label="Your balance" value={balance.toString()} tint={notEnough ? "warn" : "ink"} />
          </div>
          {preview?.sample?.length > 0 && (
            <div className="mt-4 text-xs text-ink-muted space-y-1 font-mono">
              <p className="text-[10px] uppercase tracking-widest text-ink-faint mb-2">First few</p>
              {preview.sample.map((r: any) => (
                <div key={r.phone} className="flex justify-between gap-2">
                  <span className="truncate">{r.name ?? r.phone}</span>
                  <span>{r.phone}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tint }: { label: string; value: string; tint?: "ink" | "warn" }) {
  const cls = tint === "warn" ? "text-crimson" : "text-ink";
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <p className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</p>
      <p className={`font-display text-2xl ${cls}`}>{value}</p>
    </div>
  );
}

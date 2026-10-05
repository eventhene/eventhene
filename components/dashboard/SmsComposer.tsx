"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  eventId: string;
  eventTitle: string;
  ticketTypes: { id: string; name: string }[];
  totals: { all: number; attended: number };
}

const TEMPLATES = [
  {
    name: "Registration confirmation",
    text: "Hi {name}, you're confirmed for {event} on {date} at {venue}. Ref: {ref}. See you there! - EventHene",
  },
  {
    name: "Day-before reminder",
    text: "Hi {name}, reminder: {event} is tomorrow at {venue}. Doors open per schedule. Show your QR at the gate. Ref: {ref}.",
  },
  {
    name: "Thank-you after event",
    text: "Thanks for coming to {event}, {name}! We hope you had a great time. Stay tuned for the next one.",
  },
];

export function SmsComposer({ eventId, eventTitle, ticketTypes, totals }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [senderId, setSenderId] = useState("EVENTHENE");
  const [audience, setAudience] = useState("ALL");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ count: number; sample: any[] } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setPreviewing(true);
      try {
        const res = await fetch(`/api/events/${eventId}/sms?audience=${encodeURIComponent(audience)}`);
        const data = await res.json();
        if (!cancelled) setPreview(data);
      } finally {
        if (!cancelled) setPreviewing(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [eventId, audience]);

  const smsCount = Math.ceil(Math.max(1, message.length) / 160);
  const charsLeft = 160 * smsCount - message.length;

  async function send() {
    if (!message || !name) return;
    setErr(null);
    setSuccess(null);
    setSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/sms`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, senderId, message, audience, runNow: true }),
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
      {/* composer */}
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
            <label className="label">Sender ID</label>
            <input
              value={senderId}
              onChange={(e) => setSenderId(e.target.value.toUpperCase().slice(0, 11))}
              className="input"
              placeholder="EVENTHENE"
              maxLength={11}
            />
            <p className="help">Max 11 characters. Must be approved by Hubtel for live traffic.</p>
          </div>
        </div>

        <div>
          <label className="label">Audience</label>
          <select value={audience} onChange={(e) => setAudience(e.target.value)} className="input">
            <option value="ALL">All attendees ({totals.all})</option>
            <option value="ATTENDED">Attended only ({totals.attended})</option>
            <option value="NOT_ATTENDED">Not attended yet</option>
            {ticketTypes.map((t) => (
              <option key={t.id} value={`TICKET_TYPE:${t.id}`}>
                Ticket type: {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Message</label>
            <span className="text-[11px] text-ink-muted font-mono">
              {message.length} chars · {smsCount} SMS {charsLeft >= 0 ? `(${charsLeft} left)` : ""}
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
            Use <code className="font-mono">{"{name}"}</code>, <code className="font-mono">{"{ref}"}</code>, <code className="font-mono">{"{event}"}</code>, <code className="font-mono">{"{date}"}</code>, <code className="font-mono">{"{venue}"}</code> for personalization.
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
          disabled={sending || !message || !name || !preview?.count}
          className="btn-primary btn-lg w-full"
        >
          {sending && <span className="spinner" />}
          {sending ? "Sending..." : `Send to ${preview?.count ?? 0} recipient${preview?.count === 1 ? "" : "s"}`}
        </button>
      </div>

      {/* preview */}
      <div className="space-y-6">
        <div className="card p-6">
          <p className="label">Preview</p>
          <div className="rounded-2xl bg-canvas text-white p-5">
            <div className="flex items-center justify-between text-xs text-white/50 mb-3">
              <span className="font-mono">{senderId || "SENDER"}</span>
              <span>now</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message
                ? message
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
          <p className="label">Audience summary</p>
          {previewing ? (
            <p className="text-ink-muted text-sm">Loading...</p>
          ) : preview ? (
            <>
              <p className="font-display text-4xl">{preview.count}</p>
              <p className="text-sm text-ink-muted mb-4">
                recipients with valid phone numbers
              </p>
              {preview.sample.length > 0 && (
                <div className="text-xs text-ink-muted space-y-1 font-mono">
                  {preview.sample.map((r) => (
                    <div key={r.phone} className="flex justify-between gap-2">
                      <span className="truncate">{r.name}</span>
                      <span>{r.phone}</span>
                    </div>
                  ))}
                  {preview.count > preview.sample.length && (
                    <p className="text-ink-faint">+ {preview.count - preview.sample.length} more</p>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

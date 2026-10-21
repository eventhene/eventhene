"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Copy, Check, Loader2, QrCode, UserPlus } from "lucide-react";
import { GateRegisterForm, type GateField, type GateTicketType } from "./GateRegisterForm";

export function GatePanel({
  eventId,
  eventTitle,
  token,
  url,
  qr,
  enabled,
  windowOpen,
  isFree,
  gateCount,
  fields,
  ticketTypes,
}: {
  eventId: string;
  eventTitle: string;
  token: string;
  url: string;
  qr: string;
  enabled: boolean;
  windowOpen: boolean;
  isFree: boolean;
  gateCount: number;
  fields: GateField[];
  ticketTypes: GateTicketType[];
}) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/gate`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !on }),
      });
      if (res.ok) setOn((v) => !v);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked; the link is on screen anyway */
    }
  }

  if (!isFree) {
    return (
      <div className="card-glass rounded-2xl p-7">
        <p className="text-sm font-semibold text-amber-400">
          Gate registration is only available for free events right now.
        </p>
        <p className="mt-2 text-sm text-white/45">
          Taking money at the door needs cash handling and reconciliation, which is not built yet.
          For a paid event, keep using the scanner for people who already bought.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---------- the poster ---------- */}
      <section className="card-glass rounded-2xl p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Gate poster</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40">{on ? "Open" : "Closed"}</span>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label="Gate registration open"
              onClick={toggle}
              disabled={busy}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-accent" : "bg-white/15"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[auto,1fr] md:items-center">
          <div className="mx-auto w-[220px] rounded-2xl bg-white p-4 md:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Gate registration QR code" className="block w-full" />
          </div>
          <div className="min-w-0 space-y-4">
            <p className="text-sm text-white/55">
              Print this and put it at the entrance. People scan it, fill in the same details your
              registration form asks for, and they are checked in the moment they submit. No queue
              at the scanner.
            </p>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/30">Link</p>
              <p className="mt-1 break-all font-mono text-xs text-accent">{url}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => window.print()} className="btn-ghost-dark btn-md inline-flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print poster
              </button>
              <button onClick={copy} className="btn-ghost-dark btn-md inline-flex items-center gap-2">
                {copied ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            <p className="text-xs text-white/35">
              {gateCount > 0
                ? `${gateCount} ${gateCount === 1 ? "person has" : "people have"} registered at the gate so far.`
                : "Nobody has registered at the gate yet."}
            </p>
          </div>
        </div>

        {!windowOpen && (
          <p className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-400">
            The event is not on right now, so anyone registering will be recorded but not checked in.
            Check-in switches on automatically from 12 hours before the start.
          </p>
        )}
      </section>

      {/* ---------- usher-operated form ---------- */}
      <section className="card-glass rounded-2xl p-7">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Take details yourself</h2>
        </div>
        <p className="mt-2 text-sm text-white/45">
          For anyone who cannot use a phone. Same fields, and it stays open so you can do one after
          another.
        </p>
        <div className="mt-6 max-w-lg">
          <GateRegisterForm
            token={token}
            fields={fields}
            ticketTypes={ticketTypes}
            adminMode
            onRegistered={() => router.refresh()}
          />
        </div>
      </section>

      {/* Printing gives a clean poster: just the event, the QR and what to do. */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .gate-print,
          .gate-print * {
            visibility: visible;
          }
          .gate-print {
            position: absolute;
            inset: 0;
            padding: 48px;
            background: #fff;
            color: #000;
          }
        }
        .gate-print {
          display: none;
        }
        @media print {
          .gate-print {
            display: block;
          }
        }
      `}</style>

      <div className="gate-print text-center">
        <p style={{ fontSize: 22, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 800 }}>
          Register here
        </p>
        <h1 style={{ fontSize: 44, fontWeight: 800, margin: "16px 0 8px" }}>{eventTitle}</h1>
        <p style={{ fontSize: 20, margin: "0 0 28px" }}>Scan with your phone camera to register and check in</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="" style={{ width: 380, height: 380, margin: "0 auto" }} />
        <p style={{ fontSize: 16, marginTop: 24, wordBreak: "break-all" }}>{url}</p>
        <p style={{ fontSize: 14, marginTop: 28, opacity: 0.6 }}>Powered by EventHene</p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Send, Loader2, ArrowLeft, Sparkles, Ticket, ListChecks, Keyboard, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { ContactListsPanel, type ContactListSummary } from "./ContactListsPanel";
import { parseNumbersText } from "@/lib/sms/parse-contacts";

interface EventInfo {
  id: string;
  title: string;
  ticketTypes: { id: string; name: string }[];
  attendeeCount: number;
}

const TEMPLATES = [
  { label: "Event reminder", text: "Hi {name}, reminder: {event} is on {date} at {venue}. See you there!" },
  { label: "Thank you", text: "Hi {name}, thanks for coming to {event}. We hope you had an amazing time!" },
  { label: "Announcement", text: "Hi {name}, exciting news! We have a new event coming soon. Stay tuned." },
  { label: "Promo", text: "Hi {name}, you are invited to {event} on {date}. Get your ticket now to secure your spot!" },
];

const TAG_BUTTONS = [
  { tag: "{name}", desc: "Recipient's first name" },
  { tag: "{event}", desc: "Event title" },
  { tag: "{date}", desc: "Event date" },
  { tag: "{venue}", desc: "Event venue" },
  { tag: "{ref}", desc: "Ticket reference (registered contacts)" },
  { tag: "{phone}", desc: "Recipient's phone" },
];

type Phase = "idle" | "creating" | "sending" | "done" | "paused";

export function BulkSmsComposer({ events, initialLists, initialEventId }: { events: EventInfo[]; initialLists: ContactListSummary[]; initialEventId?: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");

  // Audience sources (any combination)
  const [useRegistered, setUseRegistered] = useState(events.length > 0);
  const [regScope, setRegScope] = useState<"event" | "all">("event");
  const [regEventId, setRegEventId] = useState(initialEventId || events[0]?.id || "");
  const [regFilter, setRegFilter] = useState("ALL");
  const [lists, setLists] = useState<ContactListSummary[]>(initialLists);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const [contextEventId, setContextEventId] = useState(initialEventId || events[0]?.id || "");

  // Preview
  const [preview, setPreview] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(0);

  // Send
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ total: 0, sent: 0, failed: 0, remaining: 0 });
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  const regEvent = events.find((e) => e.id === regEventId);
  const typedNumbers = useMemo(() => parseNumbersText(typed), [typed]);

  const audience = useMemo(
    () => ({
      registered: useRegistered
        ? regScope === "all"
          ? { allEvents: true, filter: regFilter.startsWith("TICKET_TYPE:") ? "ALL" : regFilter }
          : { eventId: regEventId, filter: regFilter }
        : null,
      listIds: selectedListIds,
      phones: typedNumbers,
      contextEventId: contextEventId || null,
    }),
    [useRegistered, regScope, regEventId, regFilter, selectedListIds, typedNumbers, contextEventId]
  );

  const hasSource = (useRegistered && (regScope === "all" || !!regEventId)) || selectedListIds.length > 0 || typedNumbers.length > 0;

  const refreshLists = useCallback(async () => {
    try {
      const res = await fetch("/api/sms/contact-lists", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setLists(data.lists);
        setSelectedListIds((ids) => ids.filter((id) => data.lists.some((l: ContactListSummary) => l.id === id)));
        setPreviewVersion((v) => v + 1);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!hasSource) { setPreview(null); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setPreviewing(true);
      try {
        const res = await fetch("/api/sms/compose", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preview: true, audience, message }),
        });
        const data = await res.json();
        if (!cancelled) setPreview(res.ok ? data : null);
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setPreviewing(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [audience, message, hasSource, previewVersion]);

  function insertTag(tag: string) {
    const el = textareaRef.current;
    if (!el) { setMessage((m) => m + tag); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setMessage(message.slice(0, start) + tag + message.slice(end));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  }

  function toggleList(id: string) {
    setSelectedListIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function runLoop(campaignId: string) {
    setPhase("sending");
    setError("");
    let guard = 0;
    while (guard++ < 400) {
      let data: any;
      try {
        const res = await fetch(`/api/sms/campaigns/${campaignId}/run`, { method: "POST", credentials: "include" });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sending was interrupted.");
      } catch (e: any) {
        setError(`${e.message} Your credits are safe. Tap Resume to continue sending.`);
        setPhase("paused");
        return;
      }
      setProgress({ total: data.total, sent: data.sent, failed: data.failed, remaining: data.remaining });
      if (data.done) {
        setPhase("done");
        return;
      }
      if (data.busy) await new Promise((r) => setTimeout(r, 2500));
    }
    setPhase("paused");
  }

  async function handleSend() {
    if (!campaignName.trim() || !message.trim()) return;
    setError("");
    setPhase("creating");
    try {
      const res = await fetch("/api/sms/compose", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: campaignName.trim(), message, audience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start the campaign.");
      setActiveCampaignId(data.campaignId);
      setProgress({ total: data.total, sent: 0, failed: 0, remaining: data.total });
      await runLoop(data.campaignId);
    } catch (e: any) {
      setError(e.message);
      setPhase("idle");
    }
  }

  function resetAfterDone() {
    setPhase("idle");
    setActiveCampaignId(null);
    setCampaignName("");
    setMessage("");
    setPreviewVersion((v) => v + 1);
  }

  const seg = preview?.segments;
  const estCredits = preview?.estimatedCredits ?? 0;
  const balance = preview?.balance ?? 0;
  const notEnough = estCredits > balance;
  const busy = phase === "creating" || phase === "sending";
  const canSend = !!campaignName.trim() && !!message.trim() && (preview?.count ?? 0) > 0 && !notEnough && !busy && !preview?.frozen;
  const pct = progress.total ? Math.round(((progress.sent + progress.failed) / progress.total) * 100) : 0;
  const needsContext = (preview?.missingEventDetails ?? 0) > 0;

  // ---------- progress / result screen ----------
  if (phase !== "idle") {
    return (
      <div className="max-w-xl mx-auto card-glass rounded-2xl p-8 text-center space-y-5">
        {phase === "done" ? (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-white">Campaign finished</h2>
              <p className="text-white/50 mt-1 text-sm">
                {progress.sent} sent{progress.failed > 0 ? `, ${progress.failed} failed (credits for failed messages were refunded)` : ""}.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={resetAfterDone} className="btn-gold btn-md">Send another</button>
              <Link href="/dashboard/sms" className="btn-ghost-dark btn-md">View history</Link>
            </div>
          </>
        ) : phase === "paused" ? (
          <>
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-white">Sending paused</h2>
              <p className="text-white/50 mt-1 text-sm">
                {progress.sent} of {progress.total} sent so far. {error}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => activeCampaignId && runLoop(activeCampaignId)} className="btn-gold btn-md">Resume sending</button>
              <Link href="/dashboard/sms" className="btn-ghost-dark btn-md">Later</Link>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {phase === "creating" ? "Preparing your campaign..." : "Sending messages..."}
              </h2>
              <p className="text-white/50 mt-1 text-sm">
                {phase === "creating"
                  ? "Checking numbers and reserving credits."
                  : `${progress.sent + progress.failed} of ${progress.total} processed. Keep this page open.`}
              </p>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${phase === "creating" ? 5 : Math.max(5, pct)}%` }} />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1.25fr,1fr] gap-6 items-start">
      {/* ---------------- left: composer ---------------- */}
      <div className="space-y-5 min-w-0">
        <Link href="/dashboard/sms" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to SMS
        </Link>

        <div className="card-glass rounded-2xl p-5">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Campaign name</label>
          <input
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="input text-white"
            placeholder="e.g. October promo blast"
          />
        </div>

        {/* Audience */}
        <div className="card-glass rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">Who gets this message?</label>
            <p className="text-[11px] text-white/30 mt-1">Combine any of these. Duplicate numbers are removed automatically.</p>
          </div>

          {/* Registered */}
          <SourceBox
            icon={<Ticket className="w-4 h-4" />}
            title="Registered contacts"
            subtitle="People who bought or registered for your events"
            checked={useRegistered}
            onToggle={() => setUseRegistered((v) => !v)}
            disabled={events.length === 0}
            disabledNote="Create an event first to message its attendees."
          >
            <div className="flex gap-2">
              <ScopeButton active={regScope === "event"} onClick={() => setRegScope("event")}>One event</ScopeButton>
              <ScopeButton active={regScope === "all"} onClick={() => setRegScope("all")}>All my events</ScopeButton>
            </div>
            {regScope === "event" && (
              <select value={regEventId} onChange={(e) => { setRegEventId(e.target.value); setRegFilter("ALL"); }} className="input text-white text-sm">
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title} ({ev.attendeeCount} tickets)</option>
                ))}
              </select>
            )}
            <select value={regFilter} onChange={(e) => setRegFilter(e.target.value)} className="input text-white text-sm">
              <option value="ALL">Everyone with a valid ticket</option>
              <option value="ATTENDED">Attended only</option>
              <option value="NOT_ATTENDED">Not checked in yet</option>
              <option value="PAID">Paid tickets only</option>
              {regScope === "event" && regEvent?.ticketTypes.map((tt) => (
                <option key={tt.id} value={`TICKET_TYPE:${tt.id}`}>Ticket type: {tt.name}</option>
              ))}
            </select>
          </SourceBox>

          {/* Lists summary */}
          <div className={`rounded-xl border p-4 flex items-start gap-3 ${selectedListIds.length ? "border-accent/50 bg-accent/5" : "border-white/10 bg-white/[0.03]"}`}>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-accent shrink-0">
              <ListChecks className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Uploaded contact lists</p>
              <p className="text-[11px] text-white/40 mt-0.5">
                {selectedListIds.length
                  ? `${selectedListIds.length} list${selectedListIds.length > 1 ? "s" : ""} selected: ${lists.filter((l) => selectedListIds.includes(l.id)).map((l) => l.name).join(", ")}`
                  : "Tick one or more lists in the Contact lists panel to include them."}
              </p>
            </div>
          </div>

          {/* Typed numbers */}
          <SourceBox
            icon={<Keyboard className="w-4 h-4" />}
            title="Type numbers"
            subtitle="Paste one or many numbers, separated by commas or new lines"
            checked={typedNumbers.length > 0}
            alwaysOpen
          >
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              rows={2}
              className="input text-white text-sm font-mono"
              placeholder="0241234567, 0551234567"
            />
            {typedNumbers.length > 0 && <p className="text-[11px] text-white/40">{typedNumbers.length} number{typedNumbers.length > 1 ? "s" : ""} entered</p>}
          </SourceBox>

          {/* Event details for non-registered contacts */}
          {needsContext && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
              <p className="text-xs text-amber-300">
                Your message uses event tags but {preview.missingEventDetails} recipient{preview.missingEventDetails > 1 ? "s have" : " has"} no event attached. Pick an event to fill {"{event}"}, {"{date}"} and {"{venue}"} for them.
              </p>
              <select value={contextEventId} onChange={(e) => setContextEventId(e.target.value)} className="input text-white text-sm">
                <option value="">Do not fill (leave blank)</option>
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="card-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">Message</label>
            <span className="text-[11px] text-white/30 font-mono">
              {seg ? `${seg.charCount} chars - ${seg.segments} seg - ${seg.encoding}` : `${message.length} chars`}
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="input text-white"
            placeholder="Hi {name}, we have exciting news for you..."
          />
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Insert tag</p>
            <div className="flex flex-wrap gap-1.5">
              {TAG_BUTTONS.map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => insertTag(t.tag)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-accent hover:border-accent/30 transition"
                  title={t.desc}
                >
                  {t.tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Quick templates
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setMessage(t.text)}
                  className="px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent hover:bg-accent/20 transition"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-white/30">
            Emoji and special characters are removed so messages stay at the lowest cost. Keep the https:// in links so they are tappable.
          </p>
        </div>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3">{error}</div>}
        {preview?.frozen && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3">SMS sending is frozen on your account. Contact support.</div>
        )}

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="btn-gold btn-lg w-full flex items-center justify-center gap-2"
        >
          {notEnough ? (
            <>Need {estCredits - balance} more credit{estCredits - balance === 1 ? "" : "s"}</>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send to {preview?.count ?? 0} recipient{preview?.count === 1 ? "" : "s"}
            </>
          )}
        </button>
        {notEnough && (
          <Link href="/dashboard/sms" className="block text-center text-sm text-accent hover:underline">Buy more credits</Link>
        )}
      </div>

      {/* ---------------- right: lists + preview ---------------- */}
      <div className="space-y-5 min-w-0">
        <ContactListsPanel lists={lists} selectedIds={selectedListIds} onToggleSelect={toggleList} onChanged={refreshLists} />

        <div className="card-glass rounded-2xl p-5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Preview</p>
          <div className="rounded-2xl bg-[#0a0a0c] border border-white/10 p-5">
            <div className="flex items-center justify-between text-xs text-white/40 mb-3">
              <span className="font-mono">{preview?.senderId ?? "EventHene"}</span>
              <span>now</span>
            </div>
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">
              {preview?.sample?.[0]?.content
                ? preview.sample[0].content
                : message
                ? message
                : <span className="text-white/30">Your message appears here</span>}
            </p>
          </div>
        </div>

        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Delivery</p>
            {previewing && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Recipients" value={String(preview?.count ?? 0)} />
            <StatBox label="Segments/msg" value={String(seg?.segments ?? 1)} />
            <StatBox label="Credits needed" value={String(estCredits)} />
            <StatBox label="Your balance" value={String(balance)} warn={notEnough} />
          </div>
          {preview && (
            <div className="mt-3 space-y-1 text-[11px] text-white/40">
              <p>
                Registered {preview.breakdown?.registered ?? 0} - Lists {preview.breakdown?.lists ?? 0} - Typed {preview.breakdown?.manual ?? 0}
              </p>
              {preview.duplicates > 0 && <p>{preview.duplicates} duplicate number{preview.duplicates > 1 ? "s" : ""} removed</p>}
              {preview.invalid > 0 && <p className="text-amber-400">{preview.invalid} invalid number{preview.invalid > 1 ? "s" : ""} skipped</p>}
            </div>
          )}
          {notEnough && <Link href="/dashboard/sms" className="mt-3 block text-xs text-accent hover:underline">Buy more credits</Link>}
        </div>

        {preview?.sample?.length > 0 && (
          <div className="card-glass rounded-2xl p-5">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Sample recipients</p>
            <div className="space-y-1.5">
              {preview.sample.map((r: any, i: number) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-white/60 truncate">{r.name || "No name"}</span>
                  <span className="text-white/30 font-mono shrink-0 ml-2">{r.phone}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceBox({
  icon, title, subtitle, checked, onToggle, disabled, disabledNote, alwaysOpen, children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  disabledNote?: string;
  alwaysOpen?: boolean;
  children?: React.ReactNode;
}) {
  const open = alwaysOpen || checked;
  return (
    <div className={`rounded-xl border transition ${checked ? "border-accent/50 bg-accent/5" : "border-white/10 bg-white/[0.03]"} ${disabled ? "opacity-60" : ""}`}>
      <div
        className={`flex items-start gap-3 p-4 ${onToggle && !disabled ? "cursor-pointer" : ""}`}
        onClick={() => onToggle && !disabled && onToggle()}
      >
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-accent shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-[11px] text-white/40 mt-0.5">{disabled && disabledNote ? disabledNote : subtitle}</p>
        </div>
        {onToggle && (
          <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${checked ? "bg-accent border-accent text-black" : "border-white/25"}`}>
            {checked && <CheckIcon />}
          </span>
        )}
      </div>
      {open && !disabled && children && <div className="px-4 pb-4 space-y-2">{children}</div>}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

function ScopeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold border transition ${
        active ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-white/40 hover:text-white/60"
      }`}
    >
      {children}
    </button>
  );
}

function StatBox({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
      <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
      <p className={`font-display text-2xl ${warn ? "text-red-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

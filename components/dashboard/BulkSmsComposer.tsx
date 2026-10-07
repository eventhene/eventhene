"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send, Loader2, Upload, Plus, X, Users, CalendarDays,
  UserPlus, Phone, FileText, Sparkles, ArrowLeft,
} from "lucide-react";

interface EventInfo {
  id: string;
  title: string;
  ticketTypes: { id: string; name: string }[];
  attendeeCount: number;
}

interface Contact {
  name: string;
  phone: string;
}

type AudienceMode = "event" | "all_events" | "upload" | "manual" | "single";

const TEMPLATES = [
  {
    label: "Event reminder",
    text: "Hi {name}, reminder: {event} is coming up at {venue}. Don't miss it!",
  },
  {
    label: "Thank you",
    text: "Hi {name}, thanks for attending {event}. We hope you had an amazing time!",
  },
  {
    label: "Announcement",
    text: "Hi {name}, exciting news from EventHene! We have a new event coming soon. Stay tuned.",
  },
  {
    label: "Custom promo",
    text: "Hi {name}, you're invited to our upcoming event. Register now to secure your spot!",
  },
];

const TAG_BUTTONS = [
  { tag: "{name}", label: "Name", desc: "Recipient's first name" },
  { tag: "{event}", label: "Event", desc: "Event title" },
  { tag: "{date}", label: "Date", desc: "Event date" },
  { tag: "{venue}", label: "Venue", desc: "Event venue" },
  { tag: "{ref}", label: "Ref", desc: "Ticket reference" },
  { tag: "{phone}", label: "Phone", desc: "Recipient's phone" },
];

export function BulkSmsComposer({ events }: { events: EventInfo[] }) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("event");
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || "");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [singlePhone, setSinglePhone] = useState("");

  // Preview state
  const [preview, setPreview] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);

  // Send state
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const buildAudience = useCallback(() => {
    switch (audienceMode) {
      case "event":
        return { eventId: selectedEventId, eventFilter };
      case "all_events":
        return { allEvents: true };
      case "upload":
      case "manual":
        return { contacts };
      case "single":
        return { singlePhone: singlePhone.trim() };
      default:
        return {};
    }
  }, [audienceMode, selectedEventId, eventFilter, contacts, singlePhone]);

  // Live preview
  useEffect(() => {
    const audience = buildAudience();
    if (audienceMode === "upload" || audienceMode === "manual") {
      if (contacts.length === 0) { setPreview(null); return; }
    }
    if (audienceMode === "single") {
      if (!singlePhone.trim()) { setPreview(null); return; }
    }

    const timer = setTimeout(async () => {
      setPreviewing(true);
      try {
        const res = await fetch("/api/sms/compose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preview: true, audience, message }),
        });
        const data = await res.json();
        setPreview(data);
      } catch {} finally {
        setPreviewing(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [audienceMode, selectedEventId, eventFilter, contacts, singlePhone, message, buildAudience]);

  function insertTag(tag: string) {
    const el = textareaRef.current;
    if (!el) { setMessage((m) => m + tag); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = message.slice(0, start);
    const after = message.slice(end);
    setMessage(before + tag + after);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  }

  function addContact() {
    const phone = newPhone.trim();
    if (!phone) return;
    if (contacts.some((c) => c.phone === phone)) return;
    setContacts([...contacts, { name: newName.trim(), phone }]);
    setNewName("");
    setNewPhone("");
  }

  function removeContact(index: number) {
    setContacts(contacts.filter((_, i) => i !== index));
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const parsed: Contact[] = [];
      const seen = new Set<string>();

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Try CSV: name,phone or phone,name or just phone
        const parts = line.split(/[,;\t]/).map((s) => s.trim().replace(/^["']|["']$/g, ""));
        if (parts.length === 0) continue;

        let name = "";
        let phone = "";

        if (parts.length === 1) {
          phone = parts[0];
        } else {
          // Detect which column is phone (starts with 0, +, or digits)
          if (/^[0+\d]/.test(parts[0]) && !/^[0+\d]/.test(parts[1])) {
            phone = parts[0];
            name = parts[1];
          } else if (/^[0+\d]/.test(parts[1])) {
            name = parts[0];
            phone = parts[1];
          } else {
            // Skip header row
            if (i === 0 && /name|phone|number|contact/i.test(line)) continue;
            name = parts[0];
            phone = parts[1];
          }
        }

        phone = phone.replace(/[^0-9+]/g, "");
        if (phone.length < 9) continue;
        if (seen.has(phone)) continue;
        seen.add(phone);
        parsed.push({ name, phone });
      }

      setContacts((prev) => {
        const existing = new Set(prev.map((c) => c.phone));
        const newOnes = parsed.filter((c) => !existing.has(c.phone));
        return [...prev, ...newOnes];
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleSend() {
    if (!campaignName.trim() || !message.trim()) return;
    setError("");
    setSuccess("");
    setSending(true);
    try {
      const res = await fetch("/api/sms/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName.trim(),
          message,
          audience: buildAudience(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed.");
      setSuccess(`Sent to ${data.totalSent} recipient${data.totalSent === 1 ? "" : "s"}. ${data.totalFailed > 0 ? `${data.totalFailed} failed.` : ""}`);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  const seg = preview?.segments;
  const estCredits = preview?.estimatedCredits ?? 0;
  const balance = preview?.balance ?? 0;
  const notEnough = estCredits > balance;
  const canSend = campaignName.trim() && message.trim() && preview?.count > 0 && !notEnough && !sending;

  return (
    <div className="grid lg:grid-cols-[1.3fr,1fr] gap-6">
      {/* Composer */}
      <div className="space-y-5">
        <Link href="/dashboard/sms" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to SMS
        </Link>

        {/* Campaign name */}
        <div className="card-glass rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Campaign name</label>
            <input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="input text-white"
              placeholder="e.g. October promo blast"
            />
          </div>
        </div>

        {/* Audience selection */}
        <div className="card-glass rounded-2xl p-5 space-y-4">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">Audience</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <AudienceTab
              active={audienceMode === "event"}
              onClick={() => setAudienceMode("event")}
              icon={<CalendarDays className="w-4 h-4" />}
              label="Event contacts"
            />
            <AudienceTab
              active={audienceMode === "all_events"}
              onClick={() => setAudienceMode("all_events")}
              icon={<Users className="w-4 h-4" />}
              label="All my contacts"
            />
            <AudienceTab
              active={audienceMode === "upload"}
              onClick={() => setAudienceMode("upload")}
              icon={<Upload className="w-4 h-4" />}
              label="Upload CSV"
            />
            <AudienceTab
              active={audienceMode === "manual"}
              onClick={() => setAudienceMode("manual")}
              icon={<UserPlus className="w-4 h-4" />}
              label="Add manually"
            />
            <AudienceTab
              active={audienceMode === "single"}
              onClick={() => setAudienceMode("single")}
              icon={<Phone className="w-4 h-4" />}
              label="Single number"
            />
          </div>

          {/* Event-based audience */}
          {audienceMode === "event" && (
            <div className="space-y-3 pt-2">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="input text-white"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.attendeeCount} contacts)
                  </option>
                ))}
              </select>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="input text-white"
              >
                <option value="ALL">All registrants</option>
                <option value="ATTENDED">Attended only</option>
                <option value="NOT_ATTENDED">Not attended yet</option>
                <option value="PAID">Paid tickets only</option>
                {selectedEvent?.ticketTypes.map((tt) => (
                  <option key={tt.id} value={`TICKET_TYPE:${tt.id}`}>
                    Ticket: {tt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Upload CSV */}
          {audienceMode === "upload" && (
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 hover:border-accent/40 p-6 cursor-pointer transition">
                <Upload className="w-5 h-5 text-white/40" />
                <span className="text-sm text-white/50">
                  Click to upload CSV or TXT file
                </span>
                <input type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} className="hidden" />
              </label>
              <p className="text-[11px] text-white/30">
                Format: <code className="text-white/50">name,phone</code> or <code className="text-white/50">phone,name</code> per line. Header row auto-detected.
              </p>
              {contacts.length > 0 && (
                <ContactList contacts={contacts} onRemove={removeContact} onClear={() => setContacts([])} />
              )}
            </div>
          )}

          {/* Manual entry */}
          {audienceMode === "manual" && (
            <div className="space-y-3 pt-2">
              <div className="flex gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name (optional)"
                  className="input text-white flex-1"
                />
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Phone number"
                  className="input text-white flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addContact()}
                />
                <button onClick={addContact} className="btn-gold px-3 shrink-0" title="Add contact">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {contacts.length > 0 && (
                <ContactList contacts={contacts} onRemove={removeContact} onClear={() => setContacts([])} />
              )}
            </div>
          )}

          {/* Single phone */}
          {audienceMode === "single" && (
            <div className="pt-2">
              <input
                value={singlePhone}
                onChange={(e) => setSinglePhone(e.target.value)}
                placeholder="e.g. 0247123456"
                className="input text-white"
              />
            </div>
          )}

          {/* All events info */}
          {audienceMode === "all_events" && (
            <p className="text-xs text-white/40 pt-2">
              Sends to all unique phone numbers from all your events ({events.reduce((s, e) => s + e.attendeeCount, 0)} total contacts, duplicates removed).
            </p>
          )}
        </div>

        {/* Message composer */}
        <div className="card-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">Message</label>
            <span className="text-[11px] text-white/30 font-mono">
              {seg ? `${seg.charCount} chars - ${seg.segments} seg - ${seg.encoding}` : "..."}
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

          {/* Tag buttons */}
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Insert tag</p>
            <div className="flex flex-wrap gap-1.5">
              {TAG_BUTTONS.map((t) => (
                <button
                  key={t.tag}
                  onClick={() => insertTag(t.tag)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-accent hover:border-accent/30 transition"
                  title={t.desc}
                >
                  {t.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Quick templates
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setMessage(t.text)}
                  className="px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent hover:bg-accent/20 transition"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-white/30">
            Emoji and non-ASCII chars are stripped. "https://" is removed from links to save characters.
          </p>
        </div>

        {/* Errors / Success */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3">{error}</div>
        )}
        {success && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3">{success}</div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="btn-gold btn-lg w-full flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : notEnough ? (
            <>
              Need {estCredits - balance} more credit{estCredits - balance === 1 ? "" : "s"}
              <Link href="/dashboard/sms" className="underline ml-1">Top up</Link>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send to {preview?.count ?? 0} recipient{preview?.count === 1 ? "" : "s"}
            </>
          )}
        </button>
      </div>

      {/* Preview panel */}
      <div className="space-y-5">
        {/* Phone preview */}
        <div className="card-glass rounded-2xl p-5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Preview</p>
          <div className="rounded-2xl bg-[#0a0a0c] border border-white/10 p-5">
            <div className="flex items-center justify-between text-xs text-white/40 mb-3">
              <span className="font-mono">{preview?.senderId ?? "EventHene"}</span>
              <span>now</span>
            </div>
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
              {preview?.sanitized
                ? preview.sanitized
                    .replace(/\{name\}/gi, "Kwame")
                    .replace(/\{ref\}/gi, "EVH-ABC-1234")
                    .replace(/\{event\}/gi, selectedEvent?.title || "Your Event")
                    .replace(/\{date\}/gi, "Sat Oct 10")
                    .replace(/\{venue\}/gi, "Accra Int'l Conference Centre")
                    .replace(/\{phone\}/gi, "0247123456")
                : <span className="text-white/30">Your message appears here</span>}
            </p>
          </div>
        </div>

        {/* Delivery stats */}
        <div className="card-glass rounded-2xl p-5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Delivery</p>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Recipients" value={previewing ? "..." : String(preview?.count ?? 0)} />
            <StatBox label="Segments/msg" value={String(seg?.segments ?? 1)} />
            <StatBox label="Credits needed" value={String(estCredits)} />
            <StatBox label="Your balance" value={String(balance)} warn={notEnough} />
          </div>
          {notEnough && (
            <Link href="/dashboard/sms" className="mt-3 block text-xs text-accent hover:underline">
              Buy more credits
            </Link>
          )}
        </div>

        {/* Sample recipients */}
        {preview?.sample?.length > 0 && (
          <div className="card-glass rounded-2xl p-5">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Sample recipients</p>
            <div className="space-y-1.5">
              {preview.sample.map((r: any, i: number) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-white/60 truncate">{r.name || "Unknown"}</span>
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

function AudienceTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition border ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ContactList({ contacts, onRemove, onClear }: { contacts: Contact[]; onRemove: (i: number) => void; onClear: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/40">{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</span>
        <button onClick={onClear} className="text-[11px] text-red-400 hover:underline">Clear all</button>
      </div>
      <div className="max-h-48 overflow-y-auto rounded-xl bg-white/5 border border-white/10 divide-y divide-white/5">
        {contacts.map((c, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2">
            <div className="min-w-0">
              <span className="text-sm text-white truncate block">{c.name || "No name"}</span>
              <span className="text-xs text-white/30 font-mono">{c.phone}</span>
            </div>
            <button onClick={() => onRemove(i)} className="text-white/20 hover:text-red-400 transition shrink-0 ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/8 p-3">
      <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
      <p className={`font-display text-2xl ${warn ? "text-red-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

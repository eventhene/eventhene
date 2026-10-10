"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { binDeleted, onBinRestored, rectOf, type FlyDetail } from "@/lib/recycle-bus";
import { Loader2, Send, Trash2, RefreshCw, ShieldCheck, ScanLine, CheckCircle2, Clock, UserPlus } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "MANAGER" | "SCANNER";
  scope: string;
}
interface Invite {
  id: string;
  phone: string;
  role: "MANAGER" | "SCANNER";
  expiresAt: string;
  scope: string;
}

export function TeamManager({
  events,
  members,
  invites,
}: {
  events: { id: string; title: string }[];
  members: Member[];
  invites: Invite[];
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"MANAGER" | "SCANNER">("SCANNER");
  const [allEvents, setAllEvents] = useState(true);
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const res = await fetch("/api/team/invites", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone,
          role,
          eventIds: role === "SCANNER" && !allEvents ? eventIds : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send the invite.");
      setNotice({
        kind: data.smsSent ? "ok" : "err",
        text: data.smsSent
          ? "Invite sent by SMS. They have 7 days to accept."
          : "Invite created but the SMS could not be sent. Use Resend, or share the link manually.",
      });
      setPhone("");
      setEventIds([]);
      setAllEvents(true);
      router.refresh();
    } catch (e: any) {
      setNotice({ kind: "err", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => onBinRestored((k) => { if (k === "team_member") router.refresh(); }), [router]);

  async function rowAction(key: string, url: string, method: "POST" | "DELETE", okText: string, onDone?: () => void) {
    setRowBusy(key);
    setNotice(null);
    try {
      const res = await fetch(url, { method, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setNotice({ kind: data.smsSent === false ? "err" : "ok", text: data.smsSent === false ? "Could not send the SMS." : okText });
      onDone?.();
      router.refresh();
    } catch (e: any) {
      setNotice({ kind: "err", text: e.message });
    } finally {
      setRowBusy(null);
    }
  }

  function toggleEvent(id: string) {
    setEventIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  const canSend = phone.trim().length >= 9 && !busy && (role === "MANAGER" || allEvents || eventIds.length > 0);

  return (
    <div className="space-y-8">
      <form onSubmit={sendInvite} className="card-glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Invite someone</h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Their phone number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="0241234567"
            className="input text-white"
          />
          <p className="text-[11px] text-white/30 mt-1">They get an SMS with a link to set up their account. No email needed.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <RoleCard
            active={role === "SCANNER"}
            onClick={() => setRole("SCANNER")}
            icon={<ScanLine className="w-4 h-4" />}
            title="Scanner"
            text="Checks tickets in at the gate. Nothing else."
          />
          <RoleCard
            active={role === "MANAGER"}
            onClick={() => setRole("MANAGER")}
            icon={<ShieldCheck className="w-4 h-4" />}
            title="Manager"
            text="Runs events, attendees and SMS. Cannot see payouts or manage the team."
          />
        </div>

        {role === "SCANNER" && events.length > 0 && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input type="checkbox" checked={allEvents} onChange={(e) => setAllEvents(e.target.checked)} />
              Can scan all my events (including future ones)
            </label>
            {!allEvents && (
              <div className="max-h-44 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
                {events.map((ev) => (
                  <label key={ev.id} className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 cursor-pointer hover:bg-white/5">
                    <input type="checkbox" checked={eventIds.includes(ev.id)} onChange={() => toggleEvent(ev.id)} />
                    <span className="truncate">{ev.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {notice && (
          <p className={`text-sm ${notice.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}>{notice.text}</p>
        )}

        <button disabled={!canSend} className="btn-gold btn-md flex items-center gap-2">
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending invite...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send invite by SMS
            </>
          )}
        </button>
      </form>

      {invites.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Pending invites</h2>
          <div className="space-y-2">
            {invites.map((i) => (
              <div key={i.id} className="card-glass rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white font-mono">{"0" + i.phone.slice(3)}</p>
                  <p className="text-xs text-white/40 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {i.scope} - expires {new Date(i.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => rowAction(`r-${i.id}`, `/api/team/invites/${i.id}/resend`, "POST", "Invite resent by SMS.")}
                    disabled={rowBusy === `r-${i.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5 disabled:opacity-60"
                  >
                    {rowBusy === `r-${i.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {rowBusy === `r-${i.id}` ? "Sending..." : "Resend"}
                  </button>
                  <button
                    onClick={() => rowAction(`x-${i.id}`, `/api/team/invites/${i.id}`, "DELETE", "Invite cancelled.")}
                    disabled={rowBusy === `x-${i.id}`}
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition"
                    aria-label="Cancel invite"
                  >
                    {rowBusy === `x-${i.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Team members</h2>
        {members.length === 0 ? (
          <div className="card-glass rounded-2xl p-8 text-center text-sm text-white/40">
            No one has joined yet. Send your first invite above.
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="card-glass rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-accent/20 text-accent font-bold text-sm flex items-center justify-center shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate flex items-center gap-2">
                      {m.name}
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 uppercase font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        {m.role.toLowerCase()}
                      </span>
                    </p>
                    <p className="text-xs text-white/40 truncate">{m.email}{m.phone ? ` - ${m.phone}` : ""}</p>
                    <p className="text-[11px] text-white/30 truncate">{m.scope}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    // capture the button position synchronously, before anything changes
                    const rect: FlyDetail["rect"] = rectOf(e.currentTarget);
                    if (confirm(`Remove ${m.name} from your team? You can restore them from the recycle bin.`)) {
                      rowAction(`m-${m.id}`, `/api/team/members/${m.id}`, "DELETE", "Team member removed.", () => binDeleted("team_member", rect));
                    }
                  }}
                  disabled={rowBusy === `m-${m.id}`}
                  className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition shrink-0"
                  aria-label={`Remove ${m.name}`}
                >
                  {rowBusy === `m-${m.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RoleCard({
  active, onClick, icon, title, text,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition ${
        active ? "border-accent bg-accent/10" : "border-white/10 hover:border-white/25"
      }`}
    >
      <p className={`flex items-center gap-2 text-sm font-bold ${active ? "text-accent" : "text-white"}`}>
        {icon}
        {title}
      </p>
      <p className="text-xs text-white/40 mt-1">{text}</p>
    </button>
  );
}

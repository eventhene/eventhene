"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Users, ListChecks } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";

interface Opt {
  id: string;
  name?: string;
  title?: string;
  count: number;
}
interface Col {
  key: string;
  label: string;
  group: "standard" | "custom" | "meta";
}

const GROUP_LABEL: Record<Col["group"], string> = {
  standard: "From your registration forms",
  custom: "Your own questions",
  meta: "Where the contact came from",
};

export function ContactExport() {
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<Opt[]>([]);
  const [events, setEvents] = useState<Opt[]>([]);
  const [columns, setColumns] = useState<Col[]>([]);

  const [useLists, setUseLists] = useState(true);
  const [useRegistered, setUseRegistered] = useState(true);
  const [listIds, setListIds] = useState<string[]>([]);
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const [dedupe, setDedupe] = useState(true);

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/contacts/export", { credentials: "include" });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Could not load your contacts.");
        setLists(d.lists ?? []);
        setEvents(d.events ?? []);
        setColumns(d.columns ?? []);
        // Default to the column almost everyone wants, if they collected it.
        const city = (d.columns ?? []).find((c: Col) => c.key === "CITY");
        setChosen(city ? ["CITY", "_source"] : ["_source"]);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function toggle(arr: string[], set: (v: string[]) => void, id: string) {
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const sources = [useLists && "lists", useRegistered && "registered"].filter(Boolean) as string[];
    if (sources.length === 0) {
      setErr("Choose at least one source.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/contacts/export", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sources, listIds, eventIds, columns: chosen, format, dedupe }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not build that export.");
      }
      const blob = await res.blob();
      const name =
        res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ?? `contacts.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="card-glass flex items-center gap-3 rounded-2xl p-7 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your contacts...
      </div>
    );
  }

  const grouped = (g: Col["group"]) => columns.filter((c) => c.group === g);
  const totalRegistered = events.reduce((n, e) => n + e.count, 0);
  const totalUploaded = lists.reduce((n, l) => n + l.count, 0);

  return (
    <form onSubmit={run} className="space-y-6">
      {/* ---------- where the contacts come from ---------- */}
      <section className="card-glass rounded-2xl p-7">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Who to include</h2>
        <p className="mt-2 text-sm text-white/45">
          Everyone you uploaded, everyone who registered, or both.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setUseRegistered((v) => !v)}
            className={`rounded-2xl border p-5 text-left transition ${
              useRegistered ? "border-accent/50 bg-accent/10" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <Users className={`h-5 w-5 ${useRegistered ? "text-accent" : "text-white/40"}`} />
            <p className="mt-3 font-bold text-white">Registered</p>
            <p className="text-xs text-white/45">{totalRegistered} across {events.length} event{events.length === 1 ? "" : "s"}</p>
          </button>
          <button
            type="button"
            onClick={() => setUseLists((v) => !v)}
            className={`rounded-2xl border p-5 text-left transition ${
              useLists ? "border-accent/50 bg-accent/10" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <ListChecks className={`h-5 w-5 ${useLists ? "text-accent" : "text-white/40"}`} />
            <p className="mt-3 font-bold text-white">Uploaded</p>
            <p className="text-xs text-white/45">{totalUploaded} across {lists.length} list{lists.length === 1 ? "" : "s"}</p>
          </button>
        </div>

        {useRegistered && events.length > 0 && (
          <Picker
            label="Events"
            hint="Leave all unticked for every event."
            items={events.map((e) => ({ id: e.id, label: e.title ?? "", count: e.count }))}
            selected={eventIds}
            onToggle={(id) => toggle(eventIds, setEventIds, id)}
          />
        )}
        {useLists && lists.length > 0 && (
          <Picker
            label="Contact lists"
            hint="Leave all unticked for every list."
            items={lists.map((l) => ({ id: l.id, label: l.name ?? "", count: l.count }))}
            selected={listIds}
            onToggle={(id) => toggle(listIds, setListIds, id)}
          />
        )}
      </section>

      {/* ---------- which columns ---------- */}
      <section className="card-glass rounded-2xl p-7">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Columns</h2>
        <p className="mt-2 text-sm text-white/45">
          Name and phone are always included. Tick anything else you want, drawn from what your own
          forms asked for. Uploaded contacts leave those cells blank.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white">Name</span>
          <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white">Phone</span>
        </div>

        {(["standard", "custom", "meta"] as const).map((g) =>
          grouped(g).length === 0 ? null : (
            <div key={g} className="mt-5">
              <p className="text-[10px] uppercase tracking-wider text-white/30">{GROUP_LABEL[g]}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {grouped(g).map((c) => {
                  const on = chosen.includes(c.key);
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => toggle(chosen, setChosen, c.key)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        on
                          ? "border-accent/50 bg-accent/15 text-accent"
                          : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )
        )}
      </section>

      {/* ---------- output ---------- */}
      <section className="card-glass rounded-2xl p-7">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">File</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(["xlsx", "csv"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase transition ${
                format === f
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-white/10 bg-white/[0.03] text-white/55"
              }`}
            >
              {f === "xlsx" ? "Excel" : "CSV"}
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm text-white/55">
          <input type="checkbox" className="mt-1" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} />
          <span>
            One row per phone number. Someone who is on a list and also registered appears once, keeping
            the registered details.
          </span>
        </label>
      </section>

      {err && (
        <p className="rounded-xl border border-crimson/20 bg-crimson/5 px-4 py-3 text-sm font-semibold text-crimson">
          {err}
        </p>
      )}

      <SubmitButton
        type="submit"
        loading={busy}
        success={done}
        doneLabel="Downloaded"
        loadingLabel="Building your file..."
        className="btn-gold btn-xl w-full sm:w-auto"
      >
        <Download className="h-5 w-5" />
        Export contacts
      </SubmitButton>
    </form>
  );
}

function Picker({
  label,
  hint,
  items,
  selected,
  onToggle,
}: {
  label: string;
  hint: string;
  items: { id: string; label: string; count: number }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="mt-5">
      <p className="text-[10px] uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-1 text-xs text-white/35">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((it) => {
          const on = selected.includes(it.id);
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onToggle(it.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                on
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
              }`}
            >
              {it.label} <span className="opacity-50">({it.count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

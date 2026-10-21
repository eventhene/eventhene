"use client";

import { useState } from "react";
import { CheckCircle2, UserPlus } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";

export interface GateField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
}

export interface GateTicketType {
  id: string;
  name: string;
}

/** Maps a field key onto the attendee payload the gate API expects. */
const KEY_TO_FIELD: Record<string, string> = {
  FULL_NAME: "fullName",
  PHONE: "phone",
  EMAIL: "email",
  GENDER: "gender",
  CITY: "city",
  ADDRESS: "address",
  ORGANIZATION: "organization",
  AGE_RANGE: "ageRange",
  EMERGENCY_CONTACT: "emergencyContact",
};

function inputType(t: string): string {
  if (t === "EMAIL") return "email";
  if (t === "PHONE") return "tel";
  if (t === "NUMBER") return "number";
  if (t === "DATE") return "date";
  return "text";
}

export function GateRegisterForm({
  token,
  fields,
  ticketTypes,
  adminMode = false,
  onRegistered,
}: {
  token: string;
  fields: GateField[];
  ticketTypes: GateTicketType[];
  /** Admin screens keep the form up so an usher can do one after another. */
  adminMode?: boolean;
  onRegistered?: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<null | { name: string; ref: string; checkedIn: boolean; note?: string }>(null);
  const [justDone, setJustDone] = useState(false);

  function set(key: string, v: string) {
    setValues((s) => ({ ...s, [key]: v }));
  }

  function reset() {
    setValues({});
    setDone(null);
    setJustDone(false);
    setErr(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const payload: Record<string, unknown> = { ticketTypeId };
      const custom: Record<string, string> = {};
      for (const f of fields) {
        const v = (values[f.key + f.label] ?? "").trim();
        const mapped = KEY_TO_FIELD[f.key];
        if (mapped) payload[mapped] = v;
        else if (v) custom[f.label] = v;
      }
      if (Object.keys(custom).length) payload.customAnswers = custom;

      const res = await fetch(`/api/gate/${token}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not register you.");
      // let the button finish its lap and flip before the confirmation replaces it
      setJustDone(true);
      await new Promise((r) => setTimeout(r, 620));
      setDone({ name: data.attendeeName, ref: data.visibleRef, checkedIn: data.checkedIn, note: data.note });
      onRegistered?.();
      if (adminMode) setValues({});
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-5 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald" />
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            {done.checkedIn ? "You are in" : "Registered"}
          </h2>
          <p className="mt-2 text-white/60">
            {done.name}
            {done.checkedIn ? ". You are registered and checked in." : "."}
          </p>
          {done.note && <p className="mt-1 text-sm text-amber-400">{done.note}</p>}
          <p className="mono mt-4 text-sm text-accent">{done.ref}</p>
        </div>
        <button onClick={reset} className="btn-gold btn-lg w-full">
          {adminMode ? "Register the next person" : "Register someone else"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {ticketTypes.length > 1 && (
        <div>
          <label className="label">Ticket type</label>
          <select value={ticketTypeId} onChange={(e) => setTicketTypeId(e.target.value)} className="input text-white">
            {ticketTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {fields.map((f) => {
        const id = f.key + f.label;
        return (
          <div key={id}>
            <label className="label">
              {f.label}
              {!f.required && <span className="ml-1 text-white/30">(optional)</span>}
            </label>
            {f.type === "SELECT" ? (
              <select
                required={f.required}
                value={values[id] ?? ""}
                onChange={(e) => set(id, e.target.value)}
                className="input text-white"
              >
                <option value="">Choose...</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === "TEXTAREA" ? (
              <textarea
                required={f.required}
                value={values[id] ?? ""}
                onChange={(e) => set(id, e.target.value)}
                rows={3}
                className="input text-white"
              />
            ) : (
              <input
                type={inputType(f.type)}
                required={f.required}
                inputMode={f.type === "PHONE" ? "tel" : undefined}
                placeholder={f.key === "PHONE" ? "0241234567" : undefined}
                value={values[id] ?? ""}
                onChange={(e) => set(id, e.target.value)}
                className="input text-white"
              />
            )}
          </div>
        );
      })}

      {err && (
        <div className="rounded-xl border border-crimson/20 bg-crimson/5 px-4 py-3 text-sm font-semibold text-crimson">
          {err}
        </div>
      )}

      <SubmitButton
        type="submit"
        loading={busy}
        success={justDone}
        doneLabel="You are in"
        loadingLabel="Registering..."
        className="btn-gold btn-xl w-full"
        wrapClassName="w-full"
      >
        <UserPlus className="h-5 w-5" />
        Register and check in
      </SubmitButton>
    </form>
  );
}

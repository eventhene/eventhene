"use client";

import { useState } from "react";
import {
  Plus, Loader2, Trash2, ChevronDown, ChevronRight, Upload, UserPlus, Search, ListChecks, Check, X,
} from "lucide-react";
import { parseContactsText } from "@/lib/sms/parse-contacts";

export interface ContactListSummary {
  id: string;
  name: string;
  count: number;
}

interface ContactRow {
  id: string;
  name: string | null;
  phone: string;
}

interface Props {
  lists: ContactListSummary[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onChanged: () => void | Promise<void>;
}

export function ContactListsPanel({ lists, selectedIds, onToggleSelect, onChanged }: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function createList(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreateBusy(true);
    setError("");
    try {
      const res = await fetch("/api/sms/contact-lists", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the list.");
      setNewName("");
      setCreating(false);
      await onChanged();
      setExpandedId(data.list.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <div className="card-glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-white">Contact lists</h3>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            New list
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={createList} className="flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="List name, e.g. Church members"
            maxLength={60}
            className="input text-white text-sm flex-1"
          />
          <button
            disabled={createBusy || !newName.trim()}
            className="btn-gold btn-sm flex items-center gap-1.5 shrink-0"
          >
            {createBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {createBusy ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={() => { setCreating(false); setNewName(""); setError(""); }}
            className="p-2 text-white/40 hover:text-white/70"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {lists.length === 0 && !creating ? (
        <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
          <p className="text-sm text-white/50">No lists yet.</p>
          <p className="text-xs text-white/30 mt-1">Create a list, then upload or add contacts to message them any time.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((l) => (
            <ListRow
              key={l.id}
              list={l}
              selected={selectedIds.includes(l.id)}
              expanded={expandedId === l.id}
              onToggleSelect={() => onToggleSelect(l.id)}
              onToggleExpand={() => setExpandedId(expandedId === l.id ? null : l.id)}
              onChanged={onChanged}
              onDeleted={() => {
                if (expandedId === l.id) setExpandedId(null);
                if (selectedIds.includes(l.id)) onToggleSelect(l.id);
              }}
            />
          ))}
        </div>
      )}
      {lists.length > 0 && (
        <p className="text-[11px] text-white/30">Tick a list to include it in this message.</p>
      )}
    </div>
  );
}

function ListRow({
  list, selected, expanded, onToggleSelect, onToggleExpand, onChanged, onDeleted,
}: {
  list: ContactListSummary;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onChanged: () => void | Promise<void>;
  onDeleted: () => void;
}) {
  const [contacts, setContacts] = useState<ContactRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sms/contact-lists/${list.id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContacts(data.contacts);
    } catch (e: any) {
      setNote({ kind: "err", text: e.message || "Could not load contacts." });
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand() {
    if (!expanded && contacts === null) load();
    onToggleExpand();
  }

  async function addContacts(rows: { name: string; phone: string }[], source: "manual" | "file") {
    if (rows.length === 0) {
      setNote({ kind: "err", text: "No phone numbers found." });
      return;
    }
    source === "manual" ? setAddBusy(true) : setUploadBusy(true);
    setNote(null);
    try {
      const res = await fetch(`/api/sms/contact-lists/${list.id}/contacts`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contacts: rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add contacts.");
      const s = data.stats;
      const bits = [`${s.added} added`];
      if (s.duplicates) bits.push(`${s.duplicates} already there`);
      if (s.invalid) bits.push(`${s.invalid} invalid skipped`);
      setNote({ kind: s.added > 0 ? "ok" : "err", text: bits.join(", ") });
      if (source === "manual") { setName(""); setPhone(""); }
      await load();
      await onChanged();
    } catch (e: any) {
      setNote({ kind: "err", text: e.message });
    } finally {
      setAddBusy(false);
      setUploadBusy(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => addContacts(parseContactsText(String(ev.target?.result ?? "")), "file");
    reader.readAsText(file);
  }

  async function removeContact(id: string) {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/sms/contacts/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Could not delete contact.");
      setContacts((c) => (c ? c.filter((x) => x.id !== id) : c));
      await onChanged();
    } catch (e: any) {
      setNote({ kind: "err", text: e.message });
    } finally {
      setRemovingId(null);
    }
  }

  async function deleteList() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/sms/contact-lists/${list.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Could not delete the list.");
      onDeleted();
      await onChanged();
    } catch (e: any) {
      setNote({ kind: "err", text: e.message });
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const shown = (contacts ?? []).filter((c) => {
    const q = query.trim().toLowerCase();
    return !q || c.phone.includes(q.replace(/\D/g, "") || "~") || (c.name ?? "").toLowerCase().includes(q);
  });

  return (
    <div className={`rounded-xl border transition ${selected ? "border-accent/50 bg-accent/5" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={onToggleSelect}
          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
            selected ? "bg-accent border-accent text-black" : "border-white/25 text-transparent hover:border-white/50"
          }`}
          aria-label={selected ? "Remove list from message" : "Send to this list"}
          aria-pressed={selected}
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={toggleExpand} className="flex-1 min-w-0 flex items-center gap-2 text-left">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white truncate">{list.name}</span>
            <span className="block text-[11px] text-white/40">{list.count} contact{list.count === 1 ? "" : "s"}</span>
          </span>
          {expanded ? <ChevronDown className="w-4 h-4 text-white/40 ml-auto shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/40 ml-auto shrink-0" />}
        </button>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition shrink-0"
            aria-label={`Delete ${list.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={deleteList}
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-lg bg-red-600 hover:bg-red-500 px-2 py-1 text-[11px] font-bold text-white disabled:opacity-70"
            >
              {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
              {deleting ? "Deleting..." : "Delete"}
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting} className="px-1.5 py-1 text-[11px] text-white/50 hover:text-white">
              No
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-white/10 p-3 space-y-3">
          <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input text-white text-xs py-2" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addContacts([{ name, phone }], "manual"); } }}
              placeholder="Phone"
              inputMode="tel"
              className="input text-white text-xs py-2"
            />
            <button
              type="button"
              onClick={() => addContacts([{ name, phone }], "manual")}
              disabled={addBusy || !phone.trim()}
              className="btn-gold btn-sm flex items-center gap-1"
              aria-label="Add contact"
            >
              {addBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Add
            </button>
          </div>

          <label className={`flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 hover:border-accent/40 p-2.5 text-xs text-white/50 cursor-pointer transition ${uploadBusy ? "opacity-60 pointer-events-none" : ""}`}>
            {uploadBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploadBusy ? "Uploading contacts..." : "Upload CSV or TXT (name,phone)"}
            <input type="file" accept=".csv,.txt,.tsv" onChange={onFile} className="hidden" />
          </label>

          {note && (
            <p className={`text-xs ${note.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}>{note.text}</p>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-white/40 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading contacts...
            </div>
          ) : contacts && contacts.length > 0 ? (
            <>
              {contacts.length > 8 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search this list"
                    className="input text-white text-xs py-2 pl-8"
                  />
                </div>
              )}
              <div className="max-h-56 overflow-y-auto rounded-lg bg-black/20 divide-y divide-white/5">
                {shown.slice(0, 300).map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2 gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate">{c.name || "No name"}</p>
                      <p className="text-[11px] text-white/35 font-mono">{c.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeContact(c.id)}
                      disabled={removingId === c.id}
                      className="text-white/25 hover:text-red-400 transition shrink-0"
                      aria-label="Delete contact"
                    >
                      {removingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
                {shown.length === 0 && <p className="text-xs text-white/30 p-3">No matches.</p>}
              </div>
              {shown.length > 300 && <p className="text-[11px] text-white/30">Showing the first 300. Use search to find others.</p>}
            </>
          ) : (
            <p className="text-xs text-white/30">This list is empty. Add a contact or upload a file above.</p>
          )}
        </div>
      )}
    </div>
  );
}

import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { normalizeGhPhone } from "@/lib/sms/phone";
import { isPlaceholderEmail } from "@/lib/guest-email";

/**
 * One export covering everyone an organizer holds: the contacts they uploaded
 * into lists and the people who registered for their events.
 *
 * Name and Phone always go out. Everything else is opt-in, because the whole
 * point is that an organizer picks the columns their own form collected.
 */

export type ContactSource = "lists" | "registered";
export type ExportFormat = "csv" | "xlsx";

/** Fields an attendee record can carry, beyond name and phone. */
const STANDARD_COLUMNS: { key: string; label: string }[] = [
  { key: "EMAIL", label: "Email" },
  { key: "GENDER", label: "Gender" },
  { key: "CITY", label: "City / town" },
  { key: "ADDRESS", label: "Address" },
  { key: "ORGANIZATION", label: "Organization" },
  { key: "AGE_RANGE", label: "Age range" },
  { key: "EMERGENCY_CONTACT", label: "Emergency contact" },
];

/** Columns that describe where the row came from rather than the person. */
const META_COLUMNS: { key: string; label: string }[] = [
  { key: "_source", label: "Source" },
  { key: "_event", label: "Event" },
  { key: "_list", label: "Contact list" },
  { key: "_status", label: "Ticket status" },
  { key: "_registeredAt", label: "Registered at" },
];

export interface ColumnOption {
  key: string;
  label: string;
  group: "standard" | "custom" | "meta";
}

/** What this organizer could actually put in an export, based on their own data. */
export async function exportOptions(organizerId: string) {
  const [lists, events] = await Promise.all([
    db.contactList.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { contacts: true } } },
    }),
    db.event.findMany({
      where: { organizerId },
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        _count: { select: { tickets: true } },
        attendeeFields: { select: { key: true, label: true } },
      },
    }),
  ]);

  // Only offer the standard fields this organizer has actually collected.
  const collected = new Set<string>();
  const customLabels = new Set<string>();
  for (const e of events) {
    for (const f of e.attendeeFields) {
      if (f.key === "CUSTOM") customLabels.add(f.label);
      else collected.add(f.key);
    }
  }

  const columns: ColumnOption[] = [
    ...STANDARD_COLUMNS.filter((c) => collected.has(c.key)).map((c) => ({ ...c, group: "standard" as const })),
    ...Array.from(customLabels).map((label) => ({ key: `c:${label}`, label, group: "custom" as const })),
    ...META_COLUMNS.map((c) => ({ ...c, group: "meta" as const })),
  ];

  return {
    lists: lists.map((l) => ({ id: l.id, name: l.name, count: l._count.contacts })),
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      count: e._count.tickets,
    })),
    columns,
  };
}

interface Row {
  name: string;
  phone: string;
  values: Record<string, string>;
  /** Registered rows win a dedupe tie because they carry more detail. */
  rank: number;
}

export interface ExportContactsOptions {
  organizerId: string;
  sources: ContactSource[];
  /** Empty means every list / every event. */
  listIds?: string[];
  eventIds?: string[];
  columns: string[];
  format: ExportFormat;
  /** Collapse the same phone number to one row. */
  dedupe: boolean;
}

export async function exportContacts(opts: ExportContactsOptions): Promise<{
  buffer: Buffer;
  filename: string;
  mimeType: string;
  rowCount: number;
}> {
  const rows: Row[] = [];
  const wantLists = opts.sources.includes("lists");
  const wantRegistered = opts.sources.includes("registered");

  if (wantRegistered) {
    const where: any = { event: { organizerId: opts.organizerId } };
    if (opts.eventIds?.length) where.eventId = { in: opts.eventIds };
    const tickets = await db.ticket.findMany({
      where,
      include: { attendee: true, event: { select: { title: true } } },
      orderBy: { createdAt: "asc" },
      take: 20000,
    });
    for (const t of tickets) {
      const a = t.attendee;
      const custom = (a.customAnswers ?? {}) as Record<string, unknown>;
      const values: Record<string, string> = {
        EMAIL: a.email && !isPlaceholderEmail(a.email) ? a.email : "",
        GENDER: a.gender ?? "",
        CITY: a.city ?? "",
        ADDRESS: a.address ?? "",
        ORGANIZATION: a.organization ?? "",
        AGE_RANGE: a.ageRange ?? "",
        EMERGENCY_CONTACT: a.emergencyContact ?? "",
        _source: "Registered",
        _event: t.event.title,
        _list: "",
        _status: t.status,
        _registeredAt: t.createdAt.toISOString().slice(0, 16).replace("T", " "),
      };
      for (const [k, v] of Object.entries(custom)) values[`c:${k}`] = v == null ? "" : String(v);
      rows.push({ name: a.fullName, phone: a.phone ?? "", values, rank: 2 });
    }
  }

  if (wantLists) {
    const where: any = { list: { organizerId: opts.organizerId } };
    if (opts.listIds?.length) where.listId = { in: opts.listIds };
    const contacts = await db.contact.findMany({
      where,
      include: { list: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 20000,
    });
    for (const c of contacts) {
      rows.push({
        name: c.name ?? "",
        phone: c.phone,
        // A list holds a name, a number and sometimes a gender. Anything the
        // registration form asked for is simply blank here, which is honest.
        values: {
          GENDER: c.gender ?? "",
          _source: "Uploaded",
          _event: "",
          _list: c.list.name,
          _status: "",
          _registeredAt: c.createdAt.toISOString().slice(0, 16).replace("T", " "),
        },
        rank: 1,
      });
    }
  }

  let out = rows;
  if (opts.dedupe) {
    // Key on the normalized number so 024... and +233... are the same person.
    const best = new Map<string, Row>();
    for (const r of rows) {
      const key = normalizeGhPhone(r.phone) ?? `name:${r.name.toLowerCase()}`;
      const existing = best.get(key);
      if (!existing || r.rank > existing.rank) best.set(key, r);
    }
    out = Array.from(best.values());
  }
  out.sort((a, b) => a.name.localeCompare(b.name));

  const chosen = opts.columns.filter((c) => c !== "NAME" && c !== "PHONE");
  const labelFor = (key: string): string => {
    if (key.startsWith("c:")) return key.slice(2);
    return (
      STANDARD_COLUMNS.find((c) => c.key === key)?.label ??
      META_COLUMNS.find((c) => c.key === key)?.label ??
      key
    );
  };

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EventHene";
  const ws = workbook.addWorksheet("Contacts");
  ws.columns = [
    { header: "Name", key: "name", width: 26 },
    { header: "Phone", key: "phone", width: 18 },
    ...chosen.map((k) => ({ header: labelFor(k), key: k, width: 20 })),
  ];
  for (const r of out) {
    const row: Record<string, string> = { name: r.name, phone: r.phone };
    for (const k of chosen) row[k] = r.values[k] ?? "";
    ws.addRow(row);
  }
  ws.getRow(1).font = { bold: true };

  const stamp = new Date().toISOString().slice(0, 10);
  const base = `eventhene-contacts-${stamp}`;

  if (opts.format === "csv") {
    const buf = await workbook.csv.writeBuffer();
    return {
      buffer: Buffer.from(buf as ArrayBuffer),
      filename: `${base}.csv`,
      mimeType: "text/csv",
      rowCount: out.length,
    };
  }
  const xlsx = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(xlsx as ArrayBuffer),
    filename: `${base}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    rowCount: out.length,
  };
}

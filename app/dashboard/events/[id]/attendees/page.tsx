import Link from "next/link";
import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";
import { AttendeesTable, type AttendeeRow, type AttendeeCol } from "@/components/dashboard/AttendeesTable";

export const dynamic = "force-dynamic";

export default async function AttendeesPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { filter?: string };
}) {
  const { event } = await requireEventOwner(params.id);
  const filter = (searchParams.filter ?? "all") as "all" | "attended" | "unattended";

  const where: any = { eventId: params.id };
  if (filter === "attended") where.status = "ATTENDED";
  if (filter === "unattended") where.status = { in: ["TICKET_ISSUED", "PAID", "REGISTERED"] };

  const [tickets, fields] = await Promise.all([
    db.ticket.findMany({
      where,
      include: { attendee: true, ticketType: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    db.attendeeField.findMany({ where: { eventId: params.id }, orderBy: { sortOrder: "asc" } }),
  ]);

  // one column for every field the organizer collected (custom fields by their label)
  const cols: AttendeeCol[] = fields
    .filter((f) => f.key !== "FULL_NAME")
    .map((f) => ({ key: f.key === "CUSTOM" ? `c:${f.label}` : f.key, label: f.label }));

  const rows: AttendeeRow[] = tickets.map((t) => {
    const a = t.attendee;
    const custom = (a.customAnswers ?? {}) as Record<string, unknown>;
    const values: Record<string, string> = {
      PHONE: a.phone ?? "",
      EMAIL: a.email ?? "",
      GENDER: a.gender ?? "",
      CITY: a.city ?? "",
      ADDRESS: a.address ?? "",
      ORGANIZATION: a.organization ?? "",
      AGE_RANGE: a.ageRange ?? "",
      EMERGENCY_CONTACT: a.emergencyContact ?? "",
    };
    for (const [k, v] of Object.entries(custom)) values[`c:${k}`] = v == null ? "" : String(v);
    return {
      id: t.id,
      ref: t.visibleRef,
      name: a.fullName,
      typeName: t.ticketType.name,
      status: t.status,
      registeredAt: t.createdAt.toISOString(),
      checkedInAt: t.usedAt ? t.usedAt.toISOString() : null,
      values,
    };
  });

  // phone and email are always worth showing if any guest has them, even if the form did not ask
  for (const key of ["PHONE", "EMAIL"]) {
    if (!cols.some((c) => c.key === key) && rows.some((r) => r.values[key])) {
      cols.unshift({ key, label: key === "PHONE" ? "Phone number" : "Email" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">{event.title}</p>
          <h1 className="h-section mt-1">{event.type === "FREE" ? "Registered guests" : "Attendees"}</h1>
          <p className="mt-1 text-xs text-ink-muted">{tickets.length} shown</p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/events/${params.id}/attendees/export?filter=${filter}&format=xlsx`} className="btn-primary btn-md">
            Export Excel
          </a>
          <a href={`/api/events/${params.id}/attendees/export?filter=${filter}&format=csv`} className="btn-ghost btn-md">
            Export CSV
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "attended", "unattended"] as const).map((f) => (
          <Link
            key={f}
            href={`/dashboard/events/${params.id}/attendees?filter=${f}`}
            className={`chip ${filter === f ? "chip-ink" : "chip-outline"}`}
          >
            {f === "all" ? "All" : f === "attended" ? "Checked in" : "Not checked in yet"}
          </Link>
        ))}
      </div>

      <AttendeesTable eventId={params.id} eventType={event.type as "PAID" | "FREE"} timezone={event.timezone} cols={cols} rows={rows} />
    </div>
  );
}

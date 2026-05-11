import Link from "next/link";
import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";
import { formatDateShort } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AttendeesPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { filter?: string };
}) {
  await requireEventOwner(params.id);
  const filter = (searchParams.filter ?? "all") as "all" | "attended" | "unattended";

  const where: any = { eventId: params.id };
  if (filter === "attended") where.status = "ATTENDED";
  if (filter === "unattended") where.status = { in: ["TICKET_ISSUED", "PAID", "REGISTERED"] };

  const tickets = await db.ticket.findMany({
    where,
    include: { attendee: true, ticketType: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="h-display text-3xl">Attendees</h1>
        <div className="flex gap-2">
          <a
            href={`/api/events/${params.id}/attendees/export?filter=${filter}&format=xlsx`}
            className="btn-primary text-sm"
          >
            Export Excel
          </a>
          <a
            href={`/api/events/${params.id}/attendees/export?filter=${filter}&format=csv`}
            className="btn-secondary text-sm"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "attended", "unattended"] as const).map((f) => (
          <Link
            key={f}
            href={`/dashboard/events/${params.id}/attendees?filter=${f}`}
            className={`chip ${filter === f ? "bg-primary text-white" : "bg-surface-2 text-ink"}`}
          >
            {f === "all" ? "All" : f === "attended" ? "Attended" : "Not attended yet"}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Booked</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-muted">No attendees yet.</td></tr>
            )}
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-border hover:bg-surface-2">
                <td className="px-4 py-3 font-mono text-xs">{t.visibleRef}</td>
                <td className="px-4 py-3">{t.attendee.fullName}</td>
                <td className="px-4 py-3">{t.ticketType.name}</td>
                <td className="px-4 py-3">{t.attendee.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  {t.status === "ATTENDED" ? (
                    <span className="chip-success">Attended</span>
                  ) : (
                    <span className="chip-muted">{t.status.replace("_", " ")}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">{formatDateShort(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

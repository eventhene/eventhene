import Link from "next/link";
import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";
import { formatDateShort } from "@/lib/utils";

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

  const tickets = await db.ticket.findMany({
    where,
    include: { attendee: true, ticketType: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-ink-muted">{event.title}</p>
          <h1 className="h-section mt-1">Attendees</h1>
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

      <div className="flex gap-2">
        {(["all", "attended", "unattended"] as const).map((f) => (
          <Link
            key={f}
            href={`/dashboard/events/${params.id}/attendees?filter=${f}`}
            className={`chip ${filter === f ? "chip-ink" : "chip-outline"}`}
          >
            {f === "all" ? "All" : f === "attended" ? "Attended" : "Not attended yet"}
          </Link>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="card p-16 text-center text-ink-muted">No attendees yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left">
              <tr>
                <th className="px-5 py-4">Reference</th>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Booked</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-surface-2/50">
                  <td className="px-5 py-4 font-mono text-xs">{t.visibleRef}</td>
                  <td className="px-5 py-4">{t.attendee.fullName}</td>
                  <td className="px-5 py-4"><span className="chip-outline">{t.ticketType.name}</span></td>
                  <td className="px-5 py-4 text-ink-muted font-mono text-xs">{t.attendee.phone ?? "-"}</td>
                  <td className="px-5 py-4">
                    {t.status === "ATTENDED" ? (
                      <span className="chip-emerald">Attended</span>
                    ) : (
                      <span className="chip-outline">{t.status.replace("_", " ").toLowerCase()}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-ink-muted">{formatDateShort(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

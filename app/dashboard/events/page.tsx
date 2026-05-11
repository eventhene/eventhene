import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { formatDateShort } from "@/lib/utils";

export default async function EventsListPage() {
  const { organizer } = await requireOrganizer();
  const events = await db.event.findMany({
    where: { organizerId: organizer.id },
    include: { ticketTypes: true, _count: { select: { tickets: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="h-display text-3xl">My events</h1>
        <Link href="/dashboard/events/new" className="btn-primary">+ Create event</Link>
      </div>

      {events.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-muted mb-4">No events yet. Let's create your first.</p>
          <Link href="/dashboard/events/new" className="btn-primary">Create event</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Tickets</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const sold = e.ticketTypes.reduce((s, t) => s + t.sold, 0);
                const total = e.ticketTypes.reduce((s, t) => s + t.quantity, 0);
                return (
                  <tr key={e.id} className="border-t border-border hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/events/${e.id}`} className="font-medium hover:underline">
                        {e.title}
                      </Link>
                      <p className="text-xs text-ink-muted">{e.venue}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDateShort(e.startsAt, e.timezone)}</td>
                    <td className="px-4 py-3">
                      <span className="chip-muted">{e.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{sold} / {total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { formatDateShort } from "@/lib/utils";
import { StatusChip } from "@/components/dashboard/StatusChip";

export const dynamic = "force-dynamic";

export default async function EventsListPage() {
  const { organizer } = await requireOrganizer();
  const events = await db.event.findMany({
    where: { organizerId: organizer.id },
    include: { ticketTypes: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-ink-muted">Everything you've created</p>
          <h1 className="h-section mt-1">Events</h1>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary btn-lg">New event</Link>
      </div>

      {events.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-ink-muted mb-6">No events yet.</p>
          <Link href="/dashboard/events/new" className="btn-primary btn-lg">Create event</Link>
        </div>
      ) : (
        <>
        <div className="md:hidden space-y-3">
          {events.map((e) => {
            const sold = e.ticketTypes.reduce((s, t) => s + t.sold, 0);
            const total = e.ticketTypes.reduce((s, t) => s + t.quantity, 0);
            return (
              <Link key={e.id} href={`/dashboard/events/${e.id}`} className="card block p-4 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-base leading-snug min-w-0 break-words">{e.title}</p>
                  <StatusChip status={e.status} />
                </div>
                <p className="text-xs text-ink-muted mt-1 truncate">{formatDateShort(e.startsAt, e.timezone)} - {e.venue}</p>
                <p className="text-xs font-mono font-semibold mt-2">{sold} / {total} registered</p>
              </Link>
            );
          })}
        </div>
        <div className="card overflow-hidden hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left">
              <tr>
                <th className="px-5 py-4">Event</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Tickets</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const sold = e.ticketTypes.reduce((s, t) => s + t.sold, 0);
                const total = e.ticketTypes.reduce((s, t) => s + t.quantity, 0);
                return (
                  <tr key={e.id} className="border-t border-border hover:bg-surface-2/50">
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/events/${e.id}`} className="font-medium hover:text-royal-2">
                        {e.title}
                      </Link>
                      <p className="text-xs text-ink-muted mt-0.5">{e.venue}</p>
                    </td>
                    <td className="px-5 py-4 text-ink-muted">{formatDateShort(e.startsAt, e.timezone)}</td>
                    <td className="px-5 py-4"><StatusChip status={e.status} /></td>
                    <td className="px-5 py-4 text-right font-mono text-xs">{sold} / {total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}

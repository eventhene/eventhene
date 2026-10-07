import Link from "next/link";
import { db } from "@/lib/db";
import { StatusChip } from "@/components/dashboard/StatusChip";

export const dynamic = "force-dynamic";

export default async function AllEventsAdmin() {
  const events = await db.event.findMany({
    include: { organizer: true, _count: { select: { tickets: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Admin</p>
        <h1 className="h-section mt-1">All events</h1>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="px-5 py-4">Event</th>
              <th className="px-5 py-4">Organizer</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Tickets</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-border hover:bg-surface-2/50">
                <td className="px-5 py-4">
                  <Link href={`/events/${e.slug}`} className="font-medium hover:text-royal-2">{e.title}</Link>
                  <p className="text-xs text-ink-muted mt-0.5">{new Date(e.startsAt).toLocaleString()}</p>
                </td>
                <td className="px-5 py-4 text-ink-muted">{e.organizer.displayName}</td>
                <td className="px-5 py-4"><StatusChip status={e.status} /></td>
                <td className="px-5 py-4 text-right font-mono text-xs">{e._count.tickets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

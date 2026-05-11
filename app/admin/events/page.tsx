import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AllEventsAdmin() {
  const events = await db.event.findMany({
    include: { organizer: true, _count: { select: { tickets: true } } },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="h-display text-3xl mb-6">All events</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Organizer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Tickets</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link href={`/events/${e.slug}`} className="font-medium hover:underline">{e.title}</Link>
                  <p className="text-xs text-ink-muted">{new Date(e.startsAt).toLocaleString()}</p>
                </td>
                <td className="px-4 py-3 text-ink-muted">{e.organizer.displayName}</td>
                <td className="px-4 py-3"><span className="chip-muted">{e.status.replace("_", " ")}</span></td>
                <td className="px-4 py-3 text-right">{e._count.tickets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

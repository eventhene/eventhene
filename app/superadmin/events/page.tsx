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
        <p className="text-sm text-white/40">Admin</p>
        <h1 className="h-section mt-1 text-white">All events</h1>
      </div>
      <div className="md:hidden space-y-3">
        {events.map((e) => (
          <div key={e.id} className="card-glass rounded-2xl p-4 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/events/${e.slug}`} className="font-semibold text-white leading-snug min-w-0 break-words">{e.title}</Link>
              <StatusChip status={e.status} />
            </div>
            <p className="text-xs text-white/40 mt-1">{e.organizer.displayName} - {new Date(e.startsAt).toLocaleDateString()}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-mono text-white/60">{e._count.tickets} registered</span>
              <Link href={`/dashboard/events/${e.id}`} className="btn-gold btn-sm">Open as admin</Link>
            </div>
          </div>
        ))}
      </div>
      <div className="card-glass rounded-2xl overflow-hidden overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-white/60">
            <tr>
              <th className="px-5 py-4">Event</th>
              <th className="px-5 py-4">Organizer</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Tickets</th>
              <th className="px-5 py-4 text-right">Manage</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-5 py-4">
                  <Link href={`/events/${e.slug}`} className="font-medium text-white hover:text-accent">{e.title}</Link>
                  <p className="text-xs text-white/40 mt-0.5">{new Date(e.startsAt).toLocaleString()}</p>
                </td>
                <td className="px-5 py-4 text-white/50">{e.organizer.displayName}</td>
                <td className="px-5 py-4"><StatusChip status={e.status} /></td>
                <td className="px-5 py-4 text-right font-mono text-xs">{e._count.tickets}</td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/dashboard/events/${e.id}`} className="text-xs font-semibold text-accent hover:underline">
                    Open as admin
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

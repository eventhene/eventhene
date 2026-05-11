import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OrganizersAdmin() {
  const organizers = await db.organizer.findMany({
    include: { user: true, _count: { select: { events: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="h-display text-3xl mb-6">Organizers</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="px-4 py-3">Organizer</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3 text-right">Events</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {organizers.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{o.displayName}</td>
                <td className="px-4 py-3 text-ink-muted">{o.user.email}</td>
                <td className="px-4 py-3">{o.user.country ?? "—"}</td>
                <td className="px-4 py-3 text-right">{o._count.events}</td>
                <td className="px-4 py-3">
                  {o.isSuspended ? <span className="chip-danger">Suspended</span> : <span className="chip-success">Active</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OrganizersAdmin() {
  const organizers = await db.organizer.findMany({
    include: { user: true, _count: { select: { events: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Admin</p>
        <h1 className="h-section mt-1">Organizers</h1>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="px-5 py-4">Organizer</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Country</th>
              <th className="px-5 py-4 text-right">Events</th>
              <th className="px-5 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {organizers.map((o) => (
              <tr key={o.id} className="border-t border-border hover:bg-surface-2/50">
                <td className="px-5 py-4 font-medium">{o.displayName}</td>
                <td className="px-5 py-4 text-ink-muted">{o.user.email}</td>
                <td className="px-5 py-4">{o.user.country ?? "-"}</td>
                <td className="px-5 py-4 text-right">{o._count.events}</td>
                <td className="px-5 py-4">
                  {o.isSuspended ? <span className="chip-crimson">Suspended</span> : <span className="chip-emerald">Active</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

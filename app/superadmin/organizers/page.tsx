import { db } from "@/lib/db";
import { DeleteOrganizerButton } from "@/components/admin/DeleteOrganizerButton";

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
        <p className="text-sm text-white/40">Admin</p>
        <h1 className="h-section mt-1 text-white">Organizers</h1>
        <p className="text-sm text-white/40 mt-1">{organizers.length} total</p>
      </div>

      {organizers.length === 0 ? (
        <div className="card-glass rounded-2xl p-10 text-center text-white/40">
          No organizers yet.
        </div>
      ) : (
        <div className="space-y-2">
          {organizers.map((o) => (
            <div
              key={o.id}
              className="card-glass rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                  {o.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{o.displayName}</p>
                  <p className="text-xs text-white/40 truncate">{o.user.email}</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-6 text-sm shrink-0">
                <span className="text-white/40">{o.user.country ?? "-"}</span>
                <span className="text-white/60">{o._count.events} event{o._count.events !== 1 ? "s" : ""}</span>
                {o.isSuspended ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-400">Suspended</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">Active</span>
                )}
              </div>

              <DeleteOrganizerButton
                organizerId={o.id}
                displayName={o.displayName}
                eventCount={o._count.events}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

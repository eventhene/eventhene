import { db } from "@/lib/db";
import { FreeEventCard } from "@/components/admin/FreeEventCard";

export const dynamic = "force-dynamic";

export default async function FreeEventQueue() {
  const events = await db.event.findMany({
    where: { status: { in: ["PENDING_APPROVAL", "EDITS_REQUESTED"] } },
    include: { organizer: true, ticketTypes: true },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="h-display text-3xl mb-2">Free event queue</h1>
      <p className="text-ink-muted text-sm mb-6">
        {events.length} event{events.length === 1 ? "" : "s"} awaiting review.
      </p>
      {events.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted">All clear. Long live the king. ♛</div>
      ) : (
        <div className="space-y-4">
          {events.map((e) => (
            <FreeEventCard key={e.id} event={e as any} />
          ))}
        </div>
      )}
    </div>
  );
}

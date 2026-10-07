import { CheckCircle } from "lucide-react";
import { db } from "@/lib/db";
import { FreeEventCard } from "@/components/admin/FreeEventCard";

export const dynamic = "force-dynamic";

export default async function FreeEventQueue() {
  const events = await db.event.findMany({
    where: { status: { in: ["PENDING_APPROVAL", "EDITS_REQUESTED"] } },
    include: { organizer: true, ticketTypes: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Admin · Moderation</p>
        <h1 className="h-section mt-1">Free event queue</h1>
        <p className="text-ink-muted mt-2">
          {events.length} event{events.length === 1 ? "" : "s"} awaiting review.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="card p-16 text-center">
          <CheckCircle className="w-12 h-12 text-emerald mx-auto mb-4" />
          <p className="text-ink-muted font-semibold">All clear. No events pending review.</p>
        </div>
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

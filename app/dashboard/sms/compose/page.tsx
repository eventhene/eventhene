import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { BulkSmsComposer } from "@/components/dashboard/BulkSmsComposer";

export const metadata = { title: "Compose SMS" };
export const dynamic = "force-dynamic";

export default async function ComposeSmsPage() {
  const { organizer } = await requireOrganizer();

  const events = await db.event.findMany({
    where: { organizerId: organizer.id },
    orderBy: { startsAt: "desc" },
    take: 50,
    include: {
      ticketTypes: { select: { id: true, name: true } },
      _count: { select: { tickets: true } },
    },
  });

  const lists = await db.contactList.findMany({
    where: { organizerId: organizer.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { contacts: true } } },
  });

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <p className="text-sm text-white/40">Messaging</p>
        <h1 className="h-section mt-1 text-white">Compose SMS</h1>
      </div>
      <BulkSmsComposer
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          ticketTypes: e.ticketTypes,
          attendeeCount: e._count.tickets,
        }))}
        initialLists={lists.map((l) => ({ id: l.id, name: l.name, count: l._count.contacts }))}
      />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";
import { CreateEventForm, type InitialEvent } from "@/components/dashboard/CreateEventForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Edit event" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  await requireEventOwner(params.id);
  const event = await db.event.findUnique({
    where: { id: params.id },
    include: {
      ticketTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      attendeeFields: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!event) notFound();

  const orderCount = await db.order.count({ where: { eventId: event.id } });

  const initial: InitialEvent = {
    title: event.title,
    description: event.description,
    category: event.category,
    venue: event.venue,
    city: event.city,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    bookingOpensAt: event.bookingOpensAt.toISOString(),
    bookingClosesAt: event.bookingClosesAt.toISOString(),
    flyerUrl: event.flyerUrl,
    type: event.type as "PAID" | "FREE",
    buyerPaysFee: event.buyerPaysFee,
    welcomeSms: event.welcomeSms,
    collectBuyerInfo: event.collectBuyerInfo,
    ticketTypes: event.ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      priceMinor: t.priceMinor,
      quantity: t.quantity,
      notes: t.notes,
      sold: t.sold,
    })),
    attendeeFields: event.attendeeFields.map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      required: f.required,
      options: f.options,
    })),
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href={`/dashboard/events/${event.id}`} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-white transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to event
        </Link>
        <h1 className="h-section mt-3">Edit event</h1>
        <p className="text-ink-muted mt-2">Fix a typo, change the venue, adjust tickets. Your public link stays the same.</p>
      </div>
      <CreateEventForm mode="edit" eventId={event.id} initial={initial} hasOrders={orderCount > 0} />
    </div>
  );
}

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { tt?: string | string[] };
}) {
  const event = await db.event.findUnique({
    where: { slug: params.slug },
    include: {
      ticketTypes: { where: { isActive: true } },
      attendeeFields: { orderBy: { sortOrder: "asc" } }
    }
  });
  if (!event || event.status !== "PUBLISHED") notFound();

  const raw = Array.isArray(searchParams.tt) ? searchParams.tt : searchParams.tt ? [searchParams.tt] : [];
  const items = raw
    .map((s) => {
      const [id, q] = s.split(":");
      const tt = event.ticketTypes.find((t) => t.id === id);
      if (!tt) return null;
      const quantity = Math.max(1, Math.min(10, parseInt(q, 10) || 1));
      return { ticketType: tt, quantity };
    })
    .filter(Boolean) as { ticketType: any; quantity: number }[];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p>No tickets selected.</p>
        <a href={`/events/${event.slug}`} className="btn-primary mt-4 inline-flex">Back to event</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="h-display text-3xl mb-1">Checkout</h1>
      <p className="text-ink-muted mb-6">{event.title}</p>
      <CheckoutForm event={event as any} items={items as any} />
    </div>
  );
}

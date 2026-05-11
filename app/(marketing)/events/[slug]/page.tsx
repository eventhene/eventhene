import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMinorAmount, formatDate } from "@/lib/utils";
import { ShareRow } from "@/components/events/ShareRow";
import { TicketSelector } from "@/components/events/TicketSelector";
import type { Metadata } from "next";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await db.event.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!event) return {};
  const desc = event.description.slice(0, 160);
  return {
    title: event.title,
    description: desc,
    openGraph: {
      title: event.title,
      description: desc,
      images: event.flyerUrl ? [{ url: event.flyerUrl }] : []
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: desc,
      images: event.flyerUrl ? [event.flyerUrl] : []
    }
  };
}

export default async function EventPage({ params }: { params: { slug: string } }) {
  const event = await db.event.findUnique({
    where: { slug: params.slug },
    include: {
      ticketTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      attendeeFields: { orderBy: { sortOrder: "asc" } },
      organizer: true,
      reviews: { where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 5 }
    }
  });

  if (!event || (event.status !== "PUBLISHED" && event.status !== "ENDED")) {
    notFound();
  }

  const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.slug}`;
  const isPast = event.endsAt < new Date();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-[1.05fr,1fr] gap-10">
      {/* LEFT: flyer + share */}
      <div>
        <div className="aspect-[4/5] rounded-2xl bg-surface-2 overflow-hidden mb-4">
          {event.flyerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-royal-gradient flex items-center justify-center text-white">
              <div className="text-center p-8">
                <p className="text-accent text-sm tracking-[0.3em] mb-2">EVENT • HENE ♛</p>
                <h2 className="font-display text-4xl">{event.title}</h2>
              </div>
            </div>
          )}
        </div>
        <ShareRow url={eventUrl} title={event.title} />
      </div>

      {/* RIGHT: details + ticket selector */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="chip-muted">{event.category}</span>
          {event.type === "FREE" && <span className="chip-info">Free event</span>}
          {isPast && <span className="chip-warning">Past event</span>}
        </div>
        <h1 className="h-display text-4xl md:text-5xl mb-3">{event.title}</h1>
        <div className="space-y-1.5 text-sm mb-6">
          <p><span className="text-ink-muted">When:</span> <strong>{formatDate(event.startsAt, event.timezone)}</strong></p>
          <p><span className="text-ink-muted">Where:</span> <strong>{event.venue}</strong></p>
          <p><span className="text-ink-muted">Organizer:</span> <strong>{event.organizer.displayName}</strong></p>
        </div>

        <article className="prose-eh whitespace-pre-wrap mb-8">{event.description}</article>

        {!isPast && event.ticketTypes.length > 0 && (
          <div className="card p-6 sticky top-20">
            <h2 className="h-display text-2xl mb-4">
              {event.type === "FREE" ? "Reserve your seat" : "Get tickets"}
            </h2>
            <TicketSelector event={event as any} />
          </div>
        )}

        {isPast && (
          <div className="card p-6 text-center text-ink-muted">
            This event has ended.
          </div>
        )}

        {event.reviews.length > 0 && (
          <div className="mt-10">
            <h3 className="h-display text-xl mb-3">Reviews</h3>
            <div className="space-y-3">
              {event.reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <p className="font-medium">{r.authorName} · {"★".repeat(r.rating)}</p>
                  {r.body && <p className="text-sm text-ink-muted mt-1">{r.body}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-ink-muted mt-8">
          <Link href="/contact" className="hover:text-ink">Report this event</Link>
        </p>
      </div>
    </div>
  );
}

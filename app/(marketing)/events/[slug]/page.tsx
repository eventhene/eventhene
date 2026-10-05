import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ShareRow } from "@/components/events/ShareRow";
import { TicketSelector } from "@/components/events/TicketSelector";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
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
      images: event.flyerUrl ? [{ url: event.flyerUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: desc,
      images: event.flyerUrl ? [event.flyerUrl] : [],
    },
  };
}

export default async function EventPage({ params }: { params: { slug: string } }) {
  const event = await db.event.findUnique({
    where: { slug: params.slug },
    include: {
      ticketTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      attendeeFields: { orderBy: { sortOrder: "asc" } },
      organizer: true,
      reviews: { where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!event || (event.status !== "PUBLISHED" && event.status !== "ENDED")) {
    notFound();
  }

  const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/events/${event.slug}`;
  const isPast = event.endsAt < new Date();

  return (
    <>
      {/* Floating backdrop with flyer blur */}
      {event.flyerUrl && (
        <div className="absolute inset-x-0 top-0 h-[700px] overflow-hidden -z-0" aria-hidden>
          <img src={event.flyerUrl} alt="" className="w-full h-full object-cover opacity-30 blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/70 to-bg" />
        </div>
      )}

      <div className="relative section py-16 grid md:grid-cols-[1.1fr,1fr] gap-14 items-start">
        <div className="space-y-4">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg">
            {event.flyerUrl ? (
              <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-aurora flex items-center justify-center text-white p-10 text-center">
                <div>
                  <p className="text-xs text-accent uppercase tracking-[0.35em] mb-3">Event · Hene ♛</p>
                  <h2 className="font-display text-4xl">{event.title}</h2>
                </div>
              </div>
            )}
          </div>
          <ShareRow url={eventUrl} title={event.title} />
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="chip-outline">{event.category}</span>
            {event.type === "FREE" && <span className="chip-gold">Free registration</span>}
            {isPast && <span className="chip-outline">Past event</span>}
          </div>
          <h1 className="h-hero text-balance">{event.title}</h1>

          <div className="space-y-1.5 text-base">
            <p><span className="text-ink-muted">When:</span> <strong>{formatDate(event.startsAt, event.timezone)}</strong></p>
            <p><span className="text-ink-muted">Where:</span> <strong>{event.venue}</strong></p>
            <p><span className="text-ink-muted">By:</span> <strong>{event.organizer.displayName}</strong></p>
          </div>

          <div className="prose-eh whitespace-pre-wrap text-ink leading-relaxed text-pretty">
            {event.description}
          </div>

          {!isPast && event.ticketTypes.length > 0 && (
            <div className="card p-7 sticky top-24 shadow-lg">
              <h2 className="font-display text-2xl mb-4">
                {event.type === "FREE" ? "Reserve your seat" : "Get tickets"}
              </h2>
              <TicketSelector event={event as any} />
            </div>
          )}

          {isPast && (
            <div className="card p-10 text-center text-ink-muted">This event has ended.</div>
          )}

          {event.reviews.length > 0 && (
            <div className="pt-10">
              <h3 className="h-card mb-4">Reviews</h3>
              <div className="space-y-3">
                {event.reviews.map((r) => (
                  <div key={r.id} className="card p-5">
                    <p className="font-medium">{r.authorName} · <span className="text-accent">{"★".repeat(r.rating)}</span></p>
                    {r.body && <p className="text-sm text-ink-muted mt-1">{r.body}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-ink-muted pt-4">
            <Link href="/contact" className="hover:text-ink">Report this event</Link>
          </p>
        </div>
      </div>
    </>
  );
}

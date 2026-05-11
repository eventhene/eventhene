export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose-eh">
      <h1 className="h-display text-5xl mb-4">About EventHene</h1>
      <p className="text-lg text-ink-muted">
        "Hene" means king in Twi. EventHene is the event platform that treats every organizer like royalty — and
        every attendee to a ticket worth keeping.
      </p>
      <h2>Why we built this</h2>
      <p>
        Ghana's event scene is the most alive it's ever been — concerts, weddings, conferences, church programs,
        comedy shows, parties. But organizers still juggle spreadsheets, WhatsApp orders, manual seat counts,
        and bouncers turning people away with no clear list. EventHene gives organizers one clean platform to
        sell, register, scan, and track — and gives attendees a ticket they're proud to show.
      </p>
      <h2>Built for Africa. Ready for the world.</h2>
      <p>
        Mobile Money first. Multi-currency. Local pricing. Designed for organizers from Accra to Lagos to London.
      </p>
    </div>
  );
}

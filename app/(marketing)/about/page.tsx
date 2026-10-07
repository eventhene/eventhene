export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="section max-w-3xl py-16 prose-eh">
      <p className="chip-outline mb-5">About</p>
      <h1 className="h-section mb-6">An operating system for African events.</h1>
      <p className="text-lg text-ink-muted text-pretty">
        "Hene" means king in Twi. EventHene is the event platform that treats every organizer like royalty, and every attendee to a ticket worth keeping.
      </p>

      <h2>Why we built this</h2>
      <p>
        Ghana's event scene is the most alive it's ever been. Concerts, weddings, conferences, church programs, comedy shows, parties. But organizers still juggle spreadsheets, WhatsApp orders, manual seat counts, and bouncers turning people away with no clear list. EventHene gives organizers one clean platform to register, scan, broadcast SMS, and track. Attendees get tickets they're proud to show.
      </p>

      <h2>Built for Africa. Ready for the world.</h2>
      <p>
        Mobile Money first. Multi-currency. Local SMS delivery. Designed for organizers from Ghana to Nigeria to the world.
      </p>
    </div>
  );
}

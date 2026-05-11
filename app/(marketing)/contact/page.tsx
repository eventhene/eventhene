export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="h-display text-5xl mb-4">Contact us</h1>
      <p className="text-ink-muted mb-8">
        Need help with an event, a ticket, or want to partner with EventHene? Send us a note.
      </p>
      <div className="card p-6 space-y-3">
        <div>
          <p className="text-xs text-ink-muted uppercase tracking-wide">Support</p>
          <p>support@eventhene.com</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted uppercase tracking-wide">Partnerships</p>
          <p>partners@eventhene.com</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted uppercase tracking-wide">Press</p>
          <p>press@eventhene.com</p>
        </div>
      </div>
    </div>
  );
}

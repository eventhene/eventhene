export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="section max-w-2xl py-16">
      <p className="chip-outline mb-5">Contact</p>
      <h1 className="h-section mb-4">Say hi.</h1>
      <p className="text-ink-muted mb-10 text-lg">
        Need help with an event, a ticket, or want to partner with EventHene? Send us a note.
      </p>
      <div className="card p-7 space-y-5">
        <Row label="Support" value="support@eventhene.com" />
        <Row label="Partnerships" value="partners@eventhene.com" />
        <Row label="Press" value="press@eventhene.com" />
        <Row label="Office" value="Accra, Ghana" />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-xs text-ink-muted uppercase tracking-widest">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

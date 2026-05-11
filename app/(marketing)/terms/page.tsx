export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose-eh">
      <h1 className="h-display text-4xl mb-4">Terms of Service</h1>
      <p className="text-sm text-ink-muted">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Acceptance</h2>
      <p>By using EventHene you agree to these terms. If you don't, please don't use the platform.</p>

      <h2>2. Accounts</h2>
      <p>You must provide accurate info. You're responsible for activity under your account.</p>

      <h2>3. Organizers</h2>
      <p>
        Organizers are responsible for delivering the event as advertised, complying with local laws, paying
        applicable taxes, and honoring refund/cancellation obligations. EventHene charges 5% per paid ticket
        (plus payment processor fees, which are passed through).
      </p>

      <h2>4. Free events</h2>
      <p>Free events are reviewed by EventHene before publishing to keep the platform trustworthy.</p>

      <h2>5. Tickets & QR codes</h2>
      <p>
        Tickets are non-transferable in v1. Sharing QR codes is prohibited. One ticket = one entry.
        EventHene logs scans and may invalidate tickets used fraudulently.
      </p>

      <h2>6. Refunds</h2>
      <p>
        Refunds for cancelled events are processed by the organizer. EventHene can facilitate refunds via the
        payment processor. Platform and processor fees may not be refundable.
      </p>

      <h2>7. Prohibited content</h2>
      <p>No illegal, hateful, fraudulent, or deceptive events. EventHene may remove events at its discretion.</p>

      <h2>8. Limitation of liability</h2>
      <p>EventHene is a platform — we facilitate ticketing but don't run the events themselves.</p>

      <h2>9. Changes</h2>
      <p>We may update these terms; we'll notify users of material changes.</p>
    </div>
  );
}

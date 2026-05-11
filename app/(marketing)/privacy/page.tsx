export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose-eh">
      <h1 className="h-display text-4xl mb-4">Privacy Policy</h1>
      <p className="text-sm text-ink-muted">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>What we collect</h2>
      <p>Account info (email, phone), event details, attendee details organizers ask you to provide, payment metadata (we don't store full card numbers — Paystack/Stripe do).</p>

      <h2>How we use it</h2>
      <p>To run your event, send tickets, process payments, prevent fraud, and improve the platform.</p>

      <h2>Who sees it</h2>
      <p>Event organizers see their own attendees' info. EventHene staff can access data to provide support. We share data with payment, email, and storage providers strictly to operate the service.</p>

      <h2>Your rights</h2>
      <p>You can export or delete your account data from <code>/me/settings</code>. We comply with Ghana's Data Protection Act and GDPR principles.</p>

      <h2>Security</h2>
      <p>HTTPS everywhere. Encrypted at rest. QR tokens signed with HMAC. Rate-limited APIs.</p>
    </div>
  );
}

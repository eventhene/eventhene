import { brandEmail } from "@/lib/app-url";
export const metadata = { title: "Refund Policy" };

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose-eh">
      <h1 className="h-display text-4xl mb-4">Refund Policy</h1>
      <p>
        Refunds are issued at the organizer's discretion. If an event is cancelled, organizers are expected to issue full refunds.
        EventHene can facilitate refunds via the original payment method. Platform and payment processor fees may not be refundable.
      </p>
      <p>For refund requests, please contact the organizer first, then email {brandEmail("support")} if unresolved.</p>
    </div>
  );
}

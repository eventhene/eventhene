import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [pendingFree, organizers, openInquiries, openSupport, totalEvents] = await Promise.all([
    db.event.count({ where: { status: "PENDING_APPROVAL" } }),
    db.organizer.count(),
    db.serviceInquiry.count({ where: { status: "OPEN" } }),
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.event.count()
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="h-display text-3xl mb-6">Admin overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Kpi label="Pending free events" value={pendingFree.toString()} />
        <Kpi label="Total events" value={totalEvents.toString()} />
        <Kpi label="Organizers" value={organizers.toString()} />
        <Kpi label="Open inquiries" value={openInquiries.toString()} />
      </div>
      <div className="card p-6">
        <h2 className="h-display text-xl mb-2">Next steps</h2>
        <ul className="text-sm space-y-1 text-ink-muted">
          <li>• Review free events in the queue</li>
          <li>• Respond to {openSupport} open support requests</li>
          <li>• Follow up on {openInquiries} service inquiries</li>
        </ul>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="font-display text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

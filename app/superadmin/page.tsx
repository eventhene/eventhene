import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [pendingFree, organizers, openInquiries, openSupport, totalEvents, usersCount, smsCount] = await Promise.all([
    db.event.count({ where: { status: "PENDING_APPROVAL" } }),
    db.organizer.count(),
    db.serviceInquiry.count({ where: { status: "OPEN" } }),
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.event.count(),
    db.user.count(),
    db.smsCampaign.count(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-ink-muted">Platform health</p>
        <h1 className="h-section mt-1">Admin.</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Pending free events" value={pendingFree.toString()} />
        <Kpi label="Total events" value={totalEvents.toString()} />
        <Kpi label="Organizers" value={organizers.toString()} />
        <Kpi label="Users" value={usersCount.toString()} />
        <Kpi label="Open inquiries" value={openInquiries.toString()} />
        <Kpi label="Open support" value={openSupport.toString()} />
        <Kpi label="SMS campaigns" value={smsCount.toString()} />
      </div>

      <div className="card p-6">
        <h2 className="h-card mb-3">Today's checklist</h2>
        <ul className="text-sm space-y-2 text-ink-muted">
          <li>Review {pendingFree} pending free event{pendingFree === 1 ? "" : "s"}.</li>
          <li>Respond to {openSupport} open support ticket{openSupport === 1 ? "" : "s"}.</li>
          <li>Follow up on {openInquiries} service inquir{openInquiries === 1 ? "y" : "ies"}.</li>
        </ul>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-[11px] uppercase tracking-widest text-ink-muted">{label}</p>
      <p className="font-display text-3xl mt-2">{value}</p>
    </div>
  );
}

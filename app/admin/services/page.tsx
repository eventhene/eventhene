import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ServicesAdminPage() {
  const inquiries = await db.serviceInquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Admin</p>
        <h1 className="h-section mt-1">Service inquiries</h1>
      </div>
      <div className="space-y-3">
        {inquiries.length === 0 && <p className="text-ink-muted text-sm">No inquiries yet.</p>}
        {inquiries.map((i) => (
          <div key={i.id} className="card p-5">
            <div className="flex justify-between mb-1 gap-3">
              <p className="font-medium">{i.contactName} <span className="text-ink-muted">·</span> {i.serviceType}</p>
              <span className="chip-outline">{i.status}</span>
            </div>
            <p className="text-sm text-ink-muted">{i.contactEmail} · {i.contactPhone ?? "no phone"}</p>
            <p className="text-sm mt-3 whitespace-pre-wrap">{i.message}</p>
            <p className="text-xs text-ink-muted mt-3">{new Date(i.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { db } from "@/lib/db";
import { SERVICE_LABELS } from "@/lib/service-catalog";

export const dynamic = "force-dynamic";

export default async function ServicesAdminPage() {
  const inquiries = await db.serviceInquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/40">Admin</p>
        <h1 className="h-section mt-1 text-white">Service inquiries</h1>
      </div>
      <div className="space-y-3">
        {inquiries.length === 0 && <p className="text-white/40 text-sm">No inquiries yet.</p>}
        {inquiries.map((i) => (
          <div key={i.id} className="card-glass rounded-2xl p-5">
            <div className="flex justify-between mb-1 gap-3">
              <p className="font-medium text-white">{i.contactName} <span className="text-white/30">-</span> {SERVICE_LABELS[i.serviceType] ?? i.serviceType}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 uppercase font-bold h-fit">{i.status}</span>
            </div>
            <p className="text-sm text-white/50">{i.contactEmail} - {i.contactPhone ?? "no phone"}</p>
            <p className="text-sm mt-3 whitespace-pre-wrap text-white/80">{i.message}</p>
            <p className="text-xs text-white/30 mt-3">{new Date(i.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

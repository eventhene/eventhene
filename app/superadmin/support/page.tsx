import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SupportAdminPage() {
  const tickets = await db.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Admin</p>
        <h1 className="h-section mt-1">Support</h1>
      </div>
      <div className="space-y-3">
        {tickets.length === 0 && <p className="text-ink-muted text-sm">All clear.</p>}
        {tickets.map((t) => (
          <div key={t.id} className="card p-5">
            <div className="flex justify-between mb-1 gap-3">
              <p className="font-medium">{t.subject}</p>
              <span className="chip-outline">{t.status}</span>
            </div>
            <p className="text-sm text-ink-muted">{t.email}</p>
            <p className="text-sm mt-3 whitespace-pre-wrap">{t.body}</p>
            <p className="text-xs text-ink-muted mt-3">{new Date(t.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

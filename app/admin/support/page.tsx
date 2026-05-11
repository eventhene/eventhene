import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SupportAdminPage() {
  const tickets = await db.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="h-display text-3xl mb-6">Support tickets</h1>
      <div className="space-y-3">
        {tickets.length === 0 && <p className="text-ink-muted text-sm">All clear.</p>}
        {tickets.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex justify-between mb-1">
              <p className="font-medium">{t.subject}</p>
              <span className="chip-muted">{t.status}</span>
            </div>
            <p className="text-sm text-ink-muted">{t.email}</p>
            <p className="text-sm mt-2 whitespace-pre-wrap">{t.body}</p>
            <p className="text-xs text-ink-muted mt-2">{new Date(t.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

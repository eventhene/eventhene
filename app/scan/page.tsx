import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";

export const metadata = { title: "Scan tickets" };
export const dynamic = "force-dynamic";

export default async function ScanPicker() {
  const user = await requireUser();

  // Events the user can scan: own events + events they're staff for + (admin) any
  const where: any = isAdmin(user.role)
    ? { status: { in: ["PUBLISHED", "ENDED"] } }
    : {
        OR: [
          { organizer: { userId: user.id } },
          { staff: { some: { userId: user.id } } }
        ]
      };

  const events = await db.event.findMany({
    where,
    orderBy: { startsAt: "asc" },
    take: 50
  });

  return (
    <div className="min-h-screen bg-bg p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <h1 className="h-display text-3xl mb-2">Scan tickets</h1>
        <p className="text-ink-muted mb-6 text-sm">Choose an event to start scanning.</p>

        {events.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-ink-muted">You don't have any events to scan yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <Link key={e.id} href={`/scan/${e.id}`} className="card p-4 flex items-center justify-between hover:bg-surface-2">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-ink-muted">{e.venue}</p>
                </div>
                <span className="text-primary">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

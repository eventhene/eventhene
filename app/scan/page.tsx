import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserOrRedirect, isAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { formatDateShort } from "@/lib/utils";

export const metadata = { title: "Scan tickets" };
export const dynamic = "force-dynamic";

export default async function ScanPicker() {
  const user = await requireUserOrRedirect("/scan");

  const where: any = isAdmin(user.role)
    ? { status: { in: ["PUBLISHED", "ENDED"] } }
    : {
        OR: [
          { organizer: { userId: user.id } },
          { staff: { some: { userId: user.id } } },
        ],
      };

  const events = await db.event.findMany({
    where,
    orderBy: { startsAt: "asc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-canvas text-white p-5 md:p-10">
      <div className="max-w-md mx-auto">
        <Logo invert size="sm" />
        <h1 className="h-section mt-10 text-white">Scan tickets.</h1>
        <p className="text-white/60 mt-2 mb-10 text-sm">Choose an event to start scanning.</p>

        {events.length === 0 ? (
          <div className="card-dark p-10 text-center text-white/60">
            You don't have any events to scan yet.
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/scan/${e.id}`}
                className="card-dark p-5 flex items-center justify-between hover:bg-white/5 transition group"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{e.title}</p>
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    {formatDateShort(e.startsAt, e.timezone)} · {e.venue}
                  </p>
                </div>
                <span className="text-accent group-hover:translate-x-1 transition">→</span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 flex gap-2 text-sm">
          <Link href="/dashboard" className="btn-ghost-dark btn-md">Dashboard</Link>
          <Link href="/api/auth/sign-out" className="btn-ghost-dark btn-md">Sign out</Link>
        </div>
      </div>
    </div>
  );
}

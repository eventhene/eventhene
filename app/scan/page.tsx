import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserOrRedirect, isAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import { formatDateShort } from "@/lib/utils";

export const metadata = { title: "Scan tickets" };
export const dynamic = "force-dynamic";

export default async function ScanPicker() {
  const user = await requireUserOrRedirect("/scan");

  const memberships = isAdmin(user.role)
    ? []
    : await db.teamMember.findMany({ where: { userId: user.id } });
  const scannerEventIds = memberships
    .filter((m) => m.role === "SCANNER" && m.eventIds.length > 0)
    .flatMap((m) => m.eventIds);
  const scannerOrgIds = memberships
    .filter((m) => m.role === "SCANNER" && m.eventIds.length === 0)
    .map((m) => m.organizerId);
  const managerOrgIds = memberships.filter((m) => m.role === "MANAGER").map((m) => m.organizerId);

  const where: any = isAdmin(user.role)
    ? { status: { in: ["PUBLISHED", "ENDED"] } }
    : {
        OR: [
          { organizer: { userId: user.id } },
          { staff: { some: { userId: user.id } } },
          { organizerId: { in: [...managerOrgIds, ...scannerOrgIds] } },
          { id: { in: scannerEventIds } },
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
        <Logo variant="icon" size="md" />
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
          <SignOutButton className="btn-ghost-dark btn-md" showIcon={false} />
        </div>
      </div>
    </div>
  );
}

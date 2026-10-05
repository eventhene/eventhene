import Link from "next/link";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUserOrRedirect("/dashboard/settings");
  const organizer = await db.organizer.findUnique({ where: { userId: user.id } });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Account</p>
        <h1 className="h-section mt-1">Settings</h1>
      </div>
      <div className="card p-6 space-y-3">
        <Row label="Name" value={user.fullName ?? "-"} />
        <Row label="Email" value={user.email} />
        <Row label="Role" value={user.role} />
        {organizer && <Row label="Organizer" value={organizer.displayName} />}
        {organizer && <Row label="Public URL" value={`/@${organizer.slug}`} mono />}
      </div>
      <Link href="/api/auth/sign-out" className="btn-ghost btn-md">Sign out</Link>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

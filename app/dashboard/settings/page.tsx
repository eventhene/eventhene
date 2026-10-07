import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { SignOutButton } from "@/components/SignOutButton";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUserOrRedirect("/dashboard/settings");
  const organizer = await db.organizer.findUnique({ where: { userId: user.id } });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-white/40">Account</p>
        <h1 className="h-section mt-1 text-white">Settings</h1>
      </div>

      <SettingsForm
        user={{
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        }}
        organizer={organizer ? {
          id: organizer.id,
          displayName: organizer.displayName,
          slug: organizer.slug,
          bio: organizer.bio,
          website: organizer.website,
        } : null}
      />

      <hr className="border-white/10" />

      <SignOutButton className="btn-ghost btn-md text-white/40 hover:text-white/70" showIcon={false} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { requireUserOrRedirect, resolveOrganizerAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { SignOutButton } from "@/components/SignOutButton";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { PayoutForm } from "@/components/settings/PayoutForm";
import { AccountVerification } from "@/components/settings/AccountVerification";
import { Banknote } from "lucide-react";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUserOrRedirect("/dashboard/settings");
  const ctx = await resolveOrganizerAccess(user.id);
  // Settings (payouts, profile) belong to the owner: switch to your own organizer to open them.
  if (!ctx || ctx.access !== "OWNER") redirect("/dashboard");
  const organizer = ctx.organizer;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-white/40">Account</p>
        <h1 className="h-section mt-1 text-white">Settings</h1>
      </div>

      <AccountVerification
        phone={user.phone}
        phoneVerified={user.phoneVerified}
        email={user.email}
        emailVerified={user.emailVerified}
      />

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

      {organizer && (
        <>
          <hr className="border-white/10" />
          <section className="card-glass rounded-2xl p-7 space-y-5">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-accent" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Payout details</h2>
            </div>
            <p className="text-white/40 text-sm">
              Add your bank account to receive money from paid event ticket sales.
              Revenue settles directly to your bank minus the 8% platform fee.
            </p>
            <PayoutForm
              currentBank={organizer.bankName}
              currentAccount={organizer.accountNumber}
              currentName={organizer.accountName}
              isVerified={organizer.payoutVerified}
              subaccount={organizer.paystackSubacct}
            />
          </section>
        </>
      )}

      <hr className="border-white/10" />

      <SignOutButton className="btn-ghost btn-md text-white/40 hover:text-white/70" showIcon={false} />
    </div>
  );
}

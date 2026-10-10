import Link from "next/link";
import { requireUserOrRedirect, isAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { AccountVerification } from "@/components/settings/AccountVerification";
import { SignOutButton } from "@/components/SignOutButton";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "My account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUserOrRedirect("/account");
  const back = isAdmin(user.role) ? { href: "/superadmin", label: "Back to admin" } : { href: "/dashboard", label: "Back to dashboard" };

  return (
    <div className="min-h-screen bg-[#0a0a0c] px-5 py-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <Logo variant="icon" size="md" />
          <Link href={back.href} className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {back.label}
          </Link>
        </div>

        <div>
          <p className="text-sm text-white/40">{user.fullName || user.email}</p>
          <h1 className="h-section mt-1 text-white">My account</h1>
        </div>

        <AccountVerification phone={user.phone} phoneVerified={user.phoneVerified} email={user.email} emailVerified={user.emailVerified} />
        <SecuritySettings email={user.email} emailVerified={user.emailVerified} />

        <SignOutButton className="btn-ghost btn-md text-white/40 hover:text-white/70" showIcon={false} />
      </div>
    </div>
  );
}

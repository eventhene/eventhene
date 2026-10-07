import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserOrRedirect } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUserOrRedirect("/onboarding");
  const existing = await db.organizer.findUnique({ where: { userId: user.id } });
  if (existing) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0c]">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <Logo invert />
          <h1 className="h-section mt-8 text-white">Welcome, {user.fullName?.split(" ")[0] || "friend"}.</h1>
          <p className="text-white/40 mt-2 font-medium">Let's set up your organizer profile.</p>
        </div>
        <div className="card-glass rounded-2xl p-7">
          <OnboardingForm />
        </div>
        <p className="text-center text-xs text-white/30 mt-6">
          <Link href="/api/auth/sign-out" className="underline hover:text-white/50 transition">Sign out</Link>
        </p>
      </div>
    </div>
  );
}

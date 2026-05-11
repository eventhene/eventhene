import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";

export const metadata = { title: "Welcome to EventHene" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const existing = await db.organizer.findUnique({ where: { userId: user.id } });
  if (existing) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <h1 className="h-display text-4xl mb-2">Welcome to EventHene <span className="text-accent">♛</span></h1>
          <p className="text-ink-muted">Let's set up your organizer profile in under a minute.</p>
        </div>
        <div className="card p-6">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}

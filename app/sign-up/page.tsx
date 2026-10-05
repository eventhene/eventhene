import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata = { title: "Create account" };

export default function SignUpPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="h-section">Create your account.</h1>
        <p className="text-ink-muted mt-2">Free. 60 seconds. No card required.</p>
      </div>
      <SignUpForm next={searchParams.next} />
      <p className="mt-6 text-sm text-ink-muted">
        Already a member? <Link href="/sign-in" className="text-ink font-medium hover:underline">Sign in</Link>
      </p>
      <p className="mt-5 text-[11px] text-ink-faint leading-relaxed">
        By creating an account you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </AuthShell>
  );
}

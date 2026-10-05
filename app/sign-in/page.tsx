import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="h-section">Welcome back.</h1>
        <p className="text-ink-muted mt-2">Sign in to run your event.</p>
      </div>
      <SignInForm next={searchParams.next} />
      <p className="mt-6 text-sm text-ink-muted">
        New here? <Link href="/sign-up" className="text-ink font-medium hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}

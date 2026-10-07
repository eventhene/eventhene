import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: { searchParams: { next?: string } }) {
  const isSuperadmin = searchParams.next?.startsWith("/superadmin");

  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="h-section text-white">Welcome back.</h1>
        <p className="text-white/40 mt-2 font-medium">Sign in to run your event.</p>
      </div>
      <SignInForm next={searchParams.next} />
      {!isSuperadmin && (
        <p className="mt-6 text-sm text-white/40">
          New here? <Link href="/sign-up" className="text-white font-medium hover:underline">Create an account</Link>
        </p>
      )}
    </AuthShell>
  );
}

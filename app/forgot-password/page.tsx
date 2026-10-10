import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="h-section text-white">Reset your password.</h1>
        <p className="mt-2 font-medium text-white/40">We will send a code to your email or phone.</p>
      </div>
      <ForgotPasswordForm />
      <p className="mt-6 text-sm text-white/40">
        Remembered it? <Link href="/sign-in" className="font-medium text-white hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}

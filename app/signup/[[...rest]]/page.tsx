import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <SignUp signInUrl="/login" afterSignUpUrl="/onboarding" />
    </div>
  );
}

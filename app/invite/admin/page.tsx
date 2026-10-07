import { AdminInviteForm } from "@/components/auth/AdminInviteForm";

export const metadata = { title: "SuperAdmin Invite" };

export default function AdminInvitePage({ searchParams }: { searchParams: { email?: string; phone?: string } }) {
  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src="/logo-icon.png" alt="EventHene" className="h-20 w-auto mx-auto mb-5 object-contain" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome, SuperAdmin
          </h1>
          <p className="text-white/40 mt-3 text-base">
            You've been invited to manage EventHene. Set up your account below.
          </p>
        </div>
        <AdminInviteForm defaultEmail={searchParams.email} defaultPhone={searchParams.phone} />
      </div>
    </div>
  );
}

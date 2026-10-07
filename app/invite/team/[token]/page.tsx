import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TeamInviteForm } from "@/components/auth/TeamInviteForm";
import { ROLE_LABEL } from "@/lib/services/team";

export const metadata = { title: "Join the team" };
export const dynamic = "force-dynamic";

export default async function TeamInvitePage({ params }: { params: { token: string } }) {
  const invite = await db.teamInvite.findUnique({
    where: { token: params.token },
    include: { organizer: { select: { displayName: true } } },
  });

  const valid = invite && invite.status === "PENDING" && invite.expiresAt > new Date();
  const user = valid ? await getCurrentUser() : null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-icon.png" alt="EventHene" className="h-20 w-auto mx-auto mb-5 object-contain" />
          {valid ? (
            <>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Hello, welcome!</h1>
              <p className="text-white/50 mt-3 text-base">
                <strong className="text-white">{invite!.organizer.displayName}</strong> invited you to join their team as a{" "}
                <strong className="text-accent">{ROLE_LABEL[invite!.role]}</strong>.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-white">This invite is no longer valid</h1>
              <p className="text-white/50 mt-3 text-sm">
                It may have expired, been cancelled, or already been used. Ask the organizer to send you a new one.
              </p>
              <Link href="/" className="btn-ghost-dark btn-md inline-flex mt-6">Go to EventHene</Link>
            </>
          )}
        </div>

        {valid && (
          <TeamInviteForm
            token={params.token}
            role={invite!.role}
            organizerName={invite!.organizer.displayName}
            phoneLocal={"0" + invite!.phone.slice(3)}
            signedInAs={user ? { name: user.fullName || user.email, email: user.email } : null}
          />
        )}
      </div>
    </div>
  );
}

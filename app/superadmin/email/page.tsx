import { requireUserOrRedirect, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEmailConfigStatus } from "@/lib/email";
import { EmailTestForm } from "@/components/admin/EmailTestForm";
import { CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email setup" };

function Row({ ok, label, value }: { ok: boolean; label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-t border-white/5 first:border-t-0">
      <div className="flex items-center gap-2 text-sm text-white">
        {ok ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-white/25 shrink-0" />}
        {label}
      </div>
      <span className="text-xs text-white/40 font-mono text-right break-all">{value ?? (ok ? "configured" : "not set")}</span>
    </div>
  );
}

const SMTP_EXAMPLE = `SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youraddress@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=EventHene <youraddress@gmail.com>
EMAIL_PROVIDER=auto`;

export default async function EmailSetupPage() {
  const user = await requireUserOrRedirect("/superadmin/email");
  if (!isAdmin(user.role)) redirect("/dashboard");
  const s = getEmailConfigStatus();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-sm text-white/40">Admin</p>
        <h1 className="h-section mt-1 text-white">Email setup</h1>
        <p className="text-sm text-white/40 mt-1">
          Email is controlled by environment variables. Change them in Vercel, redeploy, then test here. No code changes needed.
        </p>
      </div>

      <section className="card-glass rounded-2xl p-6">
        <h2 className="font-bold text-white mb-2">Current status</h2>
        <Row ok={s.anyConfigured} label="Email sending" value={s.anyConfigured ? `mode: ${s.mode}` : "no provider configured"} />
        <Row ok={s.resend.configured} label="Resend (RESEND_API_KEY)" value={s.resend.configured ? `from: ${s.resend.from}` : undefined} />
        <Row ok={s.smtp.configured} label="SMTP fallback" value={s.smtp.configured ? `${s.smtp.user} @ ${s.smtp.host}` : undefined} />
        <Row ok={!!s.replyTo} label="Reply-to (EMAIL_REPLY_TO)" value={s.replyTo} />
      </section>

      <section className="card-glass rounded-2xl p-6">
        <h2 className="font-bold text-white mb-1">Send a test</h2>
        <p className="text-xs text-white/40 mb-4">Shows exactly which provider sent it, or why each one failed.</p>
        <EmailTestForm defaultTo={user.email} />
      </section>

      <section className="card-glass rounded-2xl p-6 space-y-5 text-sm text-white/70">
        <h2 className="font-bold text-white">How to set it up</h2>

        <div>
          <p className="font-semibold text-white">A) When you have your domain (Resend)</p>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>In Resend, add your domain and add the DNS records they show. Wait until it says Verified.</li>
            <li>In Vercel set <code className="text-accent">EMAIL_FROM</code> to <code className="text-accent">EventHene &lt;tickets@yourdomain.com&gt;</code>.</li>
            <li>Set <code className="text-accent">EMAIL_REPLY_TO</code> to your support address, redeploy, and send a test above.</li>
          </ol>
        </div>

        <div>
          <p className="font-semibold text-white">B) When you hit Resend limits (free SMTP fallback)</p>
          <p className="mt-2">
            Add these in Vercel. With <code className="text-accent">EMAIL_PROVIDER=auto</code> (the default) the app tries Resend first and
            automatically switches to SMTP if Resend fails or is over its limit.
          </p>
          <pre className="mt-2 rounded-xl bg-black/40 p-4 text-xs text-white/80 overflow-x-auto">{SMTP_EXAMPLE}</pre>
          <p className="mt-2 text-xs text-white/40">
            Gmail needs 2-step verification on and an App Password (Google Account, Security, App passwords). Brevo, Zoho, Mailgun or any other SMTP service works the same way.
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">C) Force one provider</p>
          <p className="mt-2">
            Set <code className="text-accent">EMAIL_PROVIDER=resend</code> or <code className="text-accent">EMAIL_PROVIDER=smtp</code> to stop the automatic fallback.
          </p>
        </div>

        <p className="text-xs text-white/40">
          Ticket confirmations also go out by SMS, so buyers still get their ticket even if email is down.
        </p>
      </section>
    </div>
  );
}

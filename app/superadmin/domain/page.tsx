import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUserOrRedirect, isAdmin } from "@/lib/auth";
import { getAppUrl, getAppHost, getApexDomain, isCustomDomain } from "@/lib/app-url";
import { getEmailConfigStatus } from "@/lib/email";
import { CopyField } from "@/components/admin/CopyField";
import { EmailTestForm } from "@/components/admin/EmailTestForm";
import { CheckCircle, Circle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Domain" };

function Step({ done, n, title, children }: { done?: boolean; n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card-glass rounded-2xl p-6">
      <div className="flex items-start gap-3">
        {done ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-white/25 shrink-0 mt-0.5" />}
        <div className="min-w-0 flex-1 space-y-3">
          <h2 className="font-bold text-white">
            <span className="text-white/35 mr-2">{n}.</span>
            {title}
          </h2>
          <div className="text-sm text-white/60 space-y-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default async function DomainPage() {
  const user = await requireUserOrRedirect("/superadmin/domain");
  if (!isAdmin(user.role)) redirect("/dashboard");

  const appUrl = getAppUrl();
  const host = getAppHost();
  const custom = isCustomDomain();
  const apex = getApexDomain();
  const requestHost = headers().get("host") || host;
  const email = getEmailConfigStatus();
  const systemVars = !!process.env.VERCEL_PROJECT_PRODUCTION_URL;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-sm text-white/40">Admin</p>
        <h1 className="h-section mt-1 text-white">Domain</h1>
        <p className="text-sm text-white/40 mt-1 max-w-2xl">
          The whole site follows one address automatically: links in emails and SMS, payment return pages, team invites, the email sender and the contact addresses. You only do the steps below, in the other dashboards, once.
        </p>
      </div>

      <section className="card-glass rounded-2xl p-6 space-y-3">
        <h2 className="font-bold text-white">What the site is using right now</h2>
        <CopyField label="Public address" value={appUrl} />
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-black/20 border border-white/10 p-3">
            <p className="text-[11px] uppercase tracking-wider text-white/40">Mode</p>
            <p className={`mt-1 font-semibold ${custom ? "text-emerald-400" : "text-amber-400"}`}>
              {custom ? "Custom domain is live" : "Still on the free Vercel address"}
            </p>
          </div>
          <div className="rounded-xl bg-black/20 border border-white/10 p-3">
            <p className="text-[11px] uppercase tracking-wider text-white/40">Emails are sent from</p>
            <p className="mt-1 font-mono text-xs text-white break-all">{email.resend.from}</p>
          </div>
        </div>
        {requestHost !== host && (
          <p className="text-xs text-amber-400">
            You are viewing this page on {requestHost}, but the site's primary address is {host}. That is normal while you switch over.
          </p>
        )}
      </section>

      <Step n={1} title="Add the domain in Vercel (this switches the whole site)" done={custom}>
        <p>
          Vercel project, <strong className="text-white">Settings, Domains</strong>, add your domain, then copy the DNS records Vercel shows into your registrar. When it says <em>Valid</em>, make it the <strong className="text-white">Primary</strong> domain (set the old <code className="text-accent">eventhene.vercel.app</code> to redirect to it) and click <strong className="text-white">Redeploy</strong>.
        </p>
        <p>
          After that redeploy, every link, email, SMS and payment return address uses the new domain by itself, and visitors on the old address are sent to the new one. Nothing in the code needs changing.
        </p>
        {!systemVars && (
          <p className="text-amber-400">
            One thing to check: Vercel, Settings, Environment Variables, tick <strong>Automatically expose System Environment Variables</strong>. If you prefer not to, add <code className="text-accent">APP_URL</code> = your new address instead.
          </p>
        )}
      </Step>

      <Step n={2} title="Verify the domain in Resend (so emails come from your domain)">
        <p>
          In Resend, <strong className="text-white">Domains, Add Domain</strong>, enter <span className="font-mono text-white">{custom ? apex : "your-domain.com"}</span>, and paste the DNS records Resend gives you into your registrar. Wait until it says <em>Verified</em>.
        </p>
        <p>
          Nothing else to set: once the domain is live the sender becomes <span className="font-mono text-white">tickets@{custom ? apex : "your-domain.com"}</span> automatically. Until Resend shows Verified, emails keep going out through your Gmail fallback, so nothing breaks in between.
        </p>
        <EmailTestForm defaultTo={user.email} />
      </Step>

      <Step n={3} title="Paste the new webhook address into Paystack">
        <p>
          Paystack dashboard, <strong className="text-white">Settings, API Keys &amp; Webhooks</strong>, set the webhook URL to:
        </p>
        <CopyField value={`${appUrl}/api/webhooks/paystack`} />
        <p>
          This is the only value that cannot be updated for you, because Paystack only lets you change it in their dashboard. Until you do, payments still complete (the checkout page confirms them itself), you just lose the instant backup notification.
        </p>
      </Step>

      <Step n={4} title="Update where you share the site" done={false}>
        <p>Replace the old address anywhere you posted it (social bios, WhatsApp, flyers). Old links keep working and forward to the new domain.</p>
        <p className="text-white/40">Everyone will need to sign in once on the new domain, because browsers keep logins per domain.</p>
      </Step>
    </div>
  );
}

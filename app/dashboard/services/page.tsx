import { db } from "@/lib/db";
import { requireUserOrRedirect } from "@/lib/auth";
import { SERVICES, SERVICE_LABELS } from "@/lib/service-catalog";
import { ServiceInquiryForm } from "@/components/services/ServiceInquiryForm";

export const metadata = { title: "Services" };
export const dynamic = "force-dynamic";

export default async function OrgServicesPage() {
  const user = await requireUserOrRedirect("/dashboard/services");
  const organizer = await db.organizer.findUnique({ where: { userId: user.id } });
  const past = organizer
    ? await db.serviceInquiry.findMany({
        where: { organizerId: organizer.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-white/40">Creative extras</p>
        <h1 className="h-section mt-1 text-white">Services</h1>
        <p className="text-white/40 mt-2 max-w-2xl">
          Need design, promotion, livestream, photography or blog features for your event? Pick a service and send a request. We reply within 24 hours with a custom quote.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SERVICES.map((s) => (
          <div key={s.key} className="card-glass rounded-2xl p-6 flex flex-col">
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
              <s.icon className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h3 className="font-bold text-lg text-white mb-1.5">{s.title}</h3>
            <p className="text-sm text-white/50 flex-1">{s.desc}</p>
            <ServiceInquiryForm
              serviceType={s.key}
              serviceTitle={s.title}
              dark
              defaults={{ name: organizer?.displayName, email: user.email, phone: user.phone ?? undefined }}
            />
          </div>
        ))}
      </div>

      {past.length > 0 && (
        <section>
          <h2 className="font-bold text-white mb-3">Your requests</h2>
          <div className="space-y-2">
            {past.map((i) => (
              <div key={i.id} className="card-glass rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{SERVICE_LABELS[i.serviceType] ?? i.serviceType}</p>
                  <p className="text-xs text-white/40 truncate">{i.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 uppercase font-bold">{i.status}</span>
                  <p className="text-[11px] text-white/30 mt-1">{new Date(i.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

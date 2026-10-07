import { ServiceInquiryForm } from "@/components/services/ServiceInquiryForm";
import { SERVICES } from "@/lib/service-catalog";

export const metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <div className="section py-16 lg:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <p className="text-xs font-bold uppercase tracking-widest text-accent mb-5">Services</p>
        <h1 className="h-section text-balance">A full creative team, on call.</h1>
        <p className="text-ink-muted text-lg mt-5">
          From flyer design to livestream and on-the-day photography, EventHene's creative network helps you put on a show worth talking about.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SERVICES.map((s) => (
          <div key={s.key} className="card p-7 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
              <s.icon className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h3 className="font-extrabold text-xl mb-2">{s.title}</h3>
            <p className="text-sm text-ink-muted flex-1">{s.desc}</p>
            <ServiceInquiryForm serviceType={s.key} serviceTitle={s.title} />
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-ink-muted mt-14">
        Inquiry-only. We respond within 24 hours with a custom quote.
      </p>
    </div>
  );
}

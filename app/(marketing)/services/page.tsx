import { ServiceInquiryForm } from "@/components/services/ServiceInquiryForm";

export const metadata = { title: "Services" };

const SERVICES = [
  { key: "SOCIAL_MEDIA", title: "Social Media", desc: "Reach the right crowd. Targeted IG, TikTok, and WhatsApp campaigns that actually fill seats.", emoji: "📣" },
  { key: "GRAPHIC_DESIGN", title: "Graphic Design", desc: "Flyers that pop. Story templates. Tickets that look like the king they belong to.", emoji: "🎨" },
  { key: "LIVESTREAM", title: "Livestream", desc: "Multi-cam, broadcast-quality streaming to YouTube, Instagram, or your private link.", emoji: "📡" },
  { key: "PHOTOGRAPHY", title: "Photography", desc: "Pro on the day. Edited gallery within 48 hours. Moments that matter.", emoji: "📸" },
  { key: "MEDIA_COVERAGE", title: "Media Coverage", desc: "Coverage on partner blogs, radio mentions, and influencer roundups.", emoji: "📰" },
  { key: "MARKETING", title: "Marketing Support", desc: "From early-bird sales to last-minute push, our team plans and runs the campaign with you.", emoji: "🚀" },
] as const;

export default function ServicesPage() {
  return (
    <div className="section py-16 lg:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <p className="chip-outline mb-5 mx-auto w-fit">Services</p>
        <h1 className="h-section text-balance">A full creative team, on call.</h1>
        <p className="text-ink-muted text-lg mt-5">
          From flyer design to livestream and on-the-day photography, EventHene's creative network helps you put on a show worth talking about.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SERVICES.map((s) => (
          <div key={s.key} className="card p-7 flex flex-col">
            <div className="text-3xl mb-4">{s.emoji}</div>
            <h3 className="font-display text-2xl mb-2">{s.title}</h3>
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

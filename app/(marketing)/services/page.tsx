import { ServiceInquiryForm } from "@/components/services/ServiceInquiryForm";

export const metadata = { title: "Services" };

const SERVICES = [
  {
    key: "SOCIAL_MEDIA",
    title: "Social Media Promotion",
    desc: "Reach the right crowd. Targeted campaigns on IG, TikTok, and WhatsApp groups that actually fill seats.",
    emoji: "📣"
  },
  {
    key: "GRAPHIC_DESIGN",
    title: "Graphic Design",
    desc: "Flyers that pop. Story templates. Tickets that look like the king they belong to.",
    emoji: "🎨"
  },
  {
    key: "LIVESTREAM",
    title: "Livestreaming",
    desc: "Multi-cam, broadcast-quality streaming to YouTube, Instagram, or your private link.",
    emoji: "📡"
  },
  {
    key: "PHOTOGRAPHY",
    title: "Photography",
    desc: "Pro on the day. Edited gallery within 48 hours. The moments that matter.",
    emoji: "📸"
  },
  {
    key: "MEDIA_COVERAGE",
    title: "Media Coverage",
    desc: "Coverage on partner blogs, radio mentions, and influencer roundups.",
    emoji: "📰"
  },
  {
    key: "MARKETING",
    title: "Event Marketing Support",
    desc: "From early-bird sales to last-minute push, our team plans and runs the campaign with you.",
    emoji: "🚀"
  }
] as const;

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="h-display text-5xl mb-3">Need more than tickets? We've got you.</h1>
        <p className="text-ink-muted text-lg max-w-2xl mx-auto">
          From flyer design to livestreaming and on-the-day photography, EventHene's creative network
          helps you put on a show worth talking about.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((s) => (
          <div key={s.key} className="card p-6 flex flex-col">
            <div className="text-3xl mb-3">{s.emoji}</div>
            <h3 className="h-display text-xl mb-2">{s.title}</h3>
            <p className="text-sm text-ink-muted flex-1">{s.desc}</p>
            <ServiceInquiryForm serviceType={s.key} serviceTitle={s.title} />
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-ink-muted mt-12">
        Inquiry-only. We'll respond within 24 hours with a custom quote.
      </p>
    </div>
  );
}

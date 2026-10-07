import { Megaphone, Palette, Radio, Camera, PenLine, TrendingUp, type LucideIcon } from "lucide-react";

export interface ServiceItem {
  key: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}

export const SERVICES: ServiceItem[] = [
  { key: "SOCIAL_MEDIA", title: "Social Media", desc: "Reach the right crowd. Targeted IG, TikTok, and WhatsApp campaigns that actually fill seats.", icon: Megaphone },
  { key: "GRAPHIC_DESIGN", title: "Graphic Design", desc: "Flyers that pop. Story templates. Tickets that look premium from the first glance.", icon: Palette },
  { key: "LIVESTREAM", title: "Livestream", desc: "Multi-cam, broadcast-quality streaming to YouTube, Instagram, or your private link.", icon: Radio },
  { key: "PHOTOGRAPHY", title: "Photography", desc: "Pro on the day. Edited gallery within 48 hours. Moments that matter.", icon: Camera },
  { key: "BLOGGING", title: "Blogging Partners", desc: "Get your event featured on partner blogs, entertainment pages and influencer roundups before and after the show.", icon: PenLine },
  { key: "MARKETING", title: "Marketing Support", desc: "From early-bird sales to last-minute push, our team plans and runs the campaign with you.", icon: TrendingUp },
];

export const SERVICE_LABELS: Record<string, string> = {
  SOCIAL_MEDIA: "Social Media",
  GRAPHIC_DESIGN: "Graphic Design",
  LIVESTREAM: "Livestream",
  PHOTOGRAPHY: "Photography",
  MEDIA_COVERAGE: "Media Coverage",
  BLOGGING: "Blogging Partners",
  MARKETING: "Marketing Support",
};

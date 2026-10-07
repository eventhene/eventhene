"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { Calendar, MapPin, Tag } from "lucide-react";
import type { MouseEvent } from "react";

interface TicketCard3DProps {
  variant: "regular" | "vip" | "vvip";
  featured?: boolean;
}

const VARIANTS = {
  regular: {
    tier: "Regular",
    priceLabel: "Free",
    stubBg: "bg-[#1C1917]",
    stubBorder: "border-white/10",
    stubAccent: "#888888",
    tierColor: "text-white/70",
    badge: "bg-white/10 text-white/70",
  },
  vip: {
    tier: "VIP",
    priceLabel: "GHS 200",
    stubBg: "bg-gradient-to-b from-[#2a1f0a] to-[#1a1507]",
    stubBorder: "border-[#D4A853]/30",
    stubAccent: "#D4A853",
    tierColor: "text-[#D4A853]",
    badge: "bg-[#D4A853] text-black",
  },
  vvip: {
    tier: "VVIP",
    priceLabel: "GHS 500",
    stubBg: "bg-gradient-to-b from-[#3d1a1a] to-[#1a0d0d]",
    stubBorder: "border-[#e74c3c]/30",
    stubAccent: "#e74c3c",
    tierColor: "text-[#e74c3c]",
    badge: "bg-gradient-to-r from-[#e74c3c] to-[#ff6b6b] text-white",
  },
};

const DEMO_FLYER = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=75";

export function TicketCard3D({ variant, featured }: TicketCard3DProps) {
  const V = VARIANTS[variant];
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const sRotX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const sRotY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 12);
    rotateX.set((0.5 - py) * 8);
  }

  function reset() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{
        rotateX: sRotX,
        rotateY: sRotY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={`relative select-none ${featured ? "md:scale-[1.04] md:-translate-y-2 z-10" : ""}`}
    >
      <div className={`flex rounded-2xl overflow-hidden shadow-2xl ${featured ? "shadow-[0_24px_60px_-12px_rgba(184,134,11,0.35)]" : "shadow-xl"}`}>
        {/* Main ticket body - flyer background with blur overlay */}
        <div className="relative flex-1 min-h-[190px] flex flex-col justify-between overflow-hidden">
          {/* Flyer background */}
          <img
            src={DEMO_FLYER}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark + blur gradient from left */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/30" />
          <div className="absolute inset-0 backdrop-blur-[2px]" style={{
            maskImage: "linear-gradient(to right, black 50%, transparent 85%)",
            WebkitMaskImage: "linear-gradient(to right, black 50%, transparent 85%)",
          }} />

          {/* Content overlay */}
          <div className="relative p-5 sm:p-6 flex flex-col justify-between h-full z-10">
            {/* Top section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <img src="/logo-icon.png" alt="EventHene" className="h-5 w-5 object-contain" />
                <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${V.badge}`}>
                  {V.tier}
                </span>
              </div>
              <h3 className="font-extrabold text-white text-xl sm:text-2xl leading-tight drop-shadow-lg">
                Fire Conference 2026
              </h3>
            </div>

            {/* Bottom details */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center gap-2 text-white/70 text-[11px]">
                <Calendar className="w-3 h-3 shrink-0 text-[#D4A853]" />
                <span>Sat, Nov 14 2026</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-[11px]">
                <MapPin className="w-3 h-3 shrink-0 text-[#D4A853]" />
                <span>Christ Temple, Ghana</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-[11px]">
                <Tag className="w-3 h-3 shrink-0 text-[#D4A853]" />
                <span className="font-bold text-white text-xs">{V.priceLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Perforated divider */}
        <div className="relative flex-shrink-0 w-0">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0a0a0c] z-20" />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0a0a0c] z-20" />
          <div className="absolute inset-y-5 left-0 w-px z-10" style={{
            backgroundImage: `repeating-linear-gradient(to bottom, ${V.stubAccent}40 0px, ${V.stubAccent}40 4px, transparent 4px, transparent 10px)`,
          }} />
        </div>

        {/* Tear-off stub - color coded by tier */}
        <div className={`${V.stubBg} w-[105px] sm:w-[125px] flex-shrink-0 p-4 flex flex-col items-center justify-center text-center relative border-l ${V.stubBorder}`}>
          {/* Tier indicator strip at top */}
          <div
            className="absolute top-0 inset-x-0 h-1"
            style={{ background: V.stubAccent }}
          />

          <p className="text-[7px] uppercase tracking-[0.25em] font-bold mb-2" style={{ color: V.stubAccent }}>
            Scan to enter
          </p>
          <div className="rounded-lg p-1" style={{ border: `2px solid ${V.stubAccent}40` }}>
            <QRPatch accent={V.stubAccent} />
          </div>
          <div className="mt-3">
            <p className="text-[7px] uppercase tracking-widest text-white/30 font-bold">Ticket ID</p>
            <p className="font-mono text-[9px] font-bold mt-0.5" style={{ color: V.stubAccent }}>
              FIRE-{variant === "regular" ? "001234" : variant === "vip" ? "002567" : "003890"}
            </p>
          </div>
          <p className={`text-[8px] font-extrabold mt-2 ${V.tierColor}`}>{V.tier}</p>
        </div>
      </div>
    </motion.div>
  );
}

function QRPatch({ accent }: { accent: string }) {
  const pattern = [
    1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,
    1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1,
    1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1,
    1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,1,1,1,0,1,
    1,0,1,1,1,0,1,0,1,0,0,1,1,0,1,0,1,1,1,0,1,
    1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,1,
    1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,
    0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,
    1,0,1,0,1,1,1,1,0,0,1,0,1,1,1,0,1,0,1,0,1,
    0,1,0,1,0,0,0,1,1,0,1,1,0,0,0,1,0,1,0,1,0,
    1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,1,1,0,0,1,
    0,1,0,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0,1,1,0,
    1,0,1,0,1,0,1,0,1,1,0,1,1,0,1,0,1,0,1,0,1,
    0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,1,0,
    1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,0,1,0,0,0,1,
    1,0,0,0,0,0,1,0,1,0,0,1,0,0,0,1,0,1,1,0,0,
    1,0,1,1,1,0,1,0,1,1,0,0,1,1,1,0,1,1,0,1,1,
    1,0,1,1,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,
    1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,1,0,1,0,1,1,
    1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,0,
    1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,0,1,1,0,1,
  ];

  return (
    <div className="w-12 h-12 sm:w-14 sm:h-14">
      <div className="grid grid-cols-[repeat(21,1fr)] gap-0 w-full h-full">
        {pattern.map((on, i) => (
          <div key={i} style={{ backgroundColor: on ? accent : "transparent" }} className={on ? "" : "bg-white/5"} />
        ))}
      </div>
    </div>
  );
}

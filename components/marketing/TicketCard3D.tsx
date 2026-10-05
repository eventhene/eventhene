"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MouseEvent } from "react";

interface TicketCard3DProps {
  variant: "regular" | "vip" | "vvip";
  featured?: boolean;
}

const VARIANTS = {
  regular: {
    gradient: "linear-gradient(135deg, #2A1A4E 0%, #0A0A0B 100%)",
    tier: "Regular",
    priceLabel: "GHS 150",
  },
  vip: {
    gradient: "linear-gradient(135deg, #4A2DA8 0%, #2A1A4E 60%, #FFCF52 180%)",
    tier: "VIP",
    priceLabel: "GHS 350",
  },
  vvip: {
    gradient: "linear-gradient(135deg, #0A0A0B 0%, #4A2DA8 100%)",
    tier: "VVIP",
    priceLabel: "GHS 800",
  },
};

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
    rotateY.set((px - 0.5) * 16);
    rotateX.set((0.5 - py) * 16);
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
      className={`relative rounded-2xl text-white overflow-hidden select-none ${featured ? "md:scale-[1.08] md:-translate-y-3 shadow-[0_32px_80px_-24px_rgba(74,45,168,0.5)]" : "shadow-xl"}`}
    >
      <div
        className="aspect-[3/4] p-6 flex flex-col justify-between relative"
        style={{ background: V.gradient }}
      >
        {/* grain */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.3), transparent 40%), radial-gradient(circle at 80% 90%, rgba(255,207,82,0.3), transparent 40%)",
          }}
        />
        {/* crown mark */}
        <div className="absolute top-4 right-4 text-accent/70 text-2xl font-display">♛</div>

        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/50">Event • Hene</p>
          <p className="font-display text-2xl mt-2 leading-tight">
            DJ Kay<br/>Birthday Bash
          </p>
          <p className="text-[11px] text-white/60 mt-2">Fri Jun 12 · East Legon</p>
        </div>

        <div className="relative">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50">Tier</p>
              <p className="font-display text-xl">{V.tier}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-white/50">Price</p>
              <p className="font-display text-xl">{V.priceLabel}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-white text-ink p-3">
            {/* QR placeholder */}
            <QRPatch />
            <div className="font-mono text-[10px] leading-tight">
              <p className="text-ink-muted">REFERENCE</p>
              <p>WOR-DJKAY</p>
              <p>-4134123</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QRPatch() {
  // Decorative, not a real QR
  return (
    <div className="w-16 h-16 rounded-lg bg-ink p-1.5">
      <div className="grid grid-cols-7 grid-rows-7 gap-[1px] w-full h-full">
        {Array.from({ length: 49 }).map((_, i) => {
          const on = Math.random() > 0.45 || [0, 6, 42, 48].includes(i);
          return <div key={i} className={on ? "bg-white" : "bg-ink"} />;
        })}
      </div>
    </div>
  );
}

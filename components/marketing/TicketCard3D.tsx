"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import type { MouseEvent } from "react";

interface TicketCard3DProps {
  variant: "regular" | "vip" | "vvip";
  featured?: boolean;
}

const VARIANTS = {
  regular: {
    gradient: "linear-gradient(135deg, #1C1917 0%, #111111 100%)",
    tier: "Regular",
    priceLabel: "Free",
  },
  vip: {
    gradient: "linear-gradient(135deg, #B8860B 0%, #1C1917 80%)",
    tier: "VIP",
    priceLabel: "GHS 200",
  },
  vvip: {
    gradient: "linear-gradient(135deg, #111111 0%, #D4A853 180%)",
    tier: "VVIP",
    priceLabel: "GHS 500",
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
      className={`relative rounded-2xl text-white overflow-hidden select-none ${featured ? "md:scale-[1.08] md:-translate-y-3 shadow-[0_32px_80px_-24px_rgba(184,134,11,0.4)]" : "shadow-xl"}`}
    >
      <div
        className="aspect-[3/4] p-6 flex flex-col justify-between relative"
        style={{ background: V.gradient }}
      >
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 90%, rgba(212,168,83,0.3), transparent 40%)",
          }}
        />

        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/50 font-semibold">EventHene</p>
          <p className="font-extrabold text-2xl mt-2 leading-tight">
            Fire Conference<br/>2026
          </p>
          <p className="text-[11px] text-white/60 mt-2 font-medium">Sat Nov 14 - Christ Temple, Ghana</p>
        </div>

        <div className="relative">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Tier</p>
              <p className="font-extrabold text-xl">{V.tier}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Price</p>
              <p className="font-extrabold text-xl">{V.priceLabel}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-white text-ink p-3">
            <QRPatch />
            <div className="font-mono text-[10px] leading-tight">
              <p className="text-ink-muted">REFERENCE</p>
              <p className="font-semibold">KWA-FIRE</p>
              <p className="font-semibold">-7241089</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QRPatch() {
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

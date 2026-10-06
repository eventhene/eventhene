"use client";

import { motion } from "framer-motion";

export function HeroCanvas() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="absolute -top-40 -right-20 w-[640px] h-[640px] rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(212,168,83,0.5), transparent 60%)",
          filter: "blur(40px)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
        className="absolute top-20 -left-32 w-[520px] h-[520px] rounded-full"
        style={{
          background: "radial-gradient(circle at 70% 50%, rgba(184,134,11,0.5), transparent 60%)",
          filter: "blur(60px)",
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, rgba(14,143,107,0.4), transparent 60%)",
          filter: "blur(70px)",
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, transparent 0%, transparent 60%, rgba(17,17,17,0.5) 100%)",
        }}
      />
    </div>
  );
}

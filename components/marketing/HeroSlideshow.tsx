"use client";

import { useState, useEffect } from "react";

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&q=80",
    alt: "Concert crowd with lights",
  },
  {
    src: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920&q=80",
    alt: "Music festival stage lights",
  },
  {
    src: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1920&q=80",
    alt: "Festival crowd at night",
  },
  {
    src: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1920&q=80",
    alt: "Concert atmosphere",
  },
];

export function HeroSlideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
        >
          <img
            src={slide.src}
            alt={slide.alt}
            className="w-full h-full object-cover scale-[1.05]"
            style={{
              transition: "transform 8s ease-out",
              transform: i === active ? "scale(1.08)" : "scale(1)",
            }}
          />
        </div>
      ))}
      {/* Gradient overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-black/30" />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}

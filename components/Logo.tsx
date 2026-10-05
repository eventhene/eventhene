import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  invert?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ href = "/", invert = false, size = "md", className }: LogoProps) {
  const sizes = {
    sm: "text-[18px]",
    md: "text-[22px]",
    lg: "text-[30px]",
  };
  const Wrapper: any = href ? Link : "span";
  const props = href ? { href } : {};
  return (
    <Wrapper
      {...props}
      className={cn(
        "inline-flex items-center gap-2 font-display font-semibold tracking-tightest leading-none",
        sizes[size],
        invert ? "text-white" : "text-ink",
        className
      )}
    >
      <CrownMark className={cn("h-[1.1em] w-auto", invert ? "text-accent" : "text-royal-2")} />
      <span>Event<span className={invert ? "text-white/70" : "text-ink-muted"}>hene</span></span>
    </Wrapper>
  );
}

export function CrownMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="crown-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path
        d="M4 10l5 7 7-10 7 10 5-7v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V10z"
        fill="url(#crown-grad)"
      />
      <circle cx="4" cy="10" r="2" fill="currentColor" />
      <circle cx="16" cy="7" r="2" fill="currentColor" />
      <circle cx="28" cy="10" r="2" fill="currentColor" />
    </svg>
  );
}

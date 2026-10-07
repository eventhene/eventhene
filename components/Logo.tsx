import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  invert?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "icon" | "full";
}

const ICON_RATIO = 512 / 662;
const FULL_RATIO = 900 / 292;
const HEIGHTS = { sm: 30, md: 38, lg: 52 };
const FULL_HEIGHTS = { sm: 28, md: 34, lg: 44 };

export function Logo({ href = "/", size = "md", className, variant = "full" }: LogoProps) {
  const Wrapper: any = href ? Link : "span";
  const props = href ? { href } : {};

  if (variant === "icon") {
    const h = HEIGHTS[size];
    return (
      <Wrapper {...props} className={cn("inline-flex items-center", className)} aria-label="EventHene">
        <Image src="/logo-icon.png" alt="EventHene" width={Math.round(h * ICON_RATIO)} height={h} className="object-contain" priority />
      </Wrapper>
    );
  }

  const h = FULL_HEIGHTS[size];
  return (
    <Wrapper {...props} className={cn("inline-flex items-center", className)} aria-label="EventHene">
      <Image src="/logo-full.png" alt="EventHene" width={Math.round(h * FULL_RATIO)} height={h} className="object-contain" priority />
    </Wrapper>
  );
}

export function LogoIcon({ height = 28, className }: { height?: number; className?: string }) {
  return (
    <Image
      src="/logo-icon.png"
      alt="EventHene"
      width={Math.round(height * ICON_RATIO)}
      height={height}
      className={cn("object-contain", className)}
      priority
    />
  );
}

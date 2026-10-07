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

const ICON_SIZES = { sm: 28, md: 34, lg: 44 };
const FULL_SIZES = { sm: { w: 130, h: 32 }, md: { w: 160, h: 40 }, lg: { w: 200, h: 50 } };

export function Logo({ href = "/", invert = false, size = "md", className, variant }: LogoProps) {
  const Wrapper: any = href ? Link : "span";
  const props = href ? { href } : {};

  const mode = variant ?? "full";

  if (mode === "icon") {
    const s = ICON_SIZES[size];
    return (
      <Wrapper {...props} className={cn("inline-flex items-center", className)}>
        <Image src="/logo-icon.png" alt="EventHene" width={s} height={s} className="object-contain" priority />
      </Wrapper>
    );
  }

  const { w, h } = FULL_SIZES[size];
  return (
    <Wrapper {...props} className={cn("inline-flex items-center", className)}>
      <Image src="/logo-full.png" alt="EventHene" width={w} height={h} className="object-contain" priority />
    </Wrapper>
  );
}

export function LogoIcon({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <Image src="/logo-icon.png" alt="EventHene" width={size} height={size} className={cn("object-contain", className)} priority />
  );
}

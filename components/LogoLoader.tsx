/**
 * Brand loading indicator: the whole logo fades and breathes while the crown spins.
 * The logo is split into two stacked layers (same size) so only the crown rotates.
 */
export function LogoLoader({
  height = 92,
  label,
  className = "",
}: {
  height?: number;
  label?: string;
  className?: string;
}) {
  const width = Math.round(height * (512 / 662));
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`} role="status" aria-live="polite">
      <div className="eh-loader relative" style={{ width, height }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-body.png" alt="" className="absolute inset-0 h-full w-full select-none" draggable={false} />
        <div className="absolute inset-0" style={{ perspective: "700px", perspectiveOrigin: "34.7% 17.6%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-crown.png" alt="" className="eh-loader-crown absolute inset-0 h-full w-full select-none" draggable={false} />
        </div>
      </div>
      <span className="sr-only">{label || "Loading"}</span>
      {label && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">{label}</p>}
    </div>
  );
}

/** Full-screen version for top-level routes. */
export function LogoLoaderScreen({ label }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0a0a0c]">
      <LogoLoader height={110} label={label} />
    </div>
  );
}

/** Fills the content area of a layout (sidebar stays visible). */
export function LogoLoaderArea({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <LogoLoader height={88} label={label} />
    </div>
  );
}

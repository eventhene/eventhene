import Link from "next/link";
import { Logo } from "@/components/Logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.2fr,1fr] bg-[#0a0a0c]">
      <aside className="hidden lg:flex relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80"
          alt="Concert crowd"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-black/40" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo invert />
          <div className="max-w-md">
            <p className="text-sm font-semibold text-accent uppercase tracking-wide mb-4">The organizer's platform</p>
            <h2 className="h-section text-white text-balance">
              Register. Scan. <span className="text-accent">Reign.</span>
            </h2>
            <p className="mt-5 text-white/50 text-lg leading-relaxed font-medium">
              Collect registrations, send bulk SMS, scan QR tickets, and know exactly who showed up.
            </p>
          </div>
          <p className="text-xs text-white/20 font-semibold tracking-widest uppercase">EventHene - Ghana</p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12 lg:py-20">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden mb-10 inline-block">
            <Logo invert />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}

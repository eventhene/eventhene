import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { GateRegisterForm } from "@/components/gate/GateRegisterForm";
import { isGateWindowOpen } from "@/lib/services/gate";
import { formatDateShort } from "@/lib/utils";
import { MapPin, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Register at the gate" };

export default async function GatePage({ params }: { params: { token: string } }) {
  const event = await db.event.findUnique({
    where: { gateToken: params.token },
    include: {
      attendeeFields: { orderBy: { sortOrder: "asc" } },
      ticketTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!event || !event.gateEnabled || event.status !== "PUBLISHED") notFound();

  const open = isGateWindowOpen(event.startsAt, event.endsAt);

  return (
    <div className="relative min-h-screen">
      {/* The event's own flyer, blurred right down, is the backdrop. The scrims
          over it keep every bit of text well clear of WCAG AA on any artwork. */}
      {event.flyerUrl ? (
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
          <div className="absolute inset-0 bg-[#0a0a0c]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.flyerUrl}
            alt=""
            className="h-full w-full scale-110 object-cover opacity-90 blur-[30px] saturate-125"
          />
          <div className="absolute inset-0 bg-[#0a0a0c]/25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/35 via-[#0a0a0c]/75 to-[#0a0a0c]/97" />
        </div>
      ) : (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-[#0a0a0c]"
          aria-hidden
          style={{
            background:
              "radial-gradient(820px 620px at 15% 12%, rgba(212,168,83,0.14), transparent 68%), radial-gradient(900px 700px at 85% 90%, rgba(184,134,11,0.08), transparent 70%)",
          }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-lg px-5 py-10">
        <div className="text-center">
          <Logo variant="icon" size="md" className="mx-auto" />

          {event.flyerUrl && (
            <div className="mx-auto mt-7 w-36 overflow-hidden rounded-2xl border border-white/15 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.flyerUrl} alt={event.title} className="block w-full" />
            </div>
          )}

          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-accent">
            Register at the gate
          </p>
          <h1 className="h-section mt-2 text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.6)]">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-white/65">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDateShort(event.startsAt, event.timezone)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {event.venue}
            </span>
          </div>
        </div>

        {!open && (
          <p className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-3 text-center text-sm font-semibold text-amber-300 backdrop-blur-md">
            This event is not on right now. You can still register, but you will not be checked in.
          </p>
        )}

        <div className="glass-strong mt-8 rounded-[28px] p-6 shadow-2xl [&_.input]:border-white/15 [&_.input]:bg-black/40 [&_.input]:placeholder:text-white/45 [&_.label]:text-white/70">
          <GateRegisterForm
            token={params.token}
            fields={event.attendeeFields.map((f) => ({
              key: f.key,
              label: f.label,
              type: f.type,
              required: f.required,
              options: f.options ?? [],
            }))}
            ticketTypes={event.ticketTypes.map((t) => ({ id: t.id, name: t.name }))}
          />
        </div>

        <p className="mt-8 text-center text-xs text-white/40">Powered by EventHene</p>
      </div>
    </div>
  );
}

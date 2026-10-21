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
    <div className="min-h-screen bg-[#0a0a0c] px-5 py-10">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="text-center">
          <Logo variant="icon" size="md" className="mx-auto" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-accent">
            Register at the gate
          </p>
          <h1 className="h-section mt-2 text-white">{event.title}</h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-white/50">
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
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-center text-sm font-semibold text-amber-400">
            This event is not on right now. You can still register, but you will not be checked in.
          </p>
        )}

        <div className="card-glass rounded-2xl p-6">
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

        <p className="text-center text-xs text-white/30">Powered by EventHene</p>
      </div>
    </div>
  );
}

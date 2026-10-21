import Link from "next/link";
import { redirect } from "next/navigation";
import { requireEventOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { qrToDataUrl } from "@/lib/qr";
import { getAppUrl } from "@/lib/app-url";
import { ensureGateToken, isGateWindowOpen } from "@/lib/services/gate";
import { GatePanel } from "@/components/gate/GatePanel";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Register at the gate" };

export default async function EventGatePage({ params }: { params: { id: string } }) {
  const ctx = await requireEventOwner(params.id).catch(() => null);
  if (!ctx) redirect("/dashboard");

  const event = await db.event.findUnique({
    where: { id: params.id },
    include: {
      attendeeFields: { orderBy: { sortOrder: "asc" } },
      ticketTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!event) redirect("/dashboard");

  const token = await ensureGateToken(event.id);
  const url = `${getAppUrl()}/g/${token}`;
  const qr = await qrToDataUrl(url);

  const gateCount = await db.ticket.count({ where: { eventId: event.id, source: "GATE" } });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/dashboard/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to event
        </Link>
        <h1 className="h-section mt-3 text-white">Register at the gate</h1>
        <p className="mt-2 max-w-2xl text-white/45">
          For people who turn up without registering. Print the poster so they scan and fill it in
          themselves, or take their details here. Either way they are registered and checked in at
          once, and they get one text that confirms both.
        </p>
      </div>

      <GatePanel
        eventId={event.id}
        eventTitle={event.title}
        token={token}
        url={url}
        qr={qr}
        enabled={event.gateEnabled}
        windowOpen={isGateWindowOpen(event.startsAt, event.endsAt)}
        isFree={event.type === "FREE"}
        gateCount={gateCount}
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
  );
}

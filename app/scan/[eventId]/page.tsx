import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireScannerForEvent } from "@/lib/auth";
import { Scanner } from "@/components/scan/Scanner";

export const metadata = { title: "Scanner" };
export const dynamic = "force-dynamic";

export default async function ScanEventPage({ params }: { params: { eventId: string } }) {
  await requireScannerForEvent(params.eventId);
  const event = await db.event.findUnique({ where: { id: params.eventId } });
  if (!event) notFound();
  return <Scanner eventId={event.id} eventTitle={event.title} />;
}

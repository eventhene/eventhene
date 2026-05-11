import { NextRequest, NextResponse } from "next/server";
import { requireEventOwner } from "@/lib/auth";
import { exportAttendees } from "@/lib/services/exports";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireEventOwner(params.id);
    const url = new URL(req.url);
    const filter = (url.searchParams.get("filter") ?? "all") as "all" | "attended" | "unattended";
    const format = (url.searchParams.get("format") ?? "xlsx") as "xlsx" | "csv";
    const ticketTypeId = url.searchParams.get("ticketTypeId") || undefined;

    const result = await exportAttendees({ eventId: params.id, filter, ticketTypeId, format });

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.filename}"`
      }
    });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganizer } from "@/lib/auth";
import { exportContacts, exportOptions } from "@/lib/services/contact-export";

export const maxDuration = 60;

/** What this organizer can choose from: their lists, their events, their columns. */
export async function GET(req: NextRequest) {
  try {
    const { organizer } = await requireOrganizer(req);
    return NextResponse.json(await exportOptions(organizer.id));
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    console.error("[contacts/export GET]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

const Body = z.object({
  sources: z.array(z.enum(["lists", "registered"])).min(1),
  listIds: z.array(z.string()).max(200).optional(),
  eventIds: z.array(z.string()).max(200).optional(),
  columns: z.array(z.string().max(120)).max(60).default([]),
  format: z.enum(["csv", "xlsx"]).default("xlsx"),
  dedupe: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const { organizer } = await requireOrganizer(req);
    const body = Body.parse(await req.json());

    const file = await exportContacts({ organizerId: organizer.id, ...body });
    if (file.rowCount === 0) {
      return NextResponse.json({ error: "No contacts matched that selection." }, { status: 404 });
    }

    return new NextResponse(file.buffer as any, {
      headers: {
        "content-type": file.mimeType,
        "content-disposition": `attachment; filename="${file.filename}"`,
        "x-row-count": String(file.rowCount),
      },
    });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Pick at least one source." }, { status: 400 });
    console.error("[contacts/export POST]", e);
    return NextResponse.json({ error: "Could not build that export." }, { status: 500 });
  }
}

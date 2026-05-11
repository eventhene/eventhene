import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateScan } from "@/lib/services/tickets";
import { requireScannerForEvent } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

const Body = z.object({
  qr: z.string().min(10).max(2048),
  eventId: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const { qr, eventId } = Body.parse(await req.json());
    const { user } = await requireScannerForEvent(eventId);

    const ok = await rateLimit(`scan:${user.id}`, 120, 60, "scan");
    if (!ok) return NextResponse.json({ result: "RATE_LIMITED" }, { status: 429 });

    const result = await validateScan({
      qr,
      eventId,
      scannedById: user.id,
      ip: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined
    });
    return NextResponse.json(result);
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

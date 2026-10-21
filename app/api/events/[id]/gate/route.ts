import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";
import { ensureGateToken } from "@/lib/services/gate";

const Body = z.object({ enabled: z.boolean().optional(), regenerate: z.boolean().optional() });

/** Opens or closes gate registration, and can mint a fresh link if a poster leaks. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireEventOwner(params.id, req);
    const { enabled, regenerate } = Body.parse(await req.json());

    const data: { gateEnabled?: boolean; gateToken?: string } = {};
    if (typeof enabled === "boolean") data.gateEnabled = enabled;
    if (regenerate) {
      const { makeGateToken } = await import("@/lib/services/gate");
      data.gateToken = makeGateToken();
    }
    if (Object.keys(data).length) await db.event.update({ where: { id: params.id }, data });

    const token = await ensureGateToken(params.id);
    return NextResponse.json({ ok: true, token });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Bad request." }, { status: 400 });
    console.error("[events/:id/gate]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

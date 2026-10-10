import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireBinAccess, listBin, emptyBin } from "@/lib/recycle";

function fail(e: any) {
  if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  console.error("[recycle-bin]", e);
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const scope = new URL(req.url).searchParams.get("scope") || "";
    await requireBinAccess(scope, req);
    return NextResponse.json({ items: await listBin(scope) });
  } catch (e) {
    return fail(e);
  }
}

/** POST {action:"empty", scope}: clears the ability to undo. It never touches the real records. */
export async function POST(req: NextRequest) {
  try {
    const { scope } = z.object({ action: z.literal("empty"), scope: z.string().min(5) }).parse(await req.json());
    const { actor } = await requireBinAccess(scope, req);
    const removed = await emptyBin(scope, actor);
    return NextResponse.json({ ok: true, removed });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    return fail(e);
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const pending = await db.organizer.findMany({
      where: { senderIdStatus: { in: ["PENDING", "APPROVED", "REJECTED"] } },
      include: { user: { select: { email: true, fullName: true } } },
      orderBy: [{ senderIdStatus: "asc" }, { updatedAt: "desc" }],
      take: 200,
    });
    return NextResponse.json({ organizers: pending });
  } catch (e: any) {
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

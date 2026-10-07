import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { sendEmailDetailed, testEmailHtml, getEmailConfigStatus } from "@/lib/email";

const Body = z.object({ to: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"], req);
    const { to } = Body.parse(await req.json());
    const status = getEmailConfigStatus();
    const info = `mode=${status.mode} resend=${status.resend.configured ? "on" : "off"} smtp=${status.smtp.configured ? "on" : "off"}`;
    const result = await sendEmailDetailed({
      to,
      subject: "EventHene test email",
      html: testEmailHtml(info),
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    console.error("[admin/email/test]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

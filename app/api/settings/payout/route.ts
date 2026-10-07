import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { paystack } from "@/lib/payments/paystack";

const ResolveBody = z.object({
  action: z.literal("resolve"),
  accountNumber: z.string().min(5).max(20),
  bankCode: z.string().min(1),
});

const SaveBody = z.object({
  action: z.literal("save"),
  accountNumber: z.string().min(5).max(20),
  bankCode: z.string().min(1),
  bankName: z.string().min(1),
  accountName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { user, organizer } = await requireOrganizer(req);
    const body = await req.json();

    if (body.action === "resolve") {
      const { accountNumber, bankCode } = ResolveBody.parse(body);
      const result = await paystack.resolveAccount(accountNumber, bankCode);
      return NextResponse.json({ accountName: result.account_name });
    }

    if (body.action === "save") {
      const { accountNumber, bankCode, bankName, accountName } = SaveBody.parse(body);

      let subacctCode = organizer.paystackSubacct;

      if (!subacctCode) {
        const sub = await paystack.createSubaccount({
          businessName: organizer.displayName,
          bankCode,
          accountNumber,
          percentageCharge: 95,
        });
        subacctCode = sub.subaccount_code;
      }

      await db.organizer.update({
        where: { id: organizer.id },
        data: {
          bankCode,
          bankName,
          accountNumber,
          accountName,
          paystackSubacct: subacctCode,
          payoutVerified: true,
        },
      });

      return NextResponse.json({ ok: true, subaccount: subacctCode });
    }

    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    console.error("[settings/payout]", e);
    return NextResponse.json({ error: e.message || "internal_error" }, { status: 500 });
  }
}

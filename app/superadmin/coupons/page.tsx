import { db } from "@/lib/db";
import { requireUserOrRedirect, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CouponManager } from "@/components/admin/CouponManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  const user = await requireUserOrRedirect("/superadmin/coupons");
  if (!isAdmin(user.role)) redirect("/dashboard");

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { creator: { select: { email: true } } },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-sm text-white/40">Admin</p>
        <h1 className="h-section mt-1 text-white">Coupons</h1>
        <p className="text-sm text-white/40 mt-1 max-w-2xl">
          A coupon lets an organizer publish a free event instantly, without waiting for review. Generate a code, send it to the organizer, and each use is counted.
        </p>
      </div>
      <CouponManager
        coupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          note: c.note,
          maxUses: c.maxUses,
          usedCount: c.usedCount,
          expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
          createdAt: c.createdAt.toISOString(),
          createdBy: c.creator.email,
        }))}
      />
    </div>
  );
}

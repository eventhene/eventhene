-- Add Coupon table and Event.couponCode column
-- Paste this into Supabase SQL Editor and run it

-- Coupon table
CREATE TABLE IF NOT EXISTS "Coupon" (
  "id"        TEXT NOT NULL,
  "code"      TEXT NOT NULL,
  "note"      TEXT,
  "maxUses"   INTEGER NOT NULL DEFAULT 1,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "Coupon_code_idx" ON "Coupon"("code");

ALTER TABLE "Coupon"
  ADD CONSTRAINT "Coupon_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add couponCode column to Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "couponCode" TEXT;

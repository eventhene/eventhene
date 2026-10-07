-- Add OTP table for email/phone verification
-- Paste this into Supabase SQL Editor and run it

CREATE TABLE IF NOT EXISTS "Otp" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "code"      TEXT NOT NULL,
  "channel"   TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts"  INTEGER NOT NULL DEFAULT 0,
  "verified"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Otp_userId_channel_createdAt_idx"
  ON "Otp"("userId", "channel", "createdAt");

import crypto from "crypto";
import { db } from "@/lib/db";
import { sendEmailDetailed, otpEmailHtml } from "@/lib/email";
import { sendSMS } from "@/lib/sms/hubtel";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export type OtpChannel = "email" | "sms";

/**
 * `purpose` keeps codes for different jobs apart (sign-in, password reset, email change) even when they
 * travel over the same channel, so a reset code can never be used to confirm an email change.
 */
const keyFor = (channel: OtpChannel, purpose?: string) => (purpose ? `${channel}:${purpose}` : channel);

export async function createAndSendOtp(userId: string, channel: OtpChannel, destination: string, purpose?: string) {
  const dbChannel = keyFor(channel, purpose);
  await db.otp.deleteMany({
    where: { userId, channel: dbChannel, verified: false },
  });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.otp.create({
    data: { userId, code, channel: dbChannel, expiresAt },
  });

  if (channel === "email") {
    const result = await sendEmailDetailed({
      to: destination,
      subject: `${code} - Your EventHene verification code`,
      html: otpEmailHtml(code),
    });
    if (!result.ok) {
      console.error("[otp] email send failed:", result.error);
      throw new Error("Could not send the email code. Please use SMS instead.");
    }
  } else if (channel === "sms") {
    const result = await sendSMS(destination, `Your EventHene code is ${code}. Expires in 10 minutes.`);
    if (!result.ok) {
      console.error("[otp] SMS send failed:", result.error);
      throw new Error("Failed to send SMS. Please try email instead.");
    }
  }

  return { sent: true, channel, expiresInSeconds: OTP_EXPIRY_MINUTES * 60 };
}

export async function verifyOtp(userId: string, channel: OtpChannel, code: string, purpose?: string): Promise<{ valid: boolean; reason?: string }> {
  const otp = await db.otp.findFirst({
    where: { userId, channel: keyFor(channel, purpose), verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { valid: false, reason: "No pending code. Request a new one." };
  if (otp.expiresAt < new Date()) {
    await db.otp.delete({ where: { id: otp.id } });
    return { valid: false, reason: "Code expired. Request a new one." };
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    await db.otp.delete({ where: { id: otp.id } });
    return { valid: false, reason: "Too many attempts. Request a new code." };
  }

  if (otp.code !== code.trim()) {
    await db.otp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { valid: false, reason: "Incorrect code. Try again." };
  }

  await db.otp.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  return { valid: true };
}

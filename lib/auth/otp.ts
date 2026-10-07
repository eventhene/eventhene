import crypto from "crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function createAndSendOtp(userId: string, channel: "email", destination: string) {
  await db.otp.deleteMany({
    where: { userId, channel, verified: false },
  });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.otp.create({
    data: { userId, code, channel, expiresAt },
  });

  if (channel === "email") {
    await sendEmail({
      to: destination,
      subject: `${code} - Your EventHene verification code`,
      html: otpEmailTemplate(code),
    });
  }

  return { sent: true, channel, expiresInSeconds: OTP_EXPIRY_MINUTES * 60 };
}

export async function verifyOtp(userId: string, channel: "email", code: string): Promise<{ valid: boolean; reason?: string }> {
  const otp = await db.otp.findFirst({
    where: { userId, channel, verified: false },
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

function otpEmailTemplate(code: string): string {
  return `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:Inter,system-ui,sans-serif;color:#111;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:22px;font-weight:800;color:#1C1917;letter-spacing:-0.03em;">
        Event<span style="color:#D4A853;">Hene</span>
      </div>
    </div>
    <div style="background:#fff;border:1px solid #E5E3DE;border-radius:18px;padding:32px;text-align:center;">
      <p style="font-size:15px;color:#6B6B6B;margin:0 0 8px;">Your verification code</p>
      <p style="font-size:40px;font-weight:800;letter-spacing:8px;color:#1C1917;margin:16px 0;">${code}</p>
      <p style="font-size:13px;color:#6B6B6B;margin:16px 0 0;">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
    <p style="text-align:center;font-size:11px;color:#6B6B6B;margin-top:20px;">
      If you didn't request this, ignore this email.
    </p>
  </div>
</body>
</html>`;
}

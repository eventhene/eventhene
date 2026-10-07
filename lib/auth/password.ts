import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): { ok: boolean; reason?: string } {
  if (password.length < 8) return { ok: false, reason: "Password must be at least 8 characters." };
  if (!/[A-Z]/.test(password)) return { ok: false, reason: "Password needs at least one uppercase letter." };
  if (!/[a-z]/.test(password)) return { ok: false, reason: "Password needs at least one lowercase letter." };
  if (!/\d/.test(password)) return { ok: false, reason: "Password needs at least one number." };
  if (!/[^A-Za-z0-9]/.test(password)) return { ok: false, reason: "Password needs at least one symbol." };
  return { ok: true };
}

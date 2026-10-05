import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Minimum: 8 chars, with at least a letter and a number. */
export function validatePasswordStrength(password: string): { ok: boolean; reason?: string } {
  if (password.length < 8) return { ok: false, reason: "Password must be at least 8 characters." };
  if (!/[A-Za-z]/.test(password)) return { ok: false, reason: "Password needs at least one letter." };
  if (!/\d/.test(password)) return { ok: false, reason: "Password needs at least one number." };
  return { ok: true };
}

// In-memory sliding-window rate limiter.
// Simple, no external dependencies. Fine for a single-instance deploy.
// Swap for Redis-backed when you scale horizontally.

type Bucket = { count: number; windowStart: number };
const BUCKETS = new Map<string, Bucket>();

export async function rateLimit(
  identifier: string,
  requests: number,
  windowSec: number,
  bucket = "default"
): Promise<boolean> {
  const key = `${bucket}:${identifier}`;
  const now = Date.now();
  const windowMs = windowSec * 1000;

  const entry = BUCKETS.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    BUCKETS.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= requests) return false;
  entry.count++;
  return true;
}

// Lazy cleanup of expired buckets, every ~1,000 calls, best-effort.
let callCount = 0;
export function sweepRateLimits(windowSec = 3600) {
  if (++callCount % 1000 !== 0) return;
  const cutoff = Date.now() - windowSec * 1000;
  for (const [k, v] of BUCKETS.entries()) {
    if (v.windowStart < cutoff) BUCKETS.delete(k);
  }
}

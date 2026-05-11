import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch {
  redis = null;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, requests: number, windowSec: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${name}:${requests}:${windowSec}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, `${windowSec} s`),
        prefix: `eventhene:rl:${name}`
      })
    );
  }
  return limiters.get(key)!;
}

/** Returns true if allowed, false if rate-limited. Returns true if no Redis configured. */
export async function rateLimit(
  identifier: string,
  requests: number,
  windowSec: number,
  bucket = "default"
): Promise<boolean> {
  const limiter = getLimiter(bucket, requests, windowSec);
  if (!limiter) return true;
  const { success } = await limiter.limit(identifier);
  return success;
}

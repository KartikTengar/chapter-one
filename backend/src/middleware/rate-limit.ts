import type { Context, Next } from 'koa';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// Periodic cleanup so the map does not grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS).unref();

/**
 * Simple fixed-window in-memory rate limiter keyed by client IP.
 * Suitable for a college-scale event (~100 participants); normal player
 * workflows never hit the limit. When rate limited, the response is a
 * clear RATE_LIMITED error — never a game "wrong answer".
 */
export function createRateLimitMiddleware() {
  const durationMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
  const max = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 120;

  return async (ctx: Context, next: Next) => {
    const key = ctx.ip || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + durationMs });
    } else if (bucket.count >= max) {
      ctx.status = 429;
      ctx.body = {
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment and try again.' },
      };
      return;
    } else {
      bucket.count += 1;
    }

    await next();
  };
}
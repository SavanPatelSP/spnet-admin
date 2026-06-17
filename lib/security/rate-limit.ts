interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const STORE = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;

let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of STORE.entries()) {
    if (now > entry.resetAt) {
      STORE.delete(key);
    }
  }
  if (STORE.size > 10000) {
    const entries = [...STORE.entries()]
      .filter(([, e]) => e.resetAt > now)
      .sort(([, a], [, b]) => a.resetAt - b.resetAt);
    STORE.clear();
    for (const [key, entry] of entries.slice(-5000)) {
      STORE.set(key, entry);
    }
  }
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { windowMs: 60_000, maxRequests: 60 }
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();

  const now = Date.now();
  const entry = STORE.get(key);

  if (!entry || now > entry.resetAt) {
    STORE.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export const RATE_LIMIT_CONFIGS = {
  login: { windowMs: 60_000, maxRequests: 5 },
  api: { windowMs: 60_000, maxRequests: 100 },
  auth: { windowMs: 60_000, maxRequests: 10 },
  sensitive: { windowMs: 60_000, maxRequests: 30 },
  public: { windowMs: 60_000, maxRequests: 200 },
} as const;

export type RateLimitScope = keyof typeof RATE_LIMIT_CONFIGS;

export function rateLimitKey(scope: RateLimitScope, identifier: string): string {
  return `rl:${scope}:${identifier}`;
}

export function getRateLimitHeaders(
  result: { allowed: boolean; remaining: number; resetAt: number }
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.remaining + (result.allowed ? 1 : 0)),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

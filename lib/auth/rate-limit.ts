interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// In-memory store: Map<identifier, RateLimitEntry>
const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60 * 1000); // Cleanup every minute

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    return { allowed: true, remaining: MAX_ATTEMPTS, resetIn: 0 };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - entry.count);
  const resetIn = Math.ceil((entry.resetAt - now) / 1000);

  return {
    allowed: entry.count < MAX_ATTEMPTS,
    remaining,
    resetIn,
  };
}

export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    store.set(identifier, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
  } else {
    entry.count++;
  }
}

export function clearAttempts(identifier: string): void {
  store.delete(identifier);
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(MAX_ATTEMPTS),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetIn),
  };
}

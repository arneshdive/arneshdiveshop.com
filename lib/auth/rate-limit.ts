/**
 * Failed-attempt rate limiting, backed by the database.
 *
 * An in-memory Map was used here previously. On Vercel that silently does
 * almost nothing: each serverless instance keeps its own counter, so an
 * attacker spreading requests across instances never hits the limit, while
 * a legitimate user can be told to wait by whichever instance happens to
 * hold their tally. State has to be shared to mean anything.
 */

import { db, rateLimits } from '@/lib/db';
import { eq, lt, sql } from 'drizzle-orm';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
}

/** State of a key with no attempts recorded against it. */
export const UNTHROTTLED: RateLimitResult = {
  allowed: true,
  remaining: MAX_ATTEMPTS,
  resetIn: 0,
};

function toResult(entry?: { count: number; resetAt: Date } | null): RateLimitResult {
  if (!entry) return UNTHROTTLED;

  const resetIn = entry.resetAt.getTime() - Date.now();
  if (resetIn <= 0) return UNTHROTTLED;

  return {
    allowed: entry.count < MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - entry.count),
    resetIn: Math.ceil(resetIn / 1000),
  };
}

/**
 * Read the current state for a key without recording anything.
 */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const entry = await db.query.rateLimits.findFirst({
    where: eq(rateLimits.key, key),
  });
  return toResult(entry);
}

/**
 * Count one failed attempt and return the resulting state.
 *
 * The upsert rolls the window over in the same statement it increments, so
 * two concurrent failures can't both read a stale count and each write back
 * "1".
 */
export async function recordFailedAttempt(key: string): Promise<RateLimitResult> {
  const resetAt = new Date(Date.now() + WINDOW_MS);

  // Keys that are never seen again would otherwise linger forever; nothing
  // else prunes this table.
  await db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date()));

  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.resetAt} < now() THEN 1 ELSE ${rateLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${rateLimits.resetAt} < now() THEN ${resetAt} ELSE ${rateLimits.resetAt} END`,
      },
    })
    .returning();

  return toResult(row);
}

/**
 * Forget a key's attempts, e.g. after a successful sign-in.
 */
export async function clearAttempts(key: string): Promise<void> {
  await db.delete(rateLimits).where(eq(rateLimits.key, key));
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(MAX_ATTEMPTS),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetIn),
  };
}

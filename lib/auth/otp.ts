/**
 * OTP generation and verification for email-based authentication.
 *
 * There is exactly one live code per email address, regardless of whether
 * the user arrived via "Masuk" or "Daftar". An earlier design keyed codes
 * by purpose (`login:` / `register:`), which let two valid codes exist at
 * once behind two identical-looking emails — users would enter a perfectly
 * fresh code and be told it had expired. Verification is deliberately
 * purpose-agnostic now: every path here ends in a session for the same
 * address anyway, so separating them bought no security, only failures.
 */

import { db, otpCodes } from '@/lib/db';
import { eq, and, gt, lt } from 'drizzle-orm';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 60;

/**
 * Why a verification attempt failed. Callers map these to distinct
 * messages — collapsing them into one "invalid or expired" string is what
 * made this bug so hard to diagnose from user reports.
 */
export type OtpFailureReason = 'not_found' | 'expired' | 'mismatch';

export type OtpResult =
  | { ok: true }
  | { ok: false; reason: OtpFailureReason };

/**
 * Generate a random numeric OTP of the given length.
 */
export function generateOtp(length: number = OTP_LENGTH): string {
  const digits = '0123456789';
  let otp = '';

  // Use crypto.getRandomValues for secure random generation
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    otp += digits[array[i]! % digits.length];
  }

  return otp;
}

/**
 * Store an OTP for an email, replacing any code already issued to it.
 *
 * The upsert is a single statement so that concurrent requests (a
 * double-tapped "kirim ulang", say) can't interleave into a state where
 * the old code is gone and the new one was never written.
 */
export async function storeOtp(email: string, code: string): Promise<void> {
  const normalizedEmail = email.toLowerCase();
  const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Opportunistic cleanup — cheap enough to run per request, and keeps the
  // table from growing without bound since nothing else prunes it.
  await db.delete(otpCodes).where(lt(otpCodes.expires, new Date()));

  await db
    .insert(otpCodes)
    .values({ email: normalizedEmail, code, expires })
    .onConflictDoUpdate({
      target: otpCodes.email,
      set: { code, expires, createdAt: new Date() },
    });
}

/**
 * Verify an OTP and consume it in one atomic step, so the same code can
 * never be redeemed twice by concurrent requests.
 *
 * On failure a second lookup classifies why, purely to produce an accurate
 * message. That lookup is not part of the security decision — the delete
 * above already made it.
 */
export async function verifyOtp(email: string, code: string): Promise<OtpResult> {
  const normalizedEmail = email.toLowerCase();

  const deleted = await db
    .delete(otpCodes)
    .where(
      and(
        eq(otpCodes.email, normalizedEmail),
        eq(otpCodes.code, code),
        gt(otpCodes.expires, new Date()),
      ),
    )
    .returning();

  if (deleted.length > 0) {
    return { ok: true };
  }

  const existing = await db.query.otpCodes.findFirst({
    where: eq(otpCodes.email, normalizedEmail),
  });

  if (!existing) {
    return { ok: false, reason: 'not_found' };
  }

  if (existing.code !== code) {
    return { ok: false, reason: 'mismatch' };
  }

  return { ok: false, reason: 'expired' };
}

/**
 * Discard the code issued to an email, if any.
 */
export async function clearOtp(email: string): Promise<void> {
  await db.delete(otpCodes).where(eq(otpCodes.email, email.toLowerCase()));
}

/**
 * Get OTP expiry time in minutes.
 */
export function getOtpExpiryMinutes(): number {
  return OTP_EXPIRY_MINUTES;
}

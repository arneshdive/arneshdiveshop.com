/**
 * OTP generation and verification utilities
 * Used for password reset and email verification
 */

import { db, verificationTokens } from '@/lib/db';
import { eq, and, gt } from 'drizzle-orm';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 15;

/**
 * Generate a random numeric OTP of specified length
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
 * Store an OTP token for password reset
 * @param email - User's email address
 * @param otp - The OTP to store
 * @returns The stored token
 */
export async function storeOtp(email: string, otp: string): Promise<void> {
  const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  
  // Delete any existing tokens for this email
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email.toLowerCase()));
  
  // Insert new token
  await db.insert(verificationTokens).values({
    identifier: email.toLowerCase(),
    token: otp,
    expires,
  });
}

/**
 * Verify an OTP token
 * @param email - User's email address
 * @param otp - The OTP to verify
 * @returns true if valid, false otherwise
 */
export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const now = new Date();
  
  const token = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, email.toLowerCase()),
      eq(verificationTokens.token, otp),
      gt(verificationTokens.expires, now)
    ),
  });
  
  return !!token;
}

/**
 * Delete an OTP token after successful use
 * @param email - User's email address
 */
export async function deleteOtp(email: string): Promise<void> {
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email.toLowerCase()));
}

/**
 * Get OTP expiry time in minutes
 */
export function getOtpExpiryMinutes(): number {
  return OTP_EXPIRY_MINUTES;
}

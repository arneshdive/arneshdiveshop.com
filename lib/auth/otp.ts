/**
 * OTP generation and verification utilities
 * Used for password reset and email verification
 */

import { db, verificationTokens } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 60;

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
  
  // Debug logging for production troubleshooting
  console.log('[OTP Store] Creating OTP:', {
    email: email.toLowerCase(),
    otp,
    serverTime: new Date().toISOString(),
    expiryTime: expires.toISOString(),
    expiryMinutes: OTP_EXPIRY_MINUTES,
    serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  
  // Delete any existing tokens for this email
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email.toLowerCase()));
  
  // Insert new token
  await db.insert(verificationTokens).values({
    identifier: email.toLowerCase(),
    token: otp,
    expires,
  });
  
  console.log('[OTP Store] OTP stored successfully');
}

/**
 * Verify an OTP token
 * @param email - User's email address
 * @param otp - The OTP to verify
 * @returns true if valid, false otherwise
 */
export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const now = new Date();
  
  // Debug logging for production troubleshooting
  console.log('[OTP Verify] Checking OTP:', {
    email: email.toLowerCase(),
    otpProvided: otp,
    serverTime: now.toISOString(),
    serverTimeLocal: now.toString(),
  serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  
  // First, find the token without expiry check to see what's stored
  const storedToken = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, email.toLowerCase()),
      eq(verificationTokens.token, otp)
    ),
  });
  
  if (!storedToken) {
    console.log('[OTP Verify] No token found for email/otp combination');
    return false;
  }
  
  console.log('[OTP Verify] Found token:', {
    tokenIdentifier: storedToken.identifier,
    tokenExpires: storedToken.expires,
    tokenExpiresISO: storedToken.expires instanceof Date ? storedToken.expires.toISOString() : storedToken.expires,
    tokenExpiresType: typeof storedToken.expires,
    isExpired: storedToken.expires instanceof Date ? storedToken.expires < now : new Date(storedToken.expires) < now,
  });
  
  // Check if expired
  const isExpired = storedToken.expires instanceof Date 
    ? storedToken.expires < now 
    : new Date(storedToken.expires) < now;
  
  if (isExpired) {
    console.log('[OTP Verify] Token is expired');
    return false;
  }
  
  console.log('[OTP Verify] Token is valid');
  return true;
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

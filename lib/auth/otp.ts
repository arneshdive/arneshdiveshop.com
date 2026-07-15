/**
 * OTP generation and verification utilities
 * Used for email-based authentication flows
 */

import { db, verificationTokens } from '@/lib/db';
import { eq, and, gt } from 'drizzle-orm';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 60;

/**
 * Token purposes to prevent collision between different OTP flows
 */
export type TokenPurpose = 'login' | 'register' | 'verify';

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
 * Store an OTP token with a specific purpose
 * @param email - User's email address
 * @param otp - The OTP to store
 * @param purpose - The purpose of this OTP (login, register, verify)
 */
export async function storeOtp(
  email: string, 
  otp: string, 
  purpose: TokenPurpose
): Promise<void> {
  const identifier = `${purpose}:${email.toLowerCase()}`;
  const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  
  // Debug logging - DO NOT log OTP in plaintext
  console.log('[OTP Store] Creating OTP:', {
    purpose,
    email: email.toLowerCase(),
    identifier,
    serverTime: new Date().toISOString(),
    expiryTime: expires.toISOString(),
    expiryMinutes: OTP_EXPIRY_MINUTES,
  });
  
  // Delete any existing tokens for this purpose/email combination
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));
  
  // Insert new token
  await db.insert(verificationTokens).values({
    identifier,
    token: otp,
    expires,
  });
  
  console.log('[OTP Store] OTP stored successfully');
}

/**
 * Verify and delete an OTP token in a single atomic operation
 * This prevents race conditions where the same OTP could be used twice
 * 
 * @param email - User's email address
 * @param otp - The OTP to verify
 * @param purpose - The expected purpose of the OTP
 * @returns true if valid and deleted, false otherwise
 */
export async function verifyAndDeleteOtp(
  email: string,
  otp: string,
  purpose: TokenPurpose
): Promise<boolean> {
  const identifier = `${purpose}:${email.toLowerCase()}`;
  
  // Debug logging - DO NOT log OTP in plaintext
  console.log('[OTP Verify] Checking OTP:', {
    purpose,
    email: email.toLowerCase(),
    identifier,
    serverTime: new Date().toISOString(),
  });
  
  // Atomic operation: delete the token if it matches AND is not expired
  // This prevents race conditions - only one request will successfully delete
  const deleted = await db
    .delete(verificationTokens)
    .where(and(
      eq(verificationTokens.identifier, identifier),
      eq(verificationTokens.token, otp),
      gt(verificationTokens.expires, new Date())
    ))
    .returning();
  
  if (deleted.length > 0) {
    console.log('[OTP Verify] Token verified and deleted');
    return true;
  }
  
  console.log('[OTP Verify] Token not found, expired, or already used');
  return false;
}

/**
 * Get OTP expiry time in minutes
 */
export function getOtpExpiryMinutes(): number {
  return OTP_EXPIRY_MINUTES;
}

// ============================================================================
// LEGACY FUNCTIONS - These will be removed after migration
// ============================================================================

/**
 * @deprecated Use verifyAndDeleteOtp instead for atomic operation
 * Verify an OTP token without deleting it
 * @param email - User's email address
 * @param otp - The OTP to verify
 * @returns true if valid, false otherwise
 */
export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const now = new Date();
  
  console.log('[OTP Verify Legacy] Checking OTP:', {
    email: email.toLowerCase(),
    serverTime: now.toISOString(),
  });
  
  // Check all possible purposes for backward compatibility during migration
  const purposes: TokenPurpose[] = ['login', 'register', 'verify'];
  
  for (const purpose of purposes) {
    const identifier = `${purpose}:${email.toLowerCase()}`;
    const storedToken = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, otp)
      ),
    });
    
    if (storedToken) {
      const isExpired = storedToken.expires instanceof Date 
        ? storedToken.expires < now 
        : new Date(storedToken.expires) < now;
      
      if (!isExpired) {
        console.log(`[OTP Verify Legacy] Found valid token with purpose: ${purpose}`);
        return true;
      }
    }
  }
  
  // Also check legacy format (no prefix) for migration
  const legacyToken = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, email.toLowerCase()),
      eq(verificationTokens.token, otp)
    ),
  });
  
  if (legacyToken) {
    const isExpired = legacyToken.expires instanceof Date 
      ? legacyToken.expires < now 
      : new Date(legacyToken.expires) < now;
    
    if (!isExpired) {
      console.log('[OTP Verify Legacy] Found valid legacy token');
      return true;
    }
  }
  
  console.log('[OTP Verify Legacy] No valid token found');
  return false;
}

/**
 * @deprecated Use verifyAndDeleteOtp instead for atomic operation
 * Delete an OTP token after successful use
 * @param email - User's email address
 */
export async function deleteOtp(email: string): Promise<void> {
  // Delete tokens with any purpose prefix
  const purposes: TokenPurpose[] = ['login', 'register', 'verify'];
  
  for (const purpose of purposes) {
    const identifier = `${purpose}:${email.toLowerCase()}`;
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));
  }
  
  // Also delete legacy format
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email.toLowerCase()));
}

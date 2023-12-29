import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { generateOtp, storeOtp, getOtpExpiryMinutes } from '@/lib/auth/otp';
import { sendVerificationEmail } from '@/lib/email';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  getRateLimitHeaders,
} from '@/lib/auth/rate-limit';
import { eq } from 'drizzle-orm';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan, coba lagi dalam ${Math.ceil(rateLimitResult.resetIn / 60)} menit`,
          retryAfter: rateLimitResult.resetIn,
        },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate OTP and send
      const otp = generateOtp();
      await storeOtp(normalizedEmail, otp);
      await sendVerificationEmail(normalizedEmail, otp, getOtpExpiryMinutes());
    }

    // Clear rate limit on successful request
    clearAttempts(clientIp);

    return NextResponse.json(
      { 
        success: true,
        message: 'Jika email terdaftar, Anda akan menerima kode OTP untuk login',
        expires: getOtpExpiryMinutes(),
        email: normalizedEmail,
      },
      { status: 200, headers: getRateLimitHeaders(checkRateLimit(clientIp)) }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

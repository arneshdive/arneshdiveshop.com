import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users, type NewUser } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generateOtp, storeOtp, getOtpExpiryMinutes } from '@/lib/auth/otp';
import { sendVerificationEmail } from '@/lib/email';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  getRateLimitHeaders,
  UNTHROTTLED,
} from '@/lib/auth/rate-limit';

/**
 * POST /api/auth/request-otp
 *
 * Single entry point for both "Masuk" and "Daftar" — it issues one code per
 * email either way. `name` is only needed to create an account that doesn't
 * exist yet; the UI collects it on the Daftar tab.
 */
const requestOtpSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  name: z.string().min(1).max(100).optional(),
});

// Returned when we deliberately don't say whether an address is registered.
const GENERIC_RESPONSE = {
  success: true,
  message: 'Jika email terdaftar, Anda akan menerima kode OTP',
  expires: getOtpExpiryMinutes(),
};

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

    const rateLimitResult = await checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan, coba lagi dalam ${Math.ceil(rateLimitResult.resetIn / 60)} menit`,
          retryAfter: rateLimitResult.resetIn,
        },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
      );
    }

    const body = await request.json();
    const result = requestOtpSchema.safeParse(body);

    if (!result.success) {
      const afterFailure = await recordFailedAttempt(clientIp);
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
      return NextResponse.json(
        { error: 'Data tidak valid', details: errors },
        { status: 400, headers: getRateLimitHeaders(afterFailure) },
      );
    }

    const { email, name } = result.data;
    const normalizedEmail = email.toLowerCase();

    let user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      // No account and no name to create one with: this is the Masuk tab.
      // Report success anyway so the endpoint can't be used to discover
      // which addresses are registered.
      if (!name) {
        await clearAttempts(clientIp);
        return NextResponse.json(GENERIC_RESPONSE, {
          status: 200,
          headers: getRateLimitHeaders(UNTHROTTLED),
        });
      }

      const [created] = await db
        .insert(users)
        .values({
          name,
          email: normalizedEmail,
          role: 'customer',
        } as NewUser)
        .returning();

      if (!created) {
        throw new Error('Failed to create user');
      }
      user = created;
    }

    // An existing account gets a code whichever tab it came from — including
    // an already-verified one landing on Daftar, which used to dead-end on
    // "Email sudah terdaftar" with no way forward.
    const otp = generateOtp();
    await storeOtp(normalizedEmail, otp);

    const emailResult = await sendVerificationEmail(
      normalizedEmail,
      otp,
      getOtpExpiryMinutes(),
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Gagal mengirim email. Coba lagi nanti.' },
        { status: 500 },
      );
    }

    await clearAttempts(clientIp);

    return NextResponse.json(
      {
        success: true,
        message: 'Kode OTP telah dikirim ke email Anda',
        expires: getOtpExpiryMinutes(),
      },
      { status: 200, headers: getRateLimitHeaders(UNTHROTTLED) },
    );
  } catch (error) {
    console.error('Request OTP error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 },
    );
  }
}

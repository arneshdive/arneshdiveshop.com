import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyOtp, type OtpFailureReason } from '@/lib/auth/otp';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  getRateLimitHeaders,
} from '@/lib/auth/rate-limit';

/**
 * POST /api/auth/verify-otp
 *
 * Consumes the code issued by /api/auth/request-otp and signs the user in.
 * Whether this is a first sign-in or a returning one is decided from the
 * account's own state, not from anything the client tells us — the old
 * split into verify-login/verify-register meant a page reload could send
 * a valid code to the wrong endpoint and have it rejected.
 */
const verifyOtpSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  otp: z.string().length(6, 'Kode OTP harus 6 digit'),
});

const FAILURE_MESSAGES: Record<OtpFailureReason, string> = {
  mismatch: 'Kode OTP salah. Periksa kembali kode di email Anda.',
  expired: 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.',
  not_found: 'Kode OTP sudah digunakan atau belum diminta. Silakan minta kode baru.',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = verifyOtpSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
      return NextResponse.json(
        { error: 'Data tidak valid', details: errors },
        { status: 400 },
      );
    }

    const { email, otp } = result.data;
    const normalizedEmail = email.toLowerCase();
    const rateLimitKey = `verify-otp:${normalizedEmail}`;

    const rateLimitResult = await checkRateLimit(rateLimitKey);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Coba lagi nanti.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
      );
    }

    const otpResult = await verifyOtp(normalizedEmail, otp);

    if (!otpResult.ok) {
      const afterFailure = await recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: FAILURE_MESSAGES[otpResult.reason] },
        { status: 400, headers: getRateLimitHeaders(afterFailure) },
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 },
      );
    }

    if (user.blockedAt) {
      return NextResponse.json(
        { error: 'Akun Anda diblokir. Hubungi administrator.' },
        { status: 403 },
      );
    }

    // First successful code for this account also confirms the address.
    const emailVerified = user.emailVerified ?? new Date();
    if (!user.emailVerified) {
      await db
        .update(users)
        .set({ emailVerified, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    const token = await createSession({
      userId: user.id,
      role: user.role,
    });

    await setSessionCookie(token);
    await clearAttempts(rateLimitKey);

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 },
    );
  }
}

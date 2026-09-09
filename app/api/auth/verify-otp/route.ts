import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users, type User } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyOtp, type OtpFailureReason } from '@/lib/auth/otp';
import { createSession, setSessionCookie, getSession } from '@/lib/auth/session';
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

function signedInResponse(user: User, emailVerified: Date) {
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
}

/**
 * The account this request is already signed in as, if it is the same one
 * the code was submitted for.
 *
 * Looked up by the session's own user id and only then compared to the
 * submitted address, so a caller can't turn someone else's session into a
 * sign-in for an address they don't hold.
 */
async function activeSessionUser(email: string): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });

  if (!user || user.blockedAt || user.email !== email) return null;
  return user;
}

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
      // A code that is gone is usually a code this same browser just spent.
      // Signing in is a slow hop — cold function, cold database, then a
      // client-side navigation with no visible progress — so people submit
      // the form again while the first attempt is still landing. That second
      // request found the row already consumed and reported a hard failure
      // over a session that had, in fact, just been created: the user was
      // logged in and being told their code was expired at the same time.
      //
      // If the request already carries a valid session for this very
      // account, the sign-in it is asking for has happened. Say so. This
      // grants nothing — the caller is that user already — it just stops a
      // duplicate submit from overwriting a success with an error.
      const signedInUser = await activeSessionUser(normalizedEmail);
      if (signedInUser) {
        await clearAttempts(rateLimitKey);
        return signedInResponse(signedInUser, signedInUser.emailVerified ?? new Date());
      }

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

    return signedInResponse(user, emailVerified);
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 },
    );
  }
}

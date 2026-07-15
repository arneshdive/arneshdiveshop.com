import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyAndDeleteOtp } from '@/lib/auth/otp';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { checkRateLimit, recordFailedAttempt, getRateLimitHeaders } from '@/lib/auth/rate-limit';

const verifyLoginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  otp: z.string().length(6, 'Kode OTP harus 6 digit'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = verifyLoginSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
      return NextResponse.json(
        { error: 'Data tidak valid', details: errors },
        { status: 400 }
      );
    }

    const { email, otp } = result.data;

    // Rate limit by email to prevent brute force
    const rateResult = checkRateLimit(`verify-login:${email.toLowerCase()}`);
    
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Coba lagi nanti.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateResult),
        }
      );
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify OTP with 'login' purpose (atomic: verify + delete)
    const isValid = await verifyAndDeleteOtp(email, otp, 'login');

    if (!isValid) {
      recordFailedAttempt(`verify-login:${email.toLowerCase()}`);
      return NextResponse.json(
        { error: 'Kode OTP tidak valid atau sudah kedaluwarsa' },
        { status: 400 }
      );
    }

    // Check if user is blocked
    if (user.blockedAt) {
      return NextResponse.json(
        { error: 'Akun Anda diblokir. Hubungi administrator.' },
        { status: 403 }
      );
    }

    // Create session for the user
    const token = await createSession({
      userId: user.id,
      role: user.role,
    });

    await setSessionCookie(token);

    // Return user without password
    return NextResponse.json({ 
      success: true, 
      message: 'Login berhasil',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Verify login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

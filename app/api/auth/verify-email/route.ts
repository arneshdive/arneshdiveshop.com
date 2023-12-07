import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyOtp, deleteOtp } from '@/lib/auth/otp';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { checkRateLimit, recordFailedAttempt, getRateLimitHeaders } from '@/lib/auth/rate-limit';

const verifyEmailSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  otp: z.string().length(6, 'Kode OTP harus 6 digit'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = verifyEmailSchema.safeParse(body);

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
    const rateResult = checkRateLimit(`verify:${email.toLowerCase()}`);
    
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

    // Verify OTP first (always required for login)
    const isValid = await verifyOtp(email, otp);

    if (!isValid) {
      recordFailedAttempt(`verify:${email.toLowerCase()}`);
      return NextResponse.json(
        { error: 'Kode OTP tidak valid atau sudah kedaluwarsa' },
        { status: 400 }
      );
    }

    // Delete the OTP after successful verification (one-time use)
    await deleteOtp(email);

    // Mark email as verified if not already
    if (!user.emailVerified) {
      await db
        .update(users)
        .set({ 
          emailVerified: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    // Create session for the user (auto-login after verification)
    const token = await createSession({
      userId: user.id,
      role: user.role,
    });

    await setSessionCookie(token);

    // Return user without password
    return NextResponse.json({ 
      success: true, 
      message: 'Email berhasil diverifikasi',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: new Date(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

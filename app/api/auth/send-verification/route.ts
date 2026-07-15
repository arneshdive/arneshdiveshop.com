import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generateOtp, storeOtp, getOtpExpiryMinutes } from '@/lib/auth/otp';
import { sendVerificationEmail } from '@/lib/email';
import { getRateLimitHeaders } from '@/lib/auth/rate-limit';

const sendVerificationSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

// Simple in-memory rate limiting for email sending (per IP)
const emailRateLimit = new Map<string, { count: number; resetAt: number }>();
const EMAIL_RATE_LIMIT = 3; // 3 emails per 15 minutes
const EMAIL_RATE_WINDOW = 15 * 60 * 1000;

function checkEmailRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = emailRateLimit.get(ip);

  if (!entry || entry.resetAt < now) {
    return { allowed: true, remaining: EMAIL_RATE_LIMIT, resetIn: 0 };
  }

  const remaining = Math.max(0, EMAIL_RATE_LIMIT - entry.count);
  const resetIn = Math.ceil((entry.resetAt - now) / 1000);

  return {
    allowed: entry.count < EMAIL_RATE_LIMIT,
    remaining,
    resetIn,
  };
}

function recordEmailAttempt(ip: string): void {
  const now = Date.now();
  const entry = emailRateLimit.get(ip);

  if (!entry || entry.resetAt < now) {
    emailRateLimit.set(ip, {
      count: 1,
      resetAt: now + EMAIL_RATE_WINDOW,
    });
  } else {
    entry.count++;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for') ?? 
               request.headers.get('x-real-ip') ?? 
               'unknown';
    const rateResult = checkEmailRateLimit(ip);
    
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateResult),
        }
      );
    }

    const body = await request.json();
    const result = sendVerificationSchema.safeParse(body);

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

    const { email } = result.data;

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({ 
        success: true, 
        message: 'Jika email terdaftar, kode verifikasi akan dikirim.' 
      });
    }

    // If already verified, no need to send
    if (user.emailVerified) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email sudah terverifikasi.' 
      });
    }

    // Generate OTP with 'verify' purpose and store it
    const otp = generateOtp();
    await storeOtp(email, otp, 'verify');
    
    // Send verification email
    const emailResult = await sendVerificationEmail(email, otp, getOtpExpiryMinutes());

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Gagal mengirim email verifikasi. Coba lagi nanti.' },
        { status: 500 }
      );
    }

    recordEmailAttempt(ip);

    return NextResponse.json({ 
      success: true, 
      message: 'Kode verifikasi telah dikirim ke email Anda.' 
    });
  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

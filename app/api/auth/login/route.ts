import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { compare } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  getRateLimitHeaders,
} from '@/lib/auth/rate-limit';
import { eq } from 'drizzle-orm';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
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
        { error: 'Email atau password salah' },
        { status: 401, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const { email, password } = result.data;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user || !user.password) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Verify password
    const isValid = await compare(password, user.password);
    if (!isValid) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Clear rate limit on successful login
    clearAttempts(clientIp);

    // Create session
    const token = await createSession({
      userId: user.id,
      role: user.role,
    });

    await setSessionCookie(token);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    const newRateLimitResult = checkRateLimit(clientIp);
    return NextResponse.json(
      { user: userWithoutPassword },
      { status: 200, headers: getRateLimitHeaders(newRateLimitResult) }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db, subscribers } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { checkRateLimit, recordFailedAttempt } from '@/lib/auth/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email tidak valid' },
        { status: 400 }
      );
    }

    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `subscribe:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: `Terlalu banyak permintaan. Coba lagi dalam ${rateLimit.resetIn} detik.` },
        { status: 429 }
      );
    }

    // Check if already subscribed
    const existing = await db.query.subscribers.findFirst({
      where: eq(subscribers.email, email),
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { message: 'Email sudah terdaftar sebagai subscriber' },
          { status: 200 }
        );
      } else {
        // Reactivate unsubscribed user
        await db
          .update(subscribers)
          .set({
            isActive: true,
            unsubscribedAt: null,
          })
          .where(eq(subscribers.id, existing.id));

        return NextResponse.json(
          { message: 'Berhasil berlangganan kembali!' },
          { status: 200 }
        );
      }
    }

    // Create new subscriber
    await db.insert(subscribers).values({
      email,
    });

    return NextResponse.json(
      { message: 'Terima kasih telah berlangganan!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

import { NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { db, subscribers } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { checkRateLimit, recordFailedAttempt } from '@/lib/auth/rate-limit';
import { routing } from '@/i18n/routing';

// This route lives outside app/[locale]/** (proxy.ts deliberately never
// runs next-intl's locale detection on /api/**), so there's no request-scoped
// locale to read implicitly — the NEXT_LOCALE cookie next-intl sets (via the
// language switcher, or locale negotiation on a storefront page) is read
// directly instead, with the same default fallback as everywhere else.
function getRequestLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  return hasLocale(routing.locales, cookieLocale) ? cookieLocale : routing.defaultLocale;
}

export async function POST(request: NextRequest) {
  const locale = getRequestLocale(request);
  const t = await getTranslations({ locale, namespace: 'newsletter' });

  try {
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: t('errors.invalidEmail') },
        { status: 400 }
      );
    }

    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `subscribe:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      await recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: t('errors.rateLimited', { seconds: rateLimit.resetIn }) },
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
          { message: t('success.alreadySubscribed') },
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
          { message: t('success.reactivated') },
          { status: 200 }
        );
      }
    }

    // Create new subscriber
    await db.insert(subscribers).values({
      email,
    });

    return NextResponse.json(
      { message: t('success.subscribed') },
      { status: 201 }
    );
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: t('errors.generic') },
      { status: 500 }
    );
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

import { db, checkoutSessions } from '@/lib/db';
import { eq, and, gt, isNull, or, lt } from 'drizzle-orm';
import type { CheckoutSessionInput } from '@/lib/utils/indonesia-address';
import { getCartWithItems } from './cart';

const CHECKOUT_SESSION_DURATION_HOURS = 24;

export interface CheckoutSessionWithCart {
  id: string;
  userId: string | null;
  guestId: string | null;
  cartId: string | null;
  email: string;
  phone: string;
  fullName: string;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  notes: string | null;
  lat: string | null;
  lng: string | null;
  formattedAddress: string | null;
  rajaongkirCityId: string | null;
  shippingMethod: string | null;
  subtotalCents: number | null;
  shippingCents: number | null;
  totalCents: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
  cart: Awaited<ReturnType<typeof getCartWithItems>> | null;
}

/**
 * Create a new checkout session
 */
export async function createCheckoutSession(
  data: CheckoutSessionInput & {
    userId?: string;
    guestId?: string;
    cartId?: string;
  }
): Promise<CheckoutSessionWithCart> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CHECKOUT_SESSION_DURATION_HOURS);

  const [session] = await db
    .insert(checkoutSessions)
    .values({
      userId: data.userId || null,
      guestId: data.guestId || null,
      cartId: data.cartId || null,
      email: data.email,
      phone: data.phone,
      fullName: data.fullName,
      address1: data.address1,
      address2: data.address2 || null,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      country: data.country || 'Indonesia',
      notes: data.notes || null,
      lat: data.lat || null,
      lng: data.lng || null,
      formattedAddress: data.formattedAddress || null,
      shippingMethod: data.shippingMethod || 'jne-regular',
      expiresAt,
    })
    .returning();

  if (!session) {
    throw new Error('Failed to create checkout session');
  }

  // Fetch cart data
  let cart = null;
  if (data.cartId) {
    cart = await getCartWithItems(data.cartId);
  }

  return {
    ...session,
    cart,
  };
}

/**
 * Get checkout session by ID
 */
export async function getCheckoutSessionById(
  sessionId: string
): Promise<CheckoutSessionWithCart | null> {
  const session = await db.query.checkoutSessions.findFirst({
    where: eq(checkoutSessions.id, sessionId),
  });

  if (!session) {
    return null;
  }

  // Fetch cart data
  let cart = null;
  if (session.cartId) {
    cart = await getCartWithItems(session.cartId);
  }

  return {
    ...session,
    cart,
  };
}

/**
 * Get checkout session by user ID
 */
export async function getCheckoutSessionByUserId(
  userId: string
): Promise<CheckoutSessionWithCart | null> {
  const session = await db.query.checkoutSessions.findFirst({
    where: and(
      eq(checkoutSessions.userId, userId),
      eq(checkoutSessions.status, 'pending'),
      gt(checkoutSessions.expiresAt, new Date())
    ),
    orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
  });

  if (!session) {
    return null;
  }

  // Fetch cart data
  let cart = null;
  if (session.cartId) {
    cart = await getCartWithItems(session.cartId);
  }

  return {
    ...session,
    cart,
  };
}

/**
 * Get checkout session by guest ID
 */
export async function getCheckoutSessionByGuestId(
  guestId: string
): Promise<CheckoutSessionWithCart | null> {
  const session = await db.query.checkoutSessions.findFirst({
    where: and(
      eq(checkoutSessions.guestId, guestId),
      eq(checkoutSessions.status, 'pending'),
      gt(checkoutSessions.expiresAt, new Date())
    ),
    orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
  });

  if (!session) {
    return null;
  }

  // Fetch cart data
  let cart = null;
  if (session.cartId) {
    cart = await getCartWithItems(session.cartId);
  }

  return {
    ...session,
    cart,
  };
}

/**
 * Update checkout session
 */
export async function updateCheckoutSession(
  sessionId: string,
  data: Partial<CheckoutSessionInput> & { rajaongkirCityId?: string }
): Promise<CheckoutSessionWithCart | null> {
  const [session] = await db
    .update(checkoutSessions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(checkoutSessions.id, sessionId))
    .returning();

  if (!session) {
    return null;
  }

  // Fetch cart data
  let cart = null;
  if (session.cartId) {
    cart = await getCartWithItems(session.cartId);
  }

  return {
    ...session,
    cart,
  };
}

/**
 * Update checkout session totals
 */
export async function updateCheckoutSessionTotals(
  sessionId: string,
  totals: {
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
  }
): Promise<void> {
  await db
    .update(checkoutSessions)
    .set({
      ...totals,
      updatedAt: new Date(),
    })
    .where(eq(checkoutSessions.id, sessionId));
}

/**
 * Mark checkout session as completed
 */
export async function completeCheckoutSession(sessionId: string): Promise<void> {
  await db
    .update(checkoutSessions)
    .set({
      status: 'completed',
      updatedAt: new Date(),
    })
    .where(eq(checkoutSessions.id, sessionId));
}

/**
 * Expire checkout session
 */
export async function expireCheckoutSession(sessionId: string): Promise<void> {
  await db
    .update(checkoutSessions)
    .set({
      status: 'expired',
      updatedAt: new Date(),
    })
    .where(eq(checkoutSessions.id, sessionId));
}

/**
 * Delete checkout session
 */
export async function deleteCheckoutSession(sessionId: string): Promise<void> {
  await db.delete(checkoutSessions).where(eq(checkoutSessions.id, sessionId));
}

/**
 * Clean up expired checkout sessions (can be run as a cron job)
 */
export async function cleanupExpiredCheckoutSessions(): Promise<void> {
  // Mark all pending sessions that have expired as expired
  await db
    .update(checkoutSessions)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(
      and(
        eq(checkoutSessions.status, 'pending'),
        or(
          lt(checkoutSessions.expiresAt, new Date()),
          and(
            isNull(checkoutSessions.expiresAt),
            lt(checkoutSessions.createdAt, new Date(Date.now() - CHECKOUT_SESSION_DURATION_HOURS * 60 * 60 * 1000))
          )
        )
      )
    );
}

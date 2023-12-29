import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth/session';
import {
  getCheckoutSessionByUserId,
  getCheckoutSessionByGuestId,
  completeCheckoutSession,
  getCheckoutSessionById,
} from '@/lib/queries/checkout';
import { z } from 'zod';

const GUEST_COOKIE_NAME = 'guest_id';

const completeCheckoutSchema = z.object({
  sessionId: z.string().optional(), // Optional, will use current session if not provided
  paymentId: z.string().optional(), // Payment reference for F-013
});

/**
 * POST /api/checkout/complete - Complete checkout session
 *
 * This endpoint is called after successful payment to:
 * 1. Mark checkout session as completed
 * 2. Trigger order creation (F-013)
 *
 * Request body:
 * - sessionId (optional): Checkout session ID, defaults to current user/guest session
 * - paymentId (optional): Payment reference (for F-013 integration)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const cookieStore = await cookies();
    const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

    // Parse request body
    const body = await request.json();
    const result = completeCheckoutSchema.safeParse(body);

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

    const { sessionId, paymentId: _paymentId } = result.data;

    // Get checkout session
    let checkoutSession;
    if (sessionId) {
      checkoutSession = await getCheckoutSessionById(sessionId);
    } else {
      checkoutSession = session
        ? await getCheckoutSessionByUserId(session.userId)
        : guestId
          ? await getCheckoutSessionByGuestId(guestId)
          : null;
    }

    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Sesi checkout tidak ditemukan' },
        { status: 404 }
      );
    }

    if (checkoutSession.status !== 'pending') {
      return NextResponse.json(
        { error: 'Sesi checkout sudah tidak valid' },
        { status: 400 }
      );
    }

    // Verify cart still exists and has items
    if (!checkoutSession.cart || checkoutSession.cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Keranjang belanja kosong' },
        { status: 400 }
      );
    }

    // Mark checkout session as completed
    await completeCheckoutSession(checkoutSession.id);

    // TODO: F-013 - Create order from checkout session
    // This will be implemented in F-013 and should include:
    // 1. Create customer (if new) or find existing
    // 2. Create order with status 'pending_payment' or 'processing' (depending on payment status)
    // 3. Create order items from cart items
    // 4. Create payment record if paymentId is provided
    // 5. Clear the cart
    // 6. For guest checkout: optionally create user account if email doesn't exist
    // 7. Send confirmation email

    // For now, return success with checkout session data
    // In F-013, this will return the created order
    return NextResponse.json({
      success: true,
      checkoutSessionId: checkoutSession.id,
      // orderId: order.id, // F-013 will add this
      // orderNumber: order.orderNumber, // F-013 will add this
      message: 'Checkout completed successfully. Order creation pending (F-013)',
    });
  } catch (error) {
    console.error('Error completing checkout:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

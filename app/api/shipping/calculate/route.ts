// app/api/shipping/calculate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getCheckoutSessionById } from '@/lib/queries/checkout';
import { getCartByUserId, getCartByGuestId } from '@/lib/queries/cart';
import { calculateShippingRates } from '@/lib/shipping/calculator';
import { getSession } from '@/lib/auth/session';

const calculateSchema = z.object({
  cityId: z.string().min(1, 'Destination city ID required'),
  checkoutSessionId: z.string().optional(), // Optional - for updating session
});

/**
 * POST /api/shipping/calculate
 * Calculate shipping rates for a destination
 * Requires cityId, optionally checkoutSessionId
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = calculateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { cityId, checkoutSessionId } = result.data;
    const destinationCityId = cityId;

    // Get cart items - either from checkout session or directly from cart
    let cartItems: Awaited<ReturnType<typeof getCartByUserId>>['items'] = [];

    if (checkoutSessionId) {
      const session = await getCheckoutSessionById(checkoutSessionId);
      if (session?.cart?.items) {
        cartItems = session.cart.items;
      }
    }

    // If no session or no items from session, get from user/guest cart
    if (cartItems.length === 0) {
      const session = await getSession();
      const cookieStore = await cookies();
      const guestId = cookieStore.get('guest_id')?.value;

      let cart = null;
      if (session) {
        cart = await getCartByUserId(session.userId);
      } else if (guestId) {
        cart = await getCartByGuestId(guestId);
      }

      if (!cart || cart.items.length === 0) {
        return NextResponse.json(
          { error: 'Keranjang kosong', rates: [] },
          { status: 400 }
        );
      }

      cartItems = cart.items;
    }

    // Calculate rates
    const { rates, weight, error } = await calculateShippingRates(
      destinationCityId,
      cartItems
    );

    return NextResponse.json({
      rates,
      destinationCityId,
      weight,
      error: error || null,
    });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping rates' },
      { status: 500 }
    );
  }
}

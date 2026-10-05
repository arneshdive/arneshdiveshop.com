// app/api/shipping/calculate-intl/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getCheckoutSessionById } from '@/lib/queries/checkout';
import { getCartByUserId, getCartByGuestId, CartItemWithProduct, type CartWithItems } from '@/lib/queries/cart';
import { calculateInternationalShippingRates } from '@/lib/shipping/fedex';
import { getSession } from '@/lib/auth/session';

const calculateSchema = z.object({
  address1: z.string().min(1, 'Address required'),
  city: z.string().min(1, 'City required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code required'),
  countryCode: z.string().length(2, 'Country code required'),
  checkoutSessionId: z.string().optional(),
});

/**
 * POST /api/shipping/calculate-intl
 * Calculate international shipping rates for a destination via FedEx.
 * Mirrors /api/shipping/calculate (RajaOngkir, domestic) - same response shape.
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

    const { checkoutSessionId, ...destination } = result.data;

    // Get cart items - either from checkout session or directly from cart
    let cartItems: CartItemWithProduct[] = [];

    if (checkoutSessionId) {
      const session = await getCheckoutSessionById(checkoutSessionId);
      if (session?.cart?.items) {
        cartItems = session.cart.items;
      }
    }

    if (cartItems.length === 0) {
      const session = await getSession();
      const cookieStore = await cookies();
      const guestId = cookieStore.get('guest_id')?.value;

      let cart: CartWithItems | null = null;
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

    const { rates, weight, error } = await calculateInternationalShippingRates(
      destination,
      cartItems
    );

    return NextResponse.json({
      rates,
      weight,
      error: error || null,
    });
  } catch (error) {
    console.error('Error calculating international shipping:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping rates' },
      { status: 500 }
    );
  }
}

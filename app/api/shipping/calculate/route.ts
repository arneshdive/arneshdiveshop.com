// app/api/shipping/calculate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCheckoutSessionById, updateCheckoutSession } from '@/lib/queries/checkout';
import { calculateShippingRates } from '@/lib/shipping/calculator';
import { matchCityToRajaOngkir } from '@/lib/rajaongkir/city-matcher';

const calculateSchema = z.object({
  checkoutSessionId: z.string().min(1, 'Checkout session ID required'),
  cityId: z.string().optional(), // Override: use if already matched
});

/**
 * POST /api/shipping/calculate
 * Calculate shipping rates for checkout session
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

    const { checkoutSessionId, cityId } = result.data;

    // Get checkout session
    const session = await getCheckoutSessionById(checkoutSessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Checkout session not found' },
        { status: 404 }
      );
    }

    if (!session.cart || session.cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Get or match destination city_id
    let destinationCityId = cityId || session.rajaongkirCityId;

    if (!destinationCityId && session.city && session.province) {
      const match = await matchCityToRajaOngkir(session.city, session.province);
      if (match) {
        destinationCityId = match.cityId;
        // Cache the city_id in checkout session
        await updateCheckoutSession(checkoutSessionId, {
          rajaongkirCityId: destinationCityId,
        });
      }
    }

    if (!destinationCityId) {
      return NextResponse.json(
        { error: 'Could not determine destination city. Please verify your address.' },
        { status: 400 }
      );
    }

    // Calculate rates
    const { rates, weight, error } = await calculateShippingRates(
      destinationCityId,
      session.cart.items
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

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth/session';
import {
  getCheckoutSessionByUserId,
  getCheckoutSessionByGuestId,
  createCheckoutSession,
  updateCheckoutSession,
  deleteCheckoutSession,
  CheckoutSessionWithCart,
} from '@/lib/queries/checkout';
import { getCartByUserId, getCartByGuestId } from '@/lib/queries/cart';
import {
  checkoutSessionSchema,
  checkoutShippingSchema,
  formatIndonesianPhone,
} from '@/lib/utils/indonesia-address';
import { matchCityToRajaOngkir } from '@/lib/rajaongkir/city-matcher';
import { z } from 'zod';

const GUEST_COOKIE_NAME = 'guest_id';

/**
 * Helper to get checkout session for current user/guest
 */
async function getCurrentCheckoutSession(): Promise<CheckoutSessionWithCart | null> {
  const session = await getSession();
  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  if (session) {
    return getCheckoutSessionByUserId(session.userId);
  }

  if (guestId) {
    return getCheckoutSessionByGuestId(guestId);
  }

  return null;
}

/**
 * Helper to build response with optional guest cookie
 */
function buildResponse(data: object, guestId?: string): NextResponse {
  const response = NextResponse.json(data);

  if (guestId) {
    response.cookies.set(GUEST_COOKIE_NAME, guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
  }

  return response;
}

/**
 * GET /api/checkout - Get current checkout session
 */
export async function GET() {
  try {
    const checkoutSession = await getCurrentCheckoutSession();

    if (!checkoutSession) {
      return NextResponse.json({ checkoutSession: null });
    }

    return NextResponse.json({ checkoutSession });
  } catch (error) {
    console.error('Error fetching checkout session:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/checkout - Create checkout session from cart
 *
 * Request body:
 * - email, phone, fullName (contact info)
 * - address1, address2, city, province, postalCode (shipping address)
 * - optional: lat, lng, formattedAddress (map coordinates)
 * - optional: notes
 * - optional: shippingMethod
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const cookieStore = await cookies();
    let guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;
    let shouldSetGuestCookie = false;

    // For guest users without ID, generate one
    if (!session && !guestId) {
      guestId = crypto.randomUUID();
      shouldSetGuestCookie = true;
    }

    // Parse and validate request body
    const body = await request.json();
    const result = checkoutSessionSchema.safeParse(body);

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

    const data = result.data;

    // Get current cart
    const cart = session
      ? await getCartByUserId(session.userId)
      : guestId
        ? await getCartByGuestId(guestId)
        : null;

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Keranjang belanja kosong' },
        { status: 400 }
      );
    }

    // Check for existing pending checkout session and delete it
    const existingSession = await getCurrentCheckoutSession();
    if (existingSession) {
      await deleteCheckoutSession(existingSession.id);
    }

    // Format phone number to standard Indonesian format
    const formattedPhone = formatIndonesianPhone(data.phone);

    // Calculate totals from cart
    const subtotalCents = cart.subtotalCents;
    // TODO: Calculate shipping based on shippingMethod and destination (F-012)
    const shippingCents = 0; // Will be calculated by F-012 shipping API
    const totalCents = subtotalCents + shippingCents;

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      userId: session?.userId,
      guestId: session ? undefined : guestId,
      cartId: cart.id,
      email: data.email,
      phone: formattedPhone,
      fullName: data.fullName,
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      country: data.country,
      notes: data.notes,
      lat: data.lat,
      lng: data.lng,
      formattedAddress: data.formattedAddress,
      shippingMethod: data.shippingMethod,
    });

    // Match city to RajaOngkir city_id for shipping calculations
    try {
      const cityMatch = await matchCityToRajaOngkir(data.city, data.province);
      if (cityMatch) {
        await updateCheckoutSession(checkoutSession.id, {
          rajaongkirCityId: cityMatch.cityId,
        });
      }
    } catch (error) {
      // Log but don't fail the checkout - shipping calculator can retry matching
      console.error('Failed to match city for RajaOngkir:', error);
    }

    // Update totals (will be recalculated when shipping is calculated)
    const { updateCheckoutSessionTotals } = await import('@/lib/queries/checkout');
    await updateCheckoutSessionTotals(checkoutSession.id, {
      subtotalCents,
      shippingCents,
      totalCents,
    });

    // Re-fetch session with updated totals
    const { getCheckoutSessionById } = await import('@/lib/queries/checkout');
    const updatedSession = await getCheckoutSessionById(checkoutSession.id);

    return buildResponse(
      { checkoutSession: updatedSession },
      shouldSetGuestCookie ? guestId : undefined
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/checkout - Update checkout session
 *
 * Request body:
 * - shippingMethod (required)
 * - optional: other fields to update
 */
export async function PUT(request: NextRequest) {
  try {
    const checkoutSession = await getCurrentCheckoutSession();

    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Sesi checkout tidak ditemukan' },
        { status: 404 }
      );
    }

    if (checkoutSession.status !== 'pending') {
      return NextResponse.json(
        { error: 'Sesi checkout tidak dapat diubah' },
        { status: 400 }
      );
    }

    // Parse request body - allow partial updates
    const body = await request.json();

    // Validate shipping method if provided
    const updateSchema = z.object({
      shippingMethod: checkoutShippingSchema.shape.shippingMethod.optional(),
      lat: z.string().optional(),
      lng: z.string().optional(),
      formattedAddress: z.string().optional(),
      notes: z.string().max(500).optional(),
    });

    const result = updateSchema.safeParse(body);

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

    // Update checkout session
    const updatedSession = await updateCheckoutSession(
      checkoutSession.id,
      result.data
    );

    return NextResponse.json({ checkoutSession: updatedSession });
  } catch (error) {
    console.error('Error updating checkout session:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/checkout - Clear/expire checkout session
 */
export async function DELETE() {
  try {
    const checkoutSession = await getCurrentCheckoutSession();

    if (!checkoutSession) {
      return NextResponse.json({ success: true });
    }

    // Delete the checkout session
    await deleteCheckoutSession(checkoutSession.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting checkout session:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

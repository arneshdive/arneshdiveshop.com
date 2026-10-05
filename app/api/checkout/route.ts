import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth/session';
import {
  getCheckoutSessionByUserId,
  getCheckoutSessionByGuestId,
  createCheckoutSession,
  updateCheckoutSession,
  deleteCheckoutSession,
  updateCheckoutSessionTotals,
  getCheckoutSessionById,
  CheckoutSessionWithCart,
} from '@/lib/queries/checkout';
import { getCartByUserId, getCartByGuestId } from '@/lib/queries/cart';
import { getCountryName } from '@/lib/shipping/countries';
import { isValidCheckoutPhone, normalizeCheckoutPhone } from '@/lib/utils/validators';
import { z } from 'zod';

const GUEST_COOKIE_NAME = 'guest_id';

// Validation schema for checkout session
const checkoutSessionSchema = z
  .object({
    email: z.string().email('Email tidak valid'),
    phone: z.string().min(1, 'Nomor telepon tidak valid'),
    fullName: z.string().min(2, 'Nama minimal 2 karakter'),
    address1: z.string().min(5, 'Alamat minimal 5 karakter'),
    address2: z.string().optional(),
    notes: z.string().max(500).optional(),
    // Destination country - 'ID' (default) uses the RajaOngkir fields below,
    // anything else uses the generic city/province/postalCode fields (FedEx)
    countryCode: z.string().length(2).optional().default('ID'),
    // RajaOngkir destination (domestic only)
    rajaongkirCityId: z.string().nullish().transform((value) => value ?? undefined),
    rajaongkirCityName: z.string().nullish(),
    rajaongkirProvince: z.string().nullish(),
    rajaongkirCity: z.string().nullish(),
    rajaongkirDistrict: z.string().nullish(),
    rajaongkirSubdistrict: z.string().nullish(),
    rajaongkirPostalCode: z.string().nullish(),
    // Generic destination (international only)
    city: z.string().nullish().transform((value) => value ?? undefined),
    province: z.string().nullish().transform((value) => value ?? undefined),
    postalCode: z.string().nullish().transform((value) => value ?? undefined),
    shippingMethod: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!isValidCheckoutPhone(data.phone, data.countryCode)) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Nomor telepon tidak valid' });
    }
    if (data.countryCode === 'ID') {
      if (!data.rajaongkirCityId) {
        ctx.addIssue({ code: 'custom', path: ['rajaongkirCityId'], message: 'Pilih kelurahan/kecamatan' });
      }
    } else {
      if (!data.city) {
        ctx.addIssue({ code: 'custom', path: ['city'], message: 'Kota wajib diisi' });
      }
      if (!data.postalCode) {
        ctx.addIssue({ code: 'custom', path: ['postalCode'], message: 'Kode pos wajib diisi' });
      }
    }
  });

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

function buildResponse(data: object, guestId?: string): NextResponse {
  const response = NextResponse.json(data);

  if (guestId) {
    response.cookies.set(GUEST_COOKIE_NAME, guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
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
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const cookieStore = await cookies();
    let guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;
    let shouldSetGuestCookie = false;

    if (!session && !guestId) {
      guestId = crypto.randomUUID();
      shouldSetGuestCookie = true;
    }

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

    const formattedPhone = normalizeCheckoutPhone(data.phone, data.countryCode);

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      userId: session?.userId,
      guestId: session ? undefined : guestId,
      cartId: cart.id,
      email: data.email,
      phone: formattedPhone,
      fullName: data.fullName,
      // Street address
      address1: data.address1,
      address2: data.address2,
      notes: data.notes,
      countryCode: data.countryCode,
      country: getCountryName(data.countryCode),
      // RajaOngkir destination
      rajaongkirCityId: data.rajaongkirCityId,
      rajaongkirCityName: data.rajaongkirCityName ?? undefined,
      rajaongkirProvince: data.rajaongkirProvince ?? undefined,
      rajaongkirCity: data.rajaongkirCity ?? undefined,
      rajaongkirDistrict: data.rajaongkirDistrict ?? undefined,
      rajaongkirSubdistrict: data.rajaongkirSubdistrict ?? undefined,
      rajaongkirPostalCode: data.rajaongkirPostalCode ?? undefined,
      // Generic destination (international)
      city: data.city || (data.countryCode === 'ID' ? (data.rajaongkirCity || data.rajaongkirDistrict || undefined) : undefined),
      province: data.province || (data.countryCode === 'ID' ? (data.rajaongkirProvince || undefined) : undefined),
      postalCode: data.postalCode || (data.countryCode === 'ID' ? (data.rajaongkirPostalCode || undefined) : undefined),
      shippingMethod: data.shippingMethod,
    });

    // Update totals
    const subtotalCents = cart.subtotalCents;
    await updateCheckoutSessionTotals(checkoutSession.id, {
      subtotalCents,
      shippingCents: 0,
      totalCents: subtotalCents,
    });

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

    const body = await request.json();

    const updateSchema = z.object({
      shippingMethod: z.string().optional(),
      notes: z.string().max(500).optional(),
      countryCode: z.string().length(2).optional(),
      country: z.string().optional(),
      // Allow updating destination
      rajaongkirCityId: z.string().optional(),
      rajaongkirCityName: z.string().nullish(),
      rajaongkirProvince: z.string().nullish(),
      rajaongkirCity: z.string().nullish(),
      rajaongkirDistrict: z.string().nullish(),
      rajaongkirSubdistrict: z.string().nullish(),
      rajaongkirPostalCode: z.string().nullish(),
      city: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
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

    const data = result.data;
    const updatedSession = await updateCheckoutSession(
      checkoutSession.id,
      {
        shippingMethod: data.shippingMethod,
        notes: data.notes,
        countryCode: data.countryCode,
        country: data.country,
        rajaongkirCityId: data.rajaongkirCityId,
        rajaongkirCityName: data.rajaongkirCityName ?? undefined,
        rajaongkirProvince: data.rajaongkirProvince ?? undefined,
        rajaongkirCity: data.rajaongkirCity ?? undefined,
        rajaongkirDistrict: data.rajaongkirDistrict ?? undefined,
        rajaongkirSubdistrict: data.rajaongkirSubdistrict ?? undefined,
        rajaongkirPostalCode: data.rajaongkirPostalCode ?? undefined,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
      }
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
 * DELETE /api/checkout - Clear checkout session
 */
export async function DELETE() {
  try {
    const checkoutSession = await getCurrentCheckoutSession();

    if (!checkoutSession) {
      return NextResponse.json({ success: true });
    }

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

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth/session';
import {
  getOrCreateCart,
  getCartWithItems,
  getCartByUserId,
  getCartByGuestId,
  addCartItem,
  CartWithItems,
} from '@/lib/queries/cart';

const GUEST_COOKIE_NAME = 'guest_id';
const GUEST_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

const addItemSchema = z.object({
  productId: z.string().min(1, 'ID produk wajib diisi'),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1, 'Kuantitas minimal 1').max(99, 'Kuantitas maksimal 99').default(1),
});

function getCartResponse(cart: CartWithItems | null, guestId?: string) {
  const response = NextResponse.json({ cart });
  
  // Set guest cookie if we have a new guest ID
  if (guestId) {
    response.cookies.set(GUEST_COOKIE_NAME, guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: GUEST_COOKIE_MAX_AGE,
      path: '/',
    });
  }
  
  return response;
}

// GET /api/cart - Get current cart
export async function GET() {
  try {
    const session = await getSession();
    const cookieStore = await cookies();
    let guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

    // For authenticated users
    if (session) {
      const cart = await getCartByUserId(session.userId);
      
      // If guest cart exists, we could transfer (handled on login instead)
      // Just return the user cart
      return NextResponse.json({ cart });
    }

    // For guest users
    if (!guestId) {
      // No cart yet, return empty
      return NextResponse.json({ cart: null });
    }

    const cart = await getCartByGuestId(guestId);
    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
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
    const result = addItemSchema.safeParse(body);

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

    const { productId, variantId, quantity } = result.data;

    // Get or create cart
    const cartId = session
      ? await getOrCreateCart(session.userId)
      : await getOrCreateCart(undefined, guestId);

    // Add item to cart
    const addResult = await addCartItem(cartId, productId, variantId, quantity);

    if (!addResult.success) {
      return NextResponse.json(
        { error: addResult.error },
        { status: 400 }
      );
    }

    // Return updated cart
    const cart = await getCartWithItems(cartId);

    if (shouldSetGuestCookie && guestId) {
      return getCartResponse(cart, guestId);
    }

    return NextResponse.json({ cart, itemId: addResult.itemId });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE() {
  try {
    const session = await getSession();
    const cookieStore = await cookies();
    const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

    const cart = session
      ? await getCartByUserId(session.userId)
      : guestId
        ? await getCartByGuestId(guestId)
        : null;

    if (!cart) {
      return NextResponse.json({ success: true });
    }

    const { clearCart } = await import('@/lib/queries/cart');
    await clearCart(cart.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

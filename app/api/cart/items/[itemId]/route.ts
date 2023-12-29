import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth/session';
import {
  getOrCreateCart,
  getCartWithItems,
  updateCartItemQuantity,
  removeCartItem,
} from '@/lib/queries/cart';

const GUEST_COOKIE_NAME = 'guest_id';

const updateSchema = z.object({
  quantity: z.number().int().min(1, 'Kuantitas minimal 1').max(99, 'Kuantitas maksimal 99'),
});

async function getCartId(): Promise<string | null> {
  const session = await getSession();
  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  if (session) {
    return getOrCreateCart(session.userId);
  }

  if (guestId) {
    return getOrCreateCart(undefined, guestId);
  }

  return null;
}

// PATCH /api/cart/items/[itemId] - Update item quantity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const cartId = await getCartId();

    if (!cartId) {
      return NextResponse.json(
        { error: 'Keranjang tidak ditemukan' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
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

    const { quantity } = result.data;

    // Update quantity
    const updateResult = await updateCartItemQuantity(cartId, itemId, quantity);

    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error },
        { status: 400 }
      );
    }

    // Return updated cart
    const cart = await getCartWithItems(cartId);
    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/items/[itemId] - Remove item from cart
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const cartId = await getCartId();

    if (!cartId) {
      return NextResponse.json(
        { error: 'Keranjang tidak ditemukan' },
        { status: 404 }
      );
    }

    // Remove item
    const removeResult = await removeCartItem(cartId, itemId);

    if (!removeResult.success) {
      return NextResponse.json(
        { error: removeResult.error },
        { status: 400 }
      );
    }

    // Return updated cart
    const cart = await getCartWithItems(cartId);
    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

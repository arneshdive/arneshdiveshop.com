import { db, carts, cartItems, products, productVariants } from '@/lib/db';
import { eq, and, isNull } from 'drizzle-orm';

const MAX_QUANTITY = 99;

export interface CartItemWithProduct {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    priceCents: number;
    compareAtPriceCents: number | null;
    images: string[] | null;
    isActive: boolean;
    weightGrams: number | null;
  };
  variant: {
    id: string;
    name: string;
    priceCents: number | null;
    isActive: boolean;
  } | null;
}

export interface CartWithItems {
  id: string;
  userId: string | null;
  guestId: string | null;
  items: CartItemWithProduct[];
  subtotalCents: number;
  itemCount: number;
}

/**
 * Get or create a cart for a user or guest
 */
export async function getOrCreateCart(userId?: string, guestId?: string): Promise<string> {
  if (!userId && !guestId) {
    throw new Error('Either userId or guestId must be provided');
  }

  // Try to find existing cart
  const existingCart = userId
    ? await db.query.carts.findFirst({
        where: eq(carts.userId, userId),
      })
    : await db.query.carts.findFirst({
        where: eq(carts.guestId, guestId!),
      });

  if (existingCart) {
    return existingCart.id;
  }

  // Create new cart
  const [newCart] = await db
    .insert(carts)
    .values({
      userId: userId || null,
      guestId: guestId || null,
    })
    .returning();

  return newCart!.id;
}

/**
 * Get cart with items and calculate totals
 */
export async function getCartWithItems(cartId: string): Promise<CartWithItems | null> {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.id, cartId),
    with: {
      items: {
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              slug: true,
              priceCents: true,
              compareAtPriceCents: true,
              images: true,
              isActive: true,
              weightGrams: true,
            },
          },
          variant: {
            columns: {
              id: true,
              name: true,
              priceCents: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return null;
  }

  // Calculate totals
  let subtotalCents = 0;
  const items: CartItemWithProduct[] = [];

  for (const item of cart.items) {
    // Skip inactive products
    if (!item.product.isActive) {
      continue;
    }

    // Use variant price if available and active, otherwise product price
    const priceCents = item.variant?.isActive && item.variant.priceCents !== null
      ? item.variant.priceCents
      : item.product.priceCents;

    subtotalCents += priceCents * item.quantity;

    items.push({
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      product: item.product,
      variant: item.variant,
    });
  }

  return {
    id: cart.id,
    userId: cart.userId,
    guestId: cart.guestId,
    items,
    subtotalCents,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
  };
}

/**
 * Get cart by user ID
 */
export async function getCartByUserId(userId: string): Promise<CartWithItems | null> {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
  });

  if (!cart) {
    return null;
  }

  return getCartWithItems(cart.id);
}

/**
 * Get cart by guest ID
 */
export async function getCartByGuestId(guestId: string): Promise<CartWithItems | null> {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.guestId, guestId),
  });

  if (!cart) {
    return null;
  }

  return getCartWithItems(cart.id);
}

/**
 * Add item to cart
 */
export async function addCartItem(
  cartId: string,
  productId: string,
  variantId?: string,
  quantity: number = 1
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  // Validate quantity
  const validatedQuantity = Math.max(1, Math.min(quantity, MAX_QUANTITY));

  // Verify product exists and is active
  const product = await db.query.products.findFirst({
    where: and(
      eq(products.id, productId),
      isNull(products.deletedAt)
    ),
  });

  if (!product) {
    return { success: false, error: 'Produk tidak ditemukan' };
  }

  if (!product.isActive) {
    return { success: false, error: 'Produk tidak tersedia' };
  }

  // If variant specified, verify it exists and is active
  if (variantId) {
    const variant = await db.query.productVariants.findFirst({
      where: and(
        eq(productVariants.id, variantId),
        eq(productVariants.productId, productId)
      ),
    });

    if (!variant) {
      return { success: false, error: 'Varian tidak ditemukan' };
    }

    if (!variant.isActive) {
      return { success: false, error: 'Varian tidak tersedia' };
    }
  }

  // Check if item already exists with same product+variant
  const existingItem = await db.query.cartItems.findFirst({
    where: variantId
      ? and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, productId),
          eq(cartItems.variantId, variantId)
        )
      : and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, productId),
          isNull(cartItems.variantId)
        ),
  });

  if (existingItem) {
    // Update quantity
    const newQuantity = Math.min(existingItem.quantity + validatedQuantity, MAX_QUANTITY);
    await db
      .update(cartItems)
      .set({ quantity: newQuantity, updatedAt: new Date() })
      .where(eq(cartItems.id, existingItem.id));

    return { success: true, itemId: existingItem.id };
  }

  // Create new cart item
  const [newItem] = await db
    .insert(cartItems)
    .values({
      cartId,
      productId,
      variantId: variantId || null,
      quantity: validatedQuantity,
    })
    .returning();

  // Update cart timestamp
  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));

  return { success: true, itemId: newItem!.id };
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  cartId: string,
  itemId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  // Validate quantity
  if (quantity < 1) {
    return { success: false, error: 'Kuantitas tidak boleh kurang dari 1' };
  }

  if (quantity > MAX_QUANTITY) {
    return { success: false, error: `Kuantitas tidak boleh lebih dari ${MAX_QUANTITY}` };
  }

  // Verify item belongs to cart
  const item = await db.query.cartItems.findFirst({
    where: and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)),
  });

  if (!item) {
    return { success: false, error: 'Item tidak ditemukan' };
  }

  // Update quantity
  await db
    .update(cartItems)
    .set({ quantity, updatedAt: new Date() })
    .where(eq(cartItems.id, itemId));

  // Update cart timestamp
  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));

  return { success: true };
}

/**
 * Remove item from cart
 */
export async function removeCartItem(
  cartId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  // Verify item belongs to cart
  const item = await db.query.cartItems.findFirst({
    where: and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)),
  });

  if (!item) {
    return { success: false, error: 'Item tidak ditemukan' };
  }

  // Delete item
  await db.delete(cartItems).where(eq(cartItems.id, itemId));

  // Update cart timestamp
  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));

  return { success: true };
}

/**
 * Clear all items from cart
 */
export async function clearCart(cartId: string): Promise<void> {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));
}

/**
 * Transfer guest cart to user cart on login
 */
export async function transferGuestCartToUser(
  guestId: string,
  userId: string
): Promise<void> {
  const guestCart = await db.query.carts.findFirst({
    where: eq(carts.guestId, guestId),
    with: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) {
    // No guest cart or empty, nothing to transfer
    return;
  }

  // Get or create user cart
  const userCartId = await getOrCreateCart(userId);

  // Transfer items
  for (const item of guestCart.items) {
    await addCartItem(userCartId, item.productId, item.variantId || undefined, item.quantity);
  }

  // Delete guest cart
  await db.delete(carts).where(eq(carts.id, guestCart.id));
}

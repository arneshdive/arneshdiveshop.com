import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';

// Server API cart item format
export interface ServerCartItem {
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
  };
  variant: {
    id: string;
    name: string;
    priceCents: number | null;
    isActive: boolean;
  } | null;
}

// Server cart response format
export interface ServerCart {
  id: string;
  userId: string | null;
  guestId: string | null;
  items: ServerCartItem[];
  subtotalCents: number;
  itemCount: number;
}

// Internal cart item format (normalized for UI)
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    priceCents: number;
    compareAtPriceCents: number | null;
    images: string[] | null;
  };
  variant?: {
    id: string;
    name: string;
    priceCents: number | null;
  } | null;
}

// Promo code validation response
export interface PromoValidation {
  valid: boolean;
  promotion?: {
    id: string;
    code: string;
    name: string;
    type: string;
    valueCents: number;
  };
  discountCents?: number;
  discountFormatted?: string;
  error?: string;
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscountCents: number;
  isLoggedIn: boolean | null; // null = not yet checked
  isLoading: boolean;
  isSynced: boolean; // true after initial server sync
  lastError: string | null;
}

interface CartActions {
  // Initialization
  checkAuthAndSync: () => Promise<void>;
  
  // Cart operations
  addItem: (productId: string, variantId?: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  removeItem: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  clearCart: () => Promise<{ success: boolean; error?: string }>;
  
  // Promo codes
  applyPromo: (code: string) => Promise<{ success: boolean; error?: string }>;
  clearPromo: () => void;
  
  // Getters
  getSubtotalCents: () => number;
  getTotalCents: () => number;
  getItemCount: () => number;
  
  // Internal actions
  _setItems: (items: CartItem[]) => void;
  _setLoggedIn: (isLoggedIn: boolean) => void;
  _setLoading: (loading: boolean) => void;
  _setLastError: (error: string | null) => void;
}

// Convert server cart item to internal format
function normalizeCartItem(serverItem: ServerCartItem): CartItem {
  return {
    id: serverItem.id,
    productId: serverItem.productId,
    variantId: serverItem.variantId || undefined,
    quantity: serverItem.quantity,
    product: {
      id: serverItem.product.id,
      name: serverItem.product.name,
      slug: serverItem.product.slug,
      priceCents: serverItem.product.priceCents,
      compareAtPriceCents: serverItem.product.compareAtPriceCents,
      images: serverItem.product.images,
    },
    variant: serverItem.variant,
  };
}

// Fetch session status
async function checkSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session');
    if (res.ok) {
      const data = await res.json();
      return !!data?.user;
    }
    return false;
  } catch {
    return false;
  }
}

// API helper functions
async function fetchCart(): Promise<ServerCart | null> {
  const res = await fetch('/api/cart');
  if (res.ok) {
    const data = await res.json();
    return data.cart;
  }
  return null;
}

async function addToServerCart(
  productId: string, 
  variantId?: string, 
  quantity: number = 1
): Promise<{ cart: ServerCart | null; itemId?: string; error?: string }> {
  try {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, variantId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { cart: null, error: data.error || 'Gagal menambahkan item' };
    }
    return { cart: data.cart, itemId: data.itemId };
  } catch {
    return { cart: null, error: 'Terjadi kesalahan jaringan' };
  }
}

async function updateServerCartItem(
  itemId: string, 
  quantity: number
): Promise<{ cart: ServerCart | null; error?: string }> {
  try {
    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { cart: null, error: data.error || 'Gagal mengupdate kuantitas' };
    }
    return { cart: data.cart };
  } catch {
    return { cart: null, error: 'Terjadi kesalahan jaringan' };
  }
}

async function removeFromServerCart(
  itemId: string
): Promise<{ cart: ServerCart | null; error?: string }> {
  try {
    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      return { cart: null, error: data.error || 'Gagal menghapus item' };
    }
    return { cart: data.cart };
  } catch {
    return { cart: null, error: 'Terjadi kesalahan jaringan' };
  }
}

async function clearServerCart(): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/cart', {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || 'Gagal mengosongkan keranjang' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Terjadi kesalahan jaringan' };
  }
}

async function validatePromoCode(
  code: string, 
  orderTotalCents: number
): Promise<PromoValidation> {
  try {
    const res = await fetch('/api/promotions/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, orderTotalCents }),
    });
    return await res.json();
  } catch {
    return { valid: false, error: 'Terjadi kesalahan jaringan' };
  }
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      promoDiscountCents: 0,
      isLoggedIn: null,
      isLoading: false,
      isSynced: false,
      lastError: null,

      // Check auth status and sync with server
      checkAuthAndSync: async () => {
        const state = get();
        if (state.isSynced || state.isLoading) return;

        set({ isLoading: true });

        try {
          const loggedIn = await checkSession();
          set({ isLoggedIn: loggedIn });

          // Always fetch cart from server (works for both logged-in and guests via cookies)
          const serverCart = await fetchCart();
          if (serverCart) {
            const items = serverCart.items.map(normalizeCartItem);
            set({ items, isSynced: true });
          } else {
            set({ items: [], isSynced: true });
          }
        } catch (error) {
          console.error('Error syncing cart:', error);
          set({ isSynced: true });
        } finally {
          set({ isLoading: false });
        }
      },

      // Add item to cart
      addItem: async (productId, variantId, quantity = 1) => {
        set({ isLoading: true, lastError: null });

        // Always use server API (works for both logged-in users and guests via cookies)
        const result = await addToServerCart(productId, variantId, quantity);
        set({ isLoading: false });
        
        if (result.error) {
          set({ lastError: result.error });
          return { success: false, error: result.error };
        }
        
        if (result.cart) {
          const items = result.cart.items.map(normalizeCartItem);
          set({ items, isSynced: true });
        }
        return { success: true };
      },

      // Remove item from cart
      removeItem: async (itemId) => {
        set({ lastError: null, isLoading: true });

        const result = await removeFromServerCart(itemId);
        set({ isLoading: false });
        
        if (result.error) {
          set({ lastError: result.error });
          return { success: false, error: result.error };
        }
        
        if (result.cart) {
          const items = result.cart.items.map(normalizeCartItem);
          set({ items });
        }
        return { success: true };
      },

      // Update item quantity
      updateQuantity: async (itemId, quantity) => {
        if (quantity < 1) {
          return get().removeItem(itemId);
        }

        set({ lastError: null, isLoading: true });

        const result = await updateServerCartItem(itemId, quantity);
        set({ isLoading: false });
        
        if (result.error) {
          set({ lastError: result.error });
          return { success: false, error: result.error };
        }
        
        if (result.cart) {
          const items = result.cart.items.map(normalizeCartItem);
          set({ items });
        }
        return { success: true };
      },

      // Clear cart
      clearCart: async () => {
        set({ lastError: null, isLoading: true });

        const result = await clearServerCart();
        set({ isLoading: false });
        
        if (!result.success) {
          set({ lastError: result.error || 'Failed to clear cart' });
          return { success: false, error: result.error };
        }

        set({ items: [], promoCode: null, promoDiscountCents: 0 });
        return { success: true };
      },

      // Apply promo code via API
      applyPromo: async (code) => {
        const subtotal = get().getSubtotalCents();

        set({ isLoading: true, lastError: null });

        const validation = await validatePromoCode(code, subtotal);
        set({ isLoading: false });

        if (!validation.valid) {
          set({ lastError: validation.error || 'Kode promo tidak valid' });
          return { success: false, error: validation.error };
        }

        set({
          promoCode: validation.promotion?.code || code.toUpperCase(),
          promoDiscountCents: validation.discountCents || 0,
        });
        return { success: true };
      },

      // Clear promo code
      clearPromo: () => {
        set({ promoCode: null, promoDiscountCents: 0 });
      },

      // Calculate subtotal in cents
      getSubtotalCents: () => {
        return get().items.reduce((total, item) => {
          const priceCents = item.variant?.priceCents ?? item.product.priceCents;
          return total + priceCents * item.quantity;
        }, 0);
      },

      // Calculate total with promo discount
      getTotalCents: () => {
        const subtotal = get().getSubtotalCents();
        const discount = get().promoDiscountCents;
        return Math.max(0, subtotal - discount);
      },

      // Get total item count
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      // Internal setters
      _setItems: (items) => set({ items }),
      _setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
      _setLoading: (loading) => set({ isLoading: loading }),
      _setLastError: (error) => set({ lastError: error }),
    }),
    {
      name: 'arnes-cart',
      // Only persist promo code (items come from server for both logged-in and guests)
      partialize: (state) => ({
        promoCode: state.promoCode,
        promoDiscountCents: state.promoDiscountCents,
      }),
    }
  )
);

// Hook to ensure cart is synced on first use - proper React hook implementation
export function useCartSync() {
  const checkAuthAndSync = useCartStore((state) => state.checkAuthAndSync);
  const isSynced = useCartStore((state) => state.isSynced);
  const isLoading = useCartStore((state) => state.isLoading);
  
  // Use useEffect to trigger sync on mount
  useEffect(() => {
    if (!isSynced && !isLoading) {
      checkAuthAndSync();
    }
  }, [isSynced, isLoading, checkAuthAndSync]);
  
  return { isSynced, isLoading };
}

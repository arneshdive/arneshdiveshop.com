import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MockProduct } from '@/lib/data/mock-products';

export interface CartItem {
  id: string;
  product: MockProduct;
  quantity: number;
  selectedVariant?: {
    color?: string;
    size?: string;
  };
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
}

interface CartActions {
  addItem: (product: MockProduct, variant?: { color?: string; size?: string }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyPromo: (code: string) => boolean;
  clearPromo: () => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

const PROMO_CODES: Record<string, number> = {
  DIVE10: 0.1,
  FREEDIVE20: 0.2,
};

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,

      addItem: (product, variant) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedVariant?.color === variant?.color &&
            item.selectedVariant?.size === variant?.size
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex]!.quantity += 1;
          set({ items: newItems });
        } else {
          set({
            items: [
              ...items,
              {
                id: `${product.id}-${variant?.color || ''}-${variant?.size || ''}-${Date.now()}`,
                product,
                quantity: 1,
                selectedVariant: variant,
              },
            ],
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        const items = get().items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        );
        set({ items });
      },

      applyPromo: (code) => {
        const upperCode = code.toUpperCase();
        if (PROMO_CODES[upperCode]) {
          set({ promoCode: upperCode, promoDiscount: PROMO_CODES[upperCode] });
          return true;
        }
        return false;
      },

      clearPromo: () => {
        set({ promoCode: null, promoDiscount: 0 });
      },

      clearCart: () => {
        set({ items: [], promoCode: null, promoDiscount: 0 });
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const price = parseFloat(item.product.price.replace(/[^0-9]/g, ''));
          return total + price * item.quantity;
        }, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().promoDiscount;
        return subtotal * (1 - discount);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'arnes-cart',
    }
  )
);

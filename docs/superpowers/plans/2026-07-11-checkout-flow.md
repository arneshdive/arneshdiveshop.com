# Checkout Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete checkout flow (Cart, Checkout, Order Confirmation) with Zustand state management and Midtrans redirect.

**Architecture:** Zustand stores for cart and checkout state. Cart page for item management, Checkout page for shipping information, Order Confirmation for success display. Follow existing homepage design patterns.

**Tech Stack:** Next.js 16, React 19, Zustand, Tailwind CSS, Iconify

---

## File Structure

```
lib/
├── store/
│   ├── cart.ts                    # Cart state management
│   └── checkout.ts                # Checkout form state
├── constants/
│   ├── provinces.ts               # Indonesian provinces list
│   └── shipping.ts                # Shipping methods
└── utils/
    └── validators.ts              # Form validation helpers

components/
├── cart/
│   ├── cart-item.tsx              # Single cart item row
│   ├── order-summary.tsx          # Summary card with promo
│   └── empty-cart.tsx             # Empty cart state
└── checkout/
    ├── checkout-progress.tsx      # Step indicator
    ├── contact-form.tsx           # Email/phone inputs
    ├── shipping-address-form.tsx   # Address form
    ├── shipping-method-selector.tsx # Shipping options
    ├── order-summary-card.tsx      # Sticky checkout summary
    └── order-confirmation-card.tsx # Success display

app/(store)/
├── cart/
│   └── page.tsx                   # Cart page
├── checkout/
│   ├── page.tsx                   # Checkout page
│   └── success/
│       └── page.tsx               # Order confirmation
```

---

### Task 1: Setup Dependencies and Utilities

**Files:**
- Install: `zustand`
- Create: `lib/utils/validators.ts`
- Create: `lib/constants/provinces.ts`
- Create: `lib/constants/shipping.ts`

- [ ] **Step 1: Install Zustand**

```bash
pnpm add zustand
```

- [ ] **Step 2: Create validators utility**

Create `lib/utils/validators.ts`:

```typescript
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Indonesian mobile: 08xxxxxxxxxx or +62 8xxxxxxxxx
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

export function isValidPostalCode(code: string): boolean {
  return /^\d{5}$/.test(code);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
```

- [ ] **Step 3: Create provinces constant**

Create `lib/constants/provinces.ts`:

```typescript
export const provinces = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Jambi',
  'Sumatera Selatan',
  'Bengkulu',
  'Lampung',
  'Kepulauan Bangka Belitung',
  'Kepulauan Riau',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Banten',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Sulawesi Tengah',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Gorontalo',
  'Sulawesi Barat',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
] as const;

export type Province = (typeof provinces)[number];
```

- [ ] **Step 4: Create shipping methods constant**

Create `lib/constants/shipping.ts`:

```typescript
export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

export const shippingMethods: ShippingMethod[] = [
  {
    id: 'jne-regular',
    name: 'JNE Reguler',
    description: '3-5 hari kerja',
    price: 25000,
    estimatedDays: '3-5',
  },
  {
    id: 'jne-yes',
    name: 'JNE YES',
    description: '1-2 hari kerja',
    price: 45000,
    estimatedDays: '1-2',
  },
  {
    id: 'sicepat-reg',
    name: 'SiCepat REG',
    description: '2-3 hari kerja',
    price: 20000,
    estimatedDays: '2-3',
  },
];

export const FREE_SHIPPING_THRESHOLD = 500000;
```

- [ ] **Step 5: Commit**

```bash
git add lib/utils/validators.ts lib/constants/provinces.ts lib/constants/shipping.ts package.json pnpm-lock.yaml
git commit -m "feat: add checkout utilities and constants"
```

---

### Task 2: Create Cart Store

**Files:**
- Create: `lib/store/cart.ts`

- [ ] **Step 1: Create cart store**

Create `lib/store/cart.ts`:

```typescript
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
          newItems[existingIndex].quantity += 1;
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/store/cart.ts
git commit -m "feat: add cart store with zustand"
```

---

### Task 3: Create Checkout Store

**Files:**
- Create: `lib/store/checkout.ts`

- [ ] **Step 1: Create checkout store**

Create `lib/store/checkout.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CheckoutData {
  email: string;
  phone: string;
  fullName: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  province: string;
  notes: string;
  shippingMethod: 'jne-regular' | 'jne-yes' | 'sicepat-reg';
}

interface CheckoutState {
  data: CheckoutData;
}

interface CheckoutActions {
  setField: <K extends keyof CheckoutData>(field: K, value: CheckoutData[K]) => void;
  setData: (data: Partial<CheckoutData>) => void;
  reset: () => void;
}

const initialData: CheckoutData = {
  email: '',
  phone: '',
  fullName: '',
  address1: '',
  address2: '',
  city: '',
  postalCode: '',
  province: '',
  notes: '',
  shippingMethod: 'jne-regular',
};

export const useCheckoutStore = create<CheckoutState & CheckoutActions>()(
  persist(
    (set) => ({
      data: initialData,

      setField: (field, value) => {
        set((state) => ({
          data: { ...state.data, [field]: value },
        }));
      },

      setData: (data) => {
        set((state) => ({
          data: { ...state.data, ...data },
        }));
      },

      reset: () => {
        set({ data: initialData });
      },
    }),
    {
      name: 'arnes-checkout',
    }
  )
);
```

- [ ] **Step 2: Commit**

```bash
git add lib/store/checkout.ts
git commit -m "feat: add checkout store with zustand"
```

---

### Task 4: Create Cart Components

**Files:**
- Create: `components/cart/cart-item.tsx`
- Create: `components/cart/order-summary.tsx`
- Create: `components/cart/empty-cart.tsx`

- [ ] **Step 1: Create CartItem component**

Create `components/cart/cart-item.tsx`:

```typescript
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { CartItem as CartItemType, useCartStore } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils/validators';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const price = parseFloat(item.product.price.replace(/[^0-9]/g, ''));

  return (
    <div className="flex gap-4 py-6 border-b border-neutral-200 bg-white px-4 mb-4 first:mt-4">
      {/* Product Image */}
      <Link
        href={`/produk/${item.product.handle}`}
        className="w-24 h-32 lg:w-28 lg:h-36 bg-neutral-100 flex-shrink-0 relative overflow-hidden"
      >
        {item.product.image ? (
          <Image
            src={item.product.image}
            alt={item.product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
            Img
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/produk/${item.product.handle}`} className="font-medium hover:underline">
            {item.product.title}
          </Link>
          {item.selectedVariant && (
            <p className="text-neutral-500 text-xs mt-1">
              {[
                item.selectedVariant.color && `Warna: ${item.selectedVariant.color}`,
                item.selectedVariant.size && `Ukuran: ${item.selectedVariant.size}`,
              ]
                .filter(Boolean)
                .join(' | ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center border border-neutral-300">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="px-3 py-1 hover:bg-neutral-100 transition-colors"
              aria-label="Kurangi jumlah"
            >
              <Icon icon="solar:minus-linear" className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 border-x border-neutral-300 text-center min-w-[40px]">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="px-3 py-1 hover:bg-neutral-100 transition-colors"
              aria-label="Tambah jumlah"
            >
              <Icon icon="solar:add-linear" className="w-4 h-4" />
            </button>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => removeItem(item.id)}
            className="text-neutral-400 hover:text-red-500 transition-colors"
            aria-label="Hapus item"
          >
            <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="font-semibold text-right">
        {formatPrice(price * item.quantity)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create OrderSummary component**

Create `components/cart/order-summary.tsx`:

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useCartStore } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils/validators';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants/shipping';

export function OrderSummary() {
  const { items, promoCode, promoDiscount, applyPromo, clearPromo, getSubtotal, getTotal } = useCartStore();
  const [promoInput, setPromoInput] = useState(promoCode || '');
  const [promoError, setPromoError] = useState('');
  const subtotal = getSubtotal();
  const total = getTotal();
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  const handleApplyPromo = () => {
    if (!promoInput.trim()) {
      setPromoError('Masukkan kode promo');
      return;
    }
    const success = applyPromo(promoInput);
    if (success) {
      setPromoError('');
    } else {
      setPromoError('Kode promo tidak valid');
    }
  };

  const handleRemovePromo = () => {
    clearPromo();
    setPromoInput('');
    setPromoError('');
  };

  return (
    <div className="w-full lg:w-80 bg-neutral-100 p-6 h-fit sticky top-24">
      <h2 className="font-semibold mb-6 pb-4 border-b border-neutral-200">Ringkasan Pesanan</h2>

      {/* Items Count */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal ({items.length} item)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Ongkos Kirim</span>
          {freeShipping ? (
            <span className="text-green-600">Gratis</span>
          ) : (
            <span className="text-neutral-400">Dihitung saat checkout</span>
          )}
        </div>
      </div>

      {/* Promo Code */}
      <div className="border-t border-b border-neutral-200 py-4 my-4">
        <p className="text-sm font-medium mb-2">Kode Promo</p>
        {promoCode ? (
          <div className="flex items-center justify-between bg-white px-3 py-2 border border-neutral-300">
            <span className="text-sm font-medium text-green-600">{promoCode}</span>
            <button
              onClick={handleRemovePromo}
              className="text-neutral-400 hover:text-red-500"
              aria-label="Hapus promo"
            >
              <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Masukkan kode"
              className="flex-1 px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
            />
            <button
              onClick={handleApplyPromo}
              className="px-4 py-2 bg-white border border-neutral-300 text-xs hover:border-neutral-900 transition-colors"
            >
              Terapkan
            </button>
          </div>
        )}
        {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
        {promoDiscount > 0 && (
          <p className="text-xs text-green-600 mt-1">Diskon {promoDiscount * 100}% diterapkan</p>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between font-semibold text-lg mb-6">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      {/* CTA */}
      <Link
        href="/checkout"
        className="block w-full bg-neutral-900 text-white py-4 text-center text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors"
      >
        Lanjut ke Checkout
      </Link>

      {/* Trust Badges */}
      <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-neutral-200 text-xs text-neutral-500 text-center">
        <span className="flex items-center gap-1">
          <Icon icon="solar:lock-linear" className="w-4 h-4" />
          Pembayaran Aman
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create EmptyCart component**

Create `components/cart/empty-cart.tsx`:

```typescript
import Link from 'next/link';
import { Icon } from '@iconify/react';

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Icon icon="solar:bag-3-linear" className="w-24 h-24 text-neutral-300 mb-6" />
      <h2 className="text-xl font-semibold mb-2">Keranjang Kosong</h2>
      <p className="text-neutral-500 text-center mb-6">
        Belum ada produk di keranjang belanja Anda.
      </p>
      <Link
        href="/produk"
        className="bg-neutral-900 text-white px-8 py-3 text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors"
      >
        Mulai Belanja
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/cart/
git commit -m "feat: add cart components (cart-item, order-summary, empty-cart)"
```

---

### Task 5: Create Cart Page

**Files:**
- Create: `app/(store)/cart/page.tsx`

- [ ] **Step 1: Create cart page**

Create `app/(store)/cart/page.tsx`:

```typescript
import Link from 'next/link';
import { CartItem } from '@/components/cart/cart-item';
import { OrderSummary } from '@/components/cart/order-summary';
import { EmptyCart } from '@/components/cart/empty-cart';
import { useCartStore } from '@/lib/store/cart';

export default function CartPage() {
  const items = useCartStore.getState().items;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Page Title */}
      <div className="text-center pt-8 pb-4">
        <h1 className="text-2xl lg:text-3xl font-semibold">Keranjang Belanja</h1>
      </div>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
              <Link
                href="/produk"
                className="inline-block mt-6 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                ← Lanjut Belanja
              </Link>
            </div>

            {/* Order Summary */}
            <OrderSummary />
          </div>
        )}
      </div>
    </div>
  );
}
```

Wait, this won't work for SSR. Let me fix this to be a client component.

- [ ] **Step 2: Fix cart page for client-side rendering**

Update `app/(store)/cart/page.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { CartItem } from '@/components/cart/cart-item';
import { OrderSummary } from '@/components/cart/order-summary';
import { EmptyCart } from '@/components/cart/empty-cart';
import { useCartStore } from '@/lib/store/cart';

export default function CartPage() {
  const items = useCartStore((state) => state.items);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Page Title */}
      <div className="text-center pt-8 pb-4">
        <h1 className="text-2xl lg:text-3xl font-semibold">Keranjang Belanja</h1>
      </div>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
              <Link
                href="/produk"
                className="inline-block mt-6 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                ← Lanjut Belanja
              </Link>
            </div>

            {/* Order Summary */}
            <OrderSummary />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(store\)/cart/page.tsx
git commit -m "feat: add cart page"
```

---

### Task 6: Create Checkout Components

**Files:**
- Create: `components/checkout/checkout-progress.tsx`
- Create: `components/checkout/contact-form.tsx`
- Create: `components/checkout/shipping-address-form.tsx`
- Create: `components/checkout/shipping-method-selector.tsx`
- Create: `components/checkout/order-summary-card.tsx`

- [ ] **Step 1: Create CheckoutProgress component**

Create `components/checkout/checkout-progress.tsx`:

```typescript
'use client';

import { Icon } from '@iconify/react';

interface CheckoutProgressProps {
  currentStep: 'information' | 'payment';
}

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  const steps = [
    { id: 'information', label: 'Informasi', number: 1 },
    { id: 'payment', label: 'Pembayaran', number: 2 },
  ] as const;

  return (
    <div className="bg-white border-b border-neutral-200 py-6">
      <div className="flex justify-center items-center gap-4 px-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === step.id || (currentStep === 'payment' && step.id === 'information')
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-200 text-neutral-500'
              }`}
            >
              {currentStep === 'payment' && step.id === 'information' ? (
                <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                currentStep === step.id ? 'font-medium' : 'text-neutral-400'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className="w-16 lg:w-24 h-0.5 bg-neutral-200 mx-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ContactForm component**

Create `components/checkout/contact-form.tsx`:

```typescript
'use client';

import { useCheckoutStore } from '@/lib/store/checkout';
import { isValidEmail, isValidPhone } from '@/lib/utils/validators';

export function ContactForm() {
  const { data, setField } = useCheckoutStore();

  return (
    <div className="bg-white p-6 mb-6 border border-neutral-200">
      <h2 className="font-semibold text-lg mb-6 pb-3 border-b border-neutral-200">
        Informasi Kontak
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="email@contoh.com"
            className={`w-full px-3 py-3 border text-sm focus:outline-none ${
              data.email && !isValidEmail(data.email)
                ? 'border-red-500 focus:border-red-500'
                : 'border-neutral-300 focus:border-neutral-900'
            }`}
          />
          {data.email && !isValidEmail(data.email) && (
            <p className="text-xs text-red-500 mt-1">Format email tidak valid</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Nomor Telepon <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="08xxxxxxxxxx"
            className={`w-full px-3 py-3 border text-sm focus:outline-none ${
              data.phone && !isValidPhone(data.phone)
                ? 'border-red-500 focus:border-red-500'
                : 'border-neutral-300 focus:border-neutral-900'
            }`}
          />
          {data.phone && !isValidPhone(data.phone) && (
            <p className="text-xs text-red-500 mt-1">Format nomor telepon tidak valid</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ShippingAddressForm component**

Create `components/checkout/shipping-address-form.tsx`:

```typescript
'use client';

import { useCheckoutStore } from '@/lib/store/checkout';
import { provinces } from '@/lib/constants/provinces';

export function ShippingAddressForm() {
  const { data, setField } = useCheckoutStore();

  return (
    <div className="bg-white p-6 mb-6 border border-neutral-200">
      <h2 className="font-semibold text-lg mb-6 pb-3 border-b border-neutral-200">
        Alamat Pengiriman
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
            placeholder="Nama penerima"
            className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Alamat <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.address1}
            onChange={(e) => setField('address1', e.target.value)}
            placeholder="Nama jalan, nomor rumah"
            className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Alamat Lengkap (opsional)
          </label>
          <input
            type="text"
            value={data.address2}
            onChange={(e) => setField('address2', e.target.value)}
            placeholder="RT/RW, nama gedung, patokan"
            className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">
              Kota <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => setField('city', e.target.value)}
              placeholder="Nama kota"
              className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">
              Kode Pos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.postalCode}
              onChange={(e) => setField('postalCode', e.target.value)}
              placeholder="12345"
              maxLength={5}
              className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Provinsi <span className="text-red-500">*</span>
          </label>
          <select
            value={data.province}
            onChange={(e) => setField('province', e.target.value)}
            className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none bg-white"
          >
            <option value="">Pilih provinsi</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Catatan (opsional)</label>
          <input
            type="text"
            value={data.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Instruksi pengiriman khusus"
            className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create ShippingMethodSelector component**

Create `components/checkout/shipping-method-selector.tsx`:

```typescript
'use client';

import { useCheckoutStore } from '@/lib/store/checkout';
import { useCartStore } from '@/lib/store/cart';
import { shippingMethods, FREE_SHIPPING_THRESHOLD } from '@/lib/constants/shipping';
import { formatPrice } from '@/lib/utils/validators';

export function ShippingMethodSelector() {
  const { data, setField } = useCheckoutStore();
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const subtotal = getSubtotal();
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <div className="bg-white p-6 mb-6 border border-neutral-200">
      <h2 className="font-semibold text-lg mb-6 pb-3 border-b border-neutral-200">
        Metode Pengiriman
      </h2>
      <div className="space-y-3">
        {shippingMethods.map((method) => (
          <label
            key={method.id}
            className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
              data.shippingMethod === method.id
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-300 hover:border-neutral-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping"
                checked={data.shippingMethod === method.id}
                onChange={() => setField('shippingMethod', method.id as any)}
                className="accent-neutral-900"
              />
              <div>
                <div className="font-medium">{method.name}</div>
                <div className="text-xs text-neutral-500">{method.description}</div>
              </div>
            </div>
            <span className="font-medium">
              {freeShipping ? (
                <span className="text-green-600">Gratis</span>
              ) : (
                formatPrice(method.price)
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create OrderSummaryCard component**

Create `components/checkout/order-summary-card.tsx`:

```typescript
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useCartStore } from '@/lib/store/cart';
import { useCheckoutStore } from '@/lib/store/checkout';
import { shippingMethods, FREE_SHIPPING_THRESHOLD } from '@/lib/constants/shipping';
import { formatPrice } from '@/lib/utils/validators';

export function OrderSummaryCard() {
  const { items, promoDiscount, getSubtotal, getTotal } = useCartStore();
  const { shippingMethod } = useCheckoutStore();
  const subtotal = getSubtotal();
  const total = getTotal();
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const selected{}
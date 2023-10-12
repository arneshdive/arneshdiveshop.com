# Checkout Flow Design

## Overview

Implement a complete checkout flow for the frontstore including Cart, Checkout (Information), and Order Confirmation pages. Uses Zustand for cart state management and Midtrans for payment processing.

## Pages

### 1. Cart Page (`/cart`)

**Layout:** Two-column on desktop (items left, summary right), single column mobile

**Features:**
- Cart item list with product image, title, variant, quantity controls, remove button, price
- Order summary with subtotal, shipping estimate, promo code input, total
- Quantity adjustments persist via Zustand store
- Empty cart state with CTA to browse products

**User Actions:**
- Adjust quantity (+/-)
- Remove item
- Apply promo code (static validation - accepts "DIVE10" for 10% off)
- Continue to checkout

---

### 2. Checkout Page (`/checkout`)

**Layout:** Two-column (forms left, order summary sticky right)

**Progress Indicator:**
- Step 1: Informasi (active)
- Step 2: Pembayaran (disabled - redirects to Midtrans)

**Form Sections:**

1. **Contact Information**
   - Email (required)
   - Phone number (required)

2. **Shipping Address**
   - Full name (required)
   - Address line 1 (required)
   - Address line 2 (optional)
   - City (required)
   - Postal code (required)
   - Province dropdown (required) - Indonesian provinces
   - Notes (optional)

3. **Shipping Method**
   - JNE Reguler: Rp 25.000, 3-5 hari
   - JNE YES: Rp 45.000, 1-2 hari
   - SiCepat REG: Rp 20.000, 2-3 hari

**Actions:**
- "Lanjut ke Pembayaran" button → Validates form, creates order, redirects to Midtrans
- "Kembali ke Keranjang" link

**Validation:**
- All required fields must be filled
- Email format validation
- Phone number format (Indonesian mobile)

---

### 3. Order Confirmation (`/checkout/success`)

**Layout:** Centered single-column card

**Content:**
- Success icon with checkmark
- "Terima Kasih!" heading
- Order number (from URL param)
- Shipping info summary (name, address, method)
- Order items list with prices
- Payment total
- Note about Midtrans payment status
- CTAs: "Lihat Pesanan" → /account/orders, "Lanjut Belanja" → /

---

## Architecture

### Zustand Store (`lib/store/cart.ts`)

```typescript
interface CartItem {
  id: string;
  product: MockProduct;
  quantity: number;
  selectedVariant?: {
    color?: string;
    size?: string;
  };
}

interface CartStore {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  
  // Actions
  addItem: (product: MockProduct, variant?: object) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyPromo: (code: string) => boolean;
  clearPromo: () => void;
  clearCart: () => void;
  
  // Computed
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
}
```

### Checkout Form Store (`lib/store/checkout.ts`)

```typescript
interface CheckoutData {
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

interface CheckoutStore {
  data: CheckoutData;
  setField: (field: keyof CheckoutData, value: string) => void;
  setData: (data: Partial<CheckoutData>) => void;
  reset: () => void;
}
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CartItem` | `components/cart/cart-item.tsx` | Single cart item row |
| `OrderSummary` | `components/cart/order-summary.tsx` | Summary card with promo, totals |
| `EmptyCart` | `components/cart/empty-cart.tsx` | Empty state illustration |
| `CheckoutProgress` | `components/checkout/checkout-progress.tsx` | Step indicator (1. Informasi, 2. Pembayaran) |
| `ContactForm` | `components/checkout/contact-form.tsx` | Email and phone inputs |
| `ShippingAddressForm` | `components/checkout/shipping-address-form.tsx` | Address form fields |
| `ShippingMethodSelector` | `components/checkout/shipping-method-selector.tsx` | Radio group for shipping options |
| `OrderSummaryCard` | `components/checkout/order-summary-card.tsx` | Sticky summary on checkout |
| `OrderConfirmationCard` | `components/checkout/order-confirmation-card.tsx` | Success message and order details |

### Utilities

- `lib/utils/validators.ts` — Email, phone validation helpers
- `lib/constants/provinces.ts` — Indonesian provinces list
- `lib/constants/shipping.ts` — Shipping methods with prices and delivery times

---

## Design Patterns

Follow existing homepage patterns:

- **Colors:** neutral-900 for text, neutral-500 for secondary, white backgrounds, neutral-100/200 for sections
- **Typography:** text-sm base, font-semibold for labels, uppercase tracking-wider for headings
- **Buttons:** AnimatedButton for primary CTAs, outline style for secondary
- **Inputs:** border-neutral-300, focus:border-neutral-900, remove rounded corners (square like wireframe)
- **Spacing:** px-6 lg:px-12 for containers, py-8 for sections
- **Borders:** border-neutral-200 for dividers

---

## Midtrans Integration (Placeholder)

The checkout form will prepare order data for Midtrans. Actual integration:

1. On "Lanjut ke Pembayaran" click:
   - Validate all form fields
   - Create order record (mock for now)
   - Generate Midtrans snap token (API call - placeholder)
   - Redirect to Midtrans payment page

2. After payment:
   - Midtrans redirects to `/checkout/success?order_id=XXX`
   - Show confirmation with order details

For now, submission will redirect to `/checkout/success?order_id=ARD-2024-0042` with mock data.

---

## File Structure

```
app/(store)/
├── cart/
│   └── page.tsx
├── checkout/
│   ├── page.tsx
│   └── success/
│       └── page.tsx

components/
├── cart/
│   ├── cart-item.tsx
│   ├── order-summary.tsx
│   └── empty-cart.tsx
├── checkout/
│   ├── checkout-progress.tsx
│   ├── contact-form.tsx
│   ├── shipping-address-form.tsx
│   ├── shipping-method-selector.tsx
│   ├── order-summary-card.tsx
│   └── order-confirmation-card.tsx

lib/
├── store/
│   ├── cart.ts
│   └── checkout.ts
├── constants/
│   ├── provinces.ts
│   └── shipping.ts
└── utils/
    └── validators.ts
```

---

## Success Criteria

1. Cart page displays items, allows quantity changes, promo code application
2. Checkout page validates all required fields before submission
3. Shipping method selection updates order total
4. Order confirmation shows correct order details from URL params
5. Zustand store persists cart state across navigation
6. Mobile responsive layouts match wireframe
7. Design matches existing homepage styling

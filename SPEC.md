# Arne's Dive Shop - Project Foundation

> E-commerce platform for a dive shop with ISR-powered storefront and dynamic admin dashboard.

## Architecture: Vertical Slice + Clean Architecture

Each feature is a **self-contained vertical slice**. Layer depth varies by complexity:

**Complex features (products, orders, payment):**
```
features/orders/
├── domain/           # Entities, business rules
├── application/      # Queries, commands, validators
└── presentation/     # UI components
```

**Simple features (banners, categories):**
```
features/banners/
└── presentation/     # Direct DB queries, UI components
```

**Principle:** Start simple, add layers only when needed. No premature abstraction.

**Benefits:**
- High cohesion — related code stays together
- Easy to navigate — find everything in one folder
- Right-sized — no over-engineering simple CRUD
- Testable — domain layer has zero dependencies when you need it

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Validation | Zod |
| State (Admin) | TanStack Query v5 |
| State (Cart) | React Context + localStorage |
| Auth | NextAuth.js v5 / Auth.js |
| Payment | Midtrans |
| Forms | React Hook Form + Zod resolver |
| UI Components | Radix UI primitives (headless) |

---

## Directory Structure

```
/
├── app/                          # Next.js App Router (thin routing layer)
│   ├── (store)/                  # Storefront routes (ISR)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # → features/home
│   │   ├── products/[slug]/page.tsx
│   │   ├── category/[...slug]/page.tsx
│   │   ├── search/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/
│   │   │   ├── page.tsx
│   │   │   └── success/page.tsx
│   │   ├── account/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (admin)/                  # Admin routes (CSR + TanStack Query)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # → features/dashboard
│   │   ├── products/
│   │   ├── categories/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── promotions/
│   │   ├── banners/
│   │   ├── reports/
│   │   ├── users/
│   │   └── settings/
│   │
│   └── api/                      # API routes → delegates to features
│       ├── auth/[...nextauth]/route.ts
│       ├── payment/
│       │   └── webhook/route.ts  # Midtrans webhook
│       ├── products/
│       ├── categories/
│       ├── orders/
│       └── ...
│
├── features/                     # VERTICAL SLICES (core business logic)
│   │
│   ├── auth/
│   │   ├── domain/
│   │   │   ├── user.ts
│   │   │   └── session.ts
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── login.ts
│   │   │   │   └── register.ts
│   │   │   └── validators/
│   │   │       ├── login.schema.ts
│   │   │       └── register.schema.ts
│   │   └── presentation/
│   │       ├── login-form.tsx
│   │       └── register-form.tsx
│   │
│   ├── products/
│   │   ├── domain/
│   │   │   ├── product.ts
│   │   │   ├── variant.ts
│   │   │   └── rules/
│   │   │       └── can-publish.ts
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── create-product.ts
│   │   │   │   ├── update-product.ts
│   │   │   │   └── delete-product.ts
│   │   │   ├── queries/
│   │   │   │   ├── get-product.ts
│   │   │   │   ├── get-products.ts
│   │   │   │   └── search-products.ts
│   │   │   └── validators/
│   │   │       ├── create-product.schema.ts
│   │   │       └── update-product.schema.ts
│   │   └── presentation/
│   │       ├── store/
│   │       │   ├── product-card.tsx
│   │       │   ├── product-grid.tsx
│   │       │   └── product-gallery.tsx
│   │       └── admin/
│   │           ├── product-form.tsx
│   │           ├── product-list.tsx
│   │           └── columns.tsx
│   │
│   ├── categories/                  # Simple CRUD, no full CQRS
│   │   └── presentation/
│   │       ├── store/
│   │       │   └── category-nav.tsx
│   │       └── admin/
│   │           └── category-form.tsx
│   │
│   ├── cart/
│   │   ├── domain/
│   │   │   └── cart-item.ts
│   │   ├── infrastructure/
│   │   │   └── cart-context.tsx     # Context + useReducer + localStorage
│   │   └── presentation/
│   │       ├── cart-drawer.tsx
│   │       └── cart-item.tsx
│   │
│   ├── orders/
│   │   ├── domain/
│   │   │   ├── order.ts
│   │   │   └── rules/
│   │   │       ├── can-cancel.ts
│   │   │       └── calculate-order-total.ts
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── create-order.ts  # Transactional: order + items
│   │   │   │   └── update-order-status.ts
│   │   │   └── queries/
│   │   │       ├── get-order.ts
│   │   │       └── get-orders.ts
│   │   └── presentation/
│   │       ├── store/
│   │       │   ├── checkout-form.tsx
│   │       │   └── order-confirmation.tsx
│   │       └── admin/
│   │           ├── order-table.tsx
│   │           └── order-detail.tsx
│   │
│   ├── payment/                     # Payment gateway abstraction
│   │   ├── domain/
│   │   │   ├── payment.ts
│   │   │   └── rules/
│   │   │       └── is-payment-valid.ts
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── create-transaction.ts
│   │   │   │   └── handle-webhook.ts
│   │   │   └── providers/
│   │   │       ├── types.ts         # PaymentProvider interface
│   │   │       └── midtrans.ts      # Midtrans implementation
│   │   └── presentation/
│   │       └── store/
│   │           └── payment-form.tsx
│   │
│   ├── customers/
│   │   ├── domain/
│   │   ├── application/
│   │   └── presentation/
│   │
│   ├── promotions/
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   └── validators/
│   │   └── presentation/
│   │       └── admin/
│   │
│   ├── banners/                    # Simple CRUD, no full CQRS
│   │   └── presentation/
│   │       ├── store/
│   │       │   └── hero-carousel.tsx
│   │       └── admin/
│   │           └── banner-form.tsx
│   │
│   ├── dashboard/
│   │   ├── application/
│   │   │   └── queries/
│   │   │       ├── get-stats.ts
│   │   │       └── get-sales-chart.ts
│   │   └── presentation/
│   │       └── stats-cards.tsx
│   │
│   ├── home/
│   │   └── presentation/
│   │       ├── hero-section.tsx
│   │       └── featured-products.tsx
│   │
│   └── search/
│       └── presentation/
│           └── search-bar.tsx
│
├── components/                   # SHARED UI COMPONENTS
│   ├── ui/                       # Primitives (Radix + Tailwind)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── store-layout.tsx
│   │   ├── admin-layout.tsx
│   │   └── header.tsx
│   └── shared/
│       ├── data-table/
│       ├── page-header.tsx
│       └── empty-state.tsx
│
├── lib/                          # CORE INFRASTRUCTURE
│   ├── db/
│   │   ├── schema.ts
│   │   ├── index.ts
│   │   └── migrations/
│   ├── api/
│   │   ├── client.ts
│   │   └── errors.ts
│   ├── auth/
│   │   └── config.ts
│   └── utils/
│       ├── cn.ts
│       ├── format.ts
│       └── money.ts
│
├── types/                        # SHARED TYPES
│   └── api.ts
│
├── config/
│   ├── site.ts
│   └── constants.ts
│
└── middleware.ts
```

---

## Layer Responsibilities

### Domain Layer
Pure business logic, no external dependencies.

```typescript
// features/products/domain/product.ts
export interface Product {
  id: string;
  name: string;
  slug: string;
  priceCents: number;        // Store as cents (integer) to avoid floating-point issues
  categoryId: string;
  images: string[];
  isActive: boolean;
}

export type ProductStatus = 'draft' | 'active' | 'archived';
```

```typescript
// features/orders/domain/rules/calculate-order-total.ts
/**
 * WHY THIS IS DIFFERENT FROM CART TOTAL:
 * - Cart total: client-side, pre-tax, pre-shipping, simple sum
 * - Order total: server-side, final, includes tax + shipping + discounts
 * 
 * Order total is the source of truth for what was actually charged.
 * Cart total is just an estimate shown to the user.
 */
export function calculateOrderTotal(input: {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
}): number {
  return input.subtotalCents + input.shippingCents + input.taxCents - input.discountCents;
}
```

```typescript
// features/products/domain/rules/can-publish.ts
export function canPublish(product: Product): boolean {
  return !!(
    product.name &&
    product.slug &&
    product.priceCents > 0 &&
    product.categoryId &&
    product.images.length > 0
  );
}
```

### Application Layer
Use cases — commands (writes) and queries (reads).

**Commands use Server Actions:**
```typescript
// features/products/application/commands/create-product.ts
'use server';

import { db, products } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { createProductSchema } from '../validators/create-product.schema';

export async function createProduct(input: unknown) {
  const session = await auth();
  if (!session?.user || session.user.role === 'customer') {
    throw new Error('Unauthorized');
  }

  const validated = createProductSchema.parse(input);
  const [product] = await db.insert(products).values({
    ...validated,
    priceCents: validated.priceDollars * 100,
  }).returning();

  revalidatePath('/admin/products');
  revalidatePath(`/products/${product.slug}`);

  return product;
}
```

**Order creation with transaction (atomic):**
```typescript
// features/orders/application/commands/create-order.ts
'use server';

import { db, orders, orderItems, payments } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createOrderSchema } from '../validators/create-order.schema';
import { generateOrderNumber } from '../../domain/rules/generate-order-number';
import { createMidtransTransaction } from '@/features/payment/application/providers/midtrans';

export async function createOrder(input: unknown, idempotencyKey: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validated = createOrderSchema.parse(input);

  // Atomic transaction: order + items must succeed together
  const result = await db.transaction(async (tx) => {
    // 1. Create order
    const [order] = await tx.insert(orders).values({
      orderNumber: generateOrderNumber(),
      customerId: session.user.customerId,
      status: 'pending_payment',
      subtotalCents: validated.subtotalCents,
      shippingCents: validated.shippingCents,
      taxCents: validated.taxCents,
      discountCents: validated.discountCents,
      totalCents: validated.totalCents,
      idempotencyKey,  // Prevents duplicate orders from double-submit
    }).returning();

    // 2. Create order items (must succeed or roll back order)
    await tx.insert(orderItems).values(
      validated.items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        quantity: item.quantity,
        priceCents: item.priceCents,
      }))
    );

    // 3. Create initial payment record
    const [payment] = await tx.insert(payments).values({
      orderId: order.id,
      status: 'pending',
      amountCents: order.totalCents,
      provider: 'midtrans',
      idempotencyKey,
    }).returning();

    return { order, payment };
  });

  // 4. Create Midtrans transaction (outside tx - external service)
  const midtransResponse = await createMidtransTransaction({
    orderId: result.order.id,
    grossAmount: result.order.totalCents,
    customerDetails: {
      email: session.user.email,
      firstName: validated.shippingAddress.firstName,
      lastName: validated.shippingAddress.lastName,
    },
  });

  return {
    order: result.order,
    paymentUrl: midtransResponse.redirectUrl,
  };
}
```

**Queries for Storefront (Server Components, ISR):**
```typescript
// features/products/application/queries/get-product-by-slug.ts
import { db } from '@/lib/db';

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({
    where: (products, { eq }) => eq(products.slug, slug),
    with: { variants: true, category: true },
  });
  
  if (!product) return null;
  
  return {
    ...product,
    priceDollars: product.priceCents / 100,
  };
}
```

**Queries for Admin (Route Handlers + TanStack Query):**
```typescript
// app/api/products/route.ts
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const products = await db.query.products.findMany({
    with: { variants: true, category: true },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
  
  return NextResponse.json(products.map(p => ({
    ...p,
    priceDollars: p.priceCents / 100,
  })));
}
```

### Presentation Layer
UI components, hooks.

**Store (Server Components - direct query import):**
```typescript
// features/products/presentation/store/product-grid.tsx
import { getProducts } from '../../application/queries/get-products';
import { ProductCard } from './product-card';

export async function ProductGrid({ categoryId }: { categoryId?: string }) {
  const products = await getProducts({ categoryId, isActive: true });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

**Admin (Client Components - Route Handler + TanStack Query):**
```typescript
// features/products/presentation/admin/product-list.tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export function ProductList() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
  });

  if (isLoading) return <Skeleton />;
  return <DataTable data={data} />;
}
```

---

## Payment Boundary

### Provider Interface

```typescript
// features/payment/application/providers/types.ts
export interface PaymentProvider {
  name: string;
  
  createTransaction(input: CreateTransactionInput): Promise<CreateTransactionOutput>;
  verifyWebhook(payload: unknown, signature: string): Promise<WebhookData>;
}

export interface CreateTransactionInput {
  orderId: string;
  grossAmountCents: number;
  customerDetails: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  idempotencyKey: string;
}

export interface CreateTransactionOutput {
  transactionId: string;
  redirectUrl?: string;      // For redirect-based payment
  qrCode?: string;           // For QRIS
  expireAt: Date;
}

export interface WebhookData {
  orderId: string;
  transactionId: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  paidAt?: Date;
  paymentType: string;
}
```

### Midtrans Implementation

```typescript
// features/payment/application/providers/midtrans.ts
import type { PaymentProvider, CreateTransactionInput, CreateTransactionOutput, WebhookData } from './types';
import { MIDTRANS_SERVER_KEY, MIDTRANS_IS_PRODUCTION } from '@/config/payment';

export const midtransProvider: PaymentProvider = {
  name: 'midtrans',

  async createTransaction(input: CreateTransactionInput): Promise<CreateTransactionOutput> {
    const baseUrl = MIDTRANS_IS_PRODUCTION 
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: input.orderId,
          gross_amount: input.grossAmountCents / 100, // Midtrans expects dollars
        },
        customer_details: {
          email: input.customerDetails.email,
          first_name: input.customerDetails.firstName,
          last_name: input.customerDetails.lastName,
          phone: input.customerDetails.phone,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create Midtrans transaction');
    }

    const data = await response.json();
    
    return {
      transactionId: data.token,
      redirectUrl: data.redirect_url,
      expireAt: new Date(data.expiry_time),
    };
  },

  async verifyWebhook(payload: unknown, signature: string): Promise<WebhookData> {
    // Verify signature using Midtrans server key
    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha512', MIDTRANS_SERVER_KEY)
      .update(payloadString)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    const data = payload as any;
    
    return {
      orderId: data.order_id,
      transactionId: data.transaction_id,
      status: mapMidtransStatus(data.transaction_status),
      paidAt: data.settlement_time ? new Date(data.settlement_time) : undefined,
      paymentType: data.payment_type,
    };
  },
};

function mapMidtransStatus(status: string): WebhookData['status'] {
  switch (status) {
    case 'settlement':
    case 'capture':
      return 'paid';
    case 'pending':
      return 'pending';
    case 'deny':
    case 'cancel':
    case 'expire':
      return 'failed';
    default:
      return 'pending';
  }
}
```

### Webhook Handler

```typescript
// app/api/payment/webhook/route.ts
import { db, orders, payments } from '@/lib/db';
import { midtransProvider } from '@/features/payment/application/providers/midtrans';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const payload = await req.json();
  const signature = req.headers.get('x-signature') ?? '';
  const authKey = req.headers.get('x-auth-key') ?? '';

  // Verify webhook authenticity
  if (authKey !== process.env.MIDTRANS_SERVER_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const webhookData = await midtransProvider.verifyWebhook(payload, signature);

    // Update payment and order status atomically
    await db.transaction(async (tx) => {
      const [payment] = await tx
        .update(payments)
        .set({
          status: webhookData.status,
          providerTransactionId: webhookData.transactionId,
          paidAt: webhookData.paidAt,
          paymentMethod: webhookData.paymentType,
        })
        .where(eq(payments.orderId, webhookData.orderId))
        .returning();

      if (payment && webhookData.status === 'paid') {
        await tx
          .update(orders)
          .set({ status: 'processing' })
          .where(eq(orders.id, webhookData.orderId));
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

---

## Route → Feature Mapping

Routes are thin — they import from features.

**Storefront (Server Component imports query directly):**
```typescript
// app/(store)/products/[slug]/page.tsx
import { getProductBySlug } from '@/features/products/application/queries/get-product-by-slug';
import { ProductView } from '@/features/products/presentation/store/product-view';

export const revalidate = 3600;

export default async function Page({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  return <ProductView product={product} />;
}
```

**Admin (Client Component fetches Route Handler):**
```typescript
// app/(admin)/products/page.tsx
import { ProductList } from '@/features/products/presentation/admin/product-list';

export default function Page() {
  return <ProductList />;
}
```

**Route Handler for Admin reads:**
```typescript
// app/api/products/route.ts
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const products = await db.query.products.findMany({
    with: { variants: true, category: true },
  });
  return NextResponse.json(products);
}
```

**Server Action for mutations (both Store and Admin):**
```typescript
// Called from forms, not TanStack Query
<form action={createProduct}>...</form>
```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         STOREFRONT (ISR)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Server Component ──► Query (direct import) ──► Drizzle ──► DB │
│       (page.tsx)        (get-product.ts)                        │
│                                                                 │
│  Mutations: Server Action ◄── Form submission                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           ADMIN (CSR)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client Component ──► fetch() ──► Route Handler ──► Drizzle    │
│    (product-list)         TanStack     (api/...)                │
│                           Query                                  │
│                                                                 │
│  Mutations: Server Action ◄── Form submission                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. createOrder (Server Action)                                 │
│     └─► DB Transaction: order + items + payment (pending)       │
│     └─► Midtrans API: create transaction → redirect URL         │
│                                                                 │
│  2. Customer pays via Midtrans                                  │
│                                                                 │
│  3. Midtrans Webhook → /api/payment/webhook                     │
│     └─► Verify signature                                        │
│     └─► DB Transaction: update payment + order status           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

WHY THE DIFFERENCE?

Store = ISR:
  - SEO needs static HTML → Server Components
  - Direct query import = no HTTP overhead, fast builds
  
Admin = CSR:
  - Real-time updates needed → TanStack Query
  - Route Handler = HTTP cacheable, prefetchable, parallelizable
  - Server Actions for reads would be sequential POSTs (slow)
```

---

## Database Schema

```typescript
// lib/db/schema.ts
import { pgTable, text, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'expired',
]);

export const promotionTypeEnum = pgEnum('promotion_type', [
  'percentage',
  'fixed_cents',
]);

export const bannerPositionEnum = pgEnum('banner_position', [
  'hero',
  'sidebar',
  'footer',
]);

export const userRoleEnum = pgEnum('user_role', ['customer', 'admin', 'super_admin']);

// Tables
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password'),
  role: userRoleEnum('role').default('customer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  parentId: text('parent_id').references((): any => categories.id),
  sortOrder: integer('sort_order').default(0),
});

export const brands = pgTable('brands', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  sku: text('sku').unique(),
  description: text('description'),
  priceCents: integer('price_cents').notNull(),
  compareAtPriceCents: integer('compare_at_price_cents'),
  costPriceCents: integer('cost_price_cents'),
  categoryId: text('category_id').references(() => categories.id).notNull(),
  brandId: text('brand_id').references(() => brands.id),
  images: jsonb('images').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true).notNull(),  // Sole availability flag
  isFeatured: boolean('is_featured').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  sku: text('sku').unique(),
  name: text('name').notNull(),
  options: jsonb('options').$type<Record<string, string>>().notNull(),
  priceCents: integer('price_cents'),
  isActive: boolean('is_active').default(true),
});

export const customers = pgTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  totalSpentCents: integer('total_spent_cents').default(0),
});

export const addresses = pgTable('addresses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  address1: text('address1').notNull(),
  address2: text('address2'),
  city: text('city').notNull(),
  state: text('state'),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull(),
  phone: text('phone'),
  isDefault: boolean('is_default').default(false),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderNumber: text('order_number').notNull().unique(),
  customerId: text('customer_id').references(() => customers.id).notNull(),
  status: orderStatusEnum('status').default('pending_payment').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  shippingCents: integer('shipping_cents').default(0).notNull(),
  taxCents: integer('tax_cents').default(0).notNull(),
  discountCents: integer('discount_cents').default(0).notNull(),
  totalCents: integer('total_cents').notNull(),
  idempotencyKey: text('idempotency_key').unique(),  // Prevents double-submit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  variantId: text('variant_id').references(() => productVariants.id),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  priceCents: integer('price_cents').notNull(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').references(() => orders.id).notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  amountCents: integer('amount_cents').notNull(),
  provider: text('provider').notNull(),  // 'midtrans'
  providerTransactionId: text('provider_transaction_id'),
  paymentMethod: text('payment_method'),  // 'gopay', 'bank_transfer', etc.
  paidAt: timestamp('paid_at'),
  expiredAt: timestamp('expired_at'),
  idempotencyKey: text('idempotency_key').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const promotions = pgTable('promotions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: promotionTypeEnum('type').notNull(),
  valueCents: integer('value_cents').notNull(),
  minOrderCents: integer('min_order_cents'),
  maxUses: integer('max_uses'),
  usesCount: integer('uses_count').default(0),
  isActive: boolean('is_active').default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
});

export const banners = pgTable('banners', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title'),
  subtitle: text('subtitle'),
  image: text('image').notNull(),
  link: text('link'),
  position: bannerPositionEnum('position').default('hero'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
});

// Auth.js tables
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').references(() => users.id).notNull(),
  expires: timestamp('expires').notNull(),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
});
```

---

## Money Handling Convention

```typescript
// lib/utils/money.ts

/**
 * ALL money is stored as INTEGER CENTS in the database.
 * 
 * Why: Floating-point math is imprecise (0.1 + 0.2 !== 0.3)
 * PostgreSQL DECIMAL would work, but integers are simpler and faster.
 * 
 * Convention:
 * - DB column: priceCents (integer)
 * - API response: priceDollars (number, converted at boundary)
 * - Display: formatCurrency(priceCents)
 */

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function formatCurrency(cents: number, currency = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

// Example usage:
// DB: { priceCents: 199900 }
// API: { priceDollars: 1999.00 }
// Display: formatCurrency(199900) => "Rp1.999"
```

---

## Cart State (React Context)

```typescript
// features/cart/infrastructure/cart-context.tsx
'use client';

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';

/**
 * WHY CART TOTAL IS DIFFERENT FROM ORDER TOTAL:
 *
 * Cart total (this file{}
):
 * - Client-side only, stored in localStorage
 * - Simple sum of line items
 * - NO tax, NO shipping, NO discounts yet
 * - Just an estimate for the user
 *
 * Order total (features/orders/domain/rules/calculate-order-total.ts):
 * - Server-side, stored in database
 * - Final amount actually charged
 * - Includes tax, shipping, discounts
 * - Source of truth for payment
 */

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  priceCents: number;
  quantity: number;
  image: string;
}

type State = { items: CartItem[] };
type Action =
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; productId: string; variantId?: string }
  | { type: 'UPDATE'; productId: string; quantity: number; variantId?: string }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; items: CartItem[] };

const CartContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
  totalCents: () => number;
  count: () => number;
} | null>(null);

function cartReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find(
        i => i.productId === action.item.productId && i.variantId === action.item.variantId
      );
      if (existing) {
        return {
          items: state.items.map(i =>
            i.productId === action.item.productId && i.variantId === action.item.variantId
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, action.item] };
    }
    case 'REMOVE':
      return {
        items: state.items.filter(
          i => !(i.productId === action.productId && i.variantId === action.variantId)
        ),
      };
    case 'UPDATE':
      return {
        items: state.items.map(i =>
          i.productId === action.productId && i.variantId === action.variantId
            ? { ...i, quantity: action.quantity }
            : i
        ),
      };
    case 'CLEAR':
      return { items: [] };
    case 'LOAD':
      return { items: action.items };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) dispatch({ type: 'LOAD', items: JSON.parse(saved) });
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const totalCents = () => state.items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const count = () => state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ state, dispatch, totalCents, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
```

---

## Auth Middleware

```typescript
// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isAdmin = nextUrl.pathname.startsWith('/admin');
  const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

  if (isAdmin && !session?.user) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  if (isAdmin && session?.user?.role === 'customer') {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  if (isAuthPage && session?.user) {
    return NextResponse.redirect(new URL('/account', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/login', '/register', '/account/:path*'],
};
```

---

## Testing Strategy

### What Gets Tested Where

| Layer | Test Type | Why |
|-------|-----------|-----|
| Domain | Unit tests (pure functions) | No dependencies, fast, deterministic |
| Application | Integration tests (DB transaction) | Tests actual DB behavior |
| Presentation | Component tests (optional) | UI is volatile, test critical paths only |

### Domain Layer Test Example

```typescript
// features/orders/domain/rules/__tests__/calculate-order-total.test.ts
import { describe, it, expect } from 'vitest';
import { calculateOrderTotal } from '../calculate-order-total';

describe('calculateOrderTotal', () => {
  it('calculates total correctly with all components', () => {
    const result = calculateOrderTotal({
      subtotalCents: 100000,   // Rp1.000.000
      shippingCents: 10000,    // Rp100.000
      taxCents: 11000,         // Rp110.000 (11% PPN)
      discountCents: 5000,     // Rp50.000
    });

    // 100000 + 10000 + 11000 - 5000 = 116000
    expect(result).toBe(116000);
  });

  it('handles zero values', () => {
    const result = calculateOrderTotal({
      subtotalCents: 50000,
      shippingCents: 0,
      taxCents: 0,
      discountCents: 0,
    });

    expect(result).toBe(50000);
  });

  it('handles full discount (free order)', () => {
    const result = calculateOrderTotal({
      subtotalCents: 100000,
      shippingCents: 10000,
      taxCents: 11000,
      discountCents: 121000,  // Discount covers everything
    });

    expect(result).toBe(0);
  });

  it('does not allow negative result', () => {
    // This would be a business rule - if discount exceeds total, 
    // the result should be 0, not negative
    // Current implementation doesn't handle this - it's a design decision
    const result = calculateOrderTotal({
      subtotalCents: 100000,
      shippingCents: 0,
      taxCents: 0,
      discountCents: 200000,  // More than subtotal
    });

    expect(result).toBe(-100000);  // BUG: Should we cap at 0?
  });
});
```

### Application Layer Test Example

```typescript
// features/orders/application/commands/__tests__/create-order.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { createOrder } from '../create-order';

describe('createOrder', () => {
  beforeEach(async () => {
    // Reset test database
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(payments);
  });

  it('creates order and items atomically', async () => {
    const input = {
      subtotalCents: 100000,
      shippingCents: 10000,
      taxCents: 11000,
      discountCents: 0,
      totalCents: 121000,
      items: [
        { productId: 'prod-1', name: 'Dive Mask', quantity: 1, priceCents: 50000 },
        { productId: 'prod-2', name: 'Fins', quantity: 1, priceCents: 50000 },
      ],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'Bali',
        postalCode: '80361',
        country: 'ID',
      },
    };

    const result = await createOrder(input, 'idempotency-key-123');

    expect(result.order.orderNumber).toMatch(/^ORD-/);
    expect(result.order.status).toBe('pending_payment');
    expect(result.paymentUrl).toBeDefined();

    // Verify items were created
    const items = await db.query.orderItems.findMany({
      where: (items, { eq }) => eq(items.orderId, result.order.id),
    });
    expect(items).toHaveLength(2);
  });

  it('rejects duplicate idempotency key', async () => {
    const input = { /* ... */ };
    
    await createOrder(input, 'duplicate-key');
    
    await expect(createOrder(input, 'duplicate-key')).rejects.toThrow();
  });
});
```

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@tanstack/react-query": "^5",
    "drizzle-orm": "^0.33",
    "postgres": "^3",
    "zod": "^3",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3",
    "@radix-ui/react-dialog": "^1",
    "@radix-ui/react-dropdown-menu": "^2",
    "@radix-ui/react-select": "^2",
    "@radix-ui/react-tabs": "^1",
    "@radix-ui/react-toast": "^1",
    "next-auth": "^5",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "lucide-react": "^0.400",
    "date-fns": "^3"
  },
  "devDependencies": {
    "typescript": "^5",
    "drizzle-kit": "^0.24",
    "tailwindcss": "^4",
    "vitest": "^2",
    "@testing-library/react": "^16"
  }
}
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Midtrans
MIDTRANS_SERVER_KEY="..."
MIDTRANS_CLIENT_KEY="..."
MIDTRANS_IS_PRODUCTION="false"
```

---

## Commands

```bash
pnpm dev                    # Start dev server
pnpm drizzle-kit push       # Push schema to database
pnpm drizzle-kit studio     # Open Drizzle Studio
pnpm build                  # Build for production
pnpm test                   # Run tests (Vitest)
```

---

## Key Decisions

1. **Vertical Slices** — Features are self-contained, but simpler features use simpler structures
   - `products`, `orders`, `payment`: Full domain/application/presentation layers
   - `banners`, `categories`: Presentation layer only, direct DB queries

2. **Clean Architecture Layers** — Domain → Application → Presentation (no infrastructure abstraction)
   - Domain: Pure TypeScript, no framework dependencies
   - Application: Direct Drizzle queries, no repository pattern for CRUD
   - Presentation: Components + Route Handlers

3. **Query/Command Split**
   - **Commands (mutations)**: Server Actions (`'use server'`) — form submissions, state changes
   - **Store queries (reads)**: Direct query import in Server Components — no HTTP overhead
   - **Admin queries (reads)**: Route Handlers + TanStack Query — HTTP cached, parallelizable

4. **Thin Routes** — `app/` only imports from features, no business logic

5. **Shared UI** — Only truly reusable primitives in `components/ui/`

6. **No Inventory Tracking** — Client dropped the feature. Product availability is `products.isActive` only. Removed inventory table and all stock-related code.

7. **Money as Cents** — All prices stored as integers (cents), converted at boundaries:
   - DB: `priceCents: integer`
   - API: `priceDollars: number` (for display)
   - Display: `formatCurrency(cents)` → "Rp1.999"

8. **Cart vs Order Totals** — Different calculations, clearly documented:
   - Cart total: client-side estimate, no tax/shipping
   - Order total: server-side final, includes tax/shipping/discounts

9. **React Context for Cart** — Client-side only, persisted to localStorage, zero dependencies

10. **TanStack Query for Admin** — Fetches from Route Handlers (not Server Actions) for HTTP caching

11. **Atomic Order Creation** — Order + orderItems + payment inserted in single transaction. If any fails, all roll back.

12. **Payment Boundary** — Provider-agnostic interface (`PaymentProvider`) allows swapping Midtrans for Stripe/Xendit without touching order logic.

13. **Idempotency Keys** — Prevents double charges from double form-submits. Stored on orders and payments.

14. **pgEnum for String Types** — `promotions.type`, `banners.position`, `order_status`, `payment_status` all use pgEnum instead of loose text.

---

This architecture emphasizes:
- **Locality** — Find all product code in `features/products/`
- **Testability** — Domain layer has zero dependencies
- **Separation** — Business logic isolated from Next.js specifics
- **Consistency** — Single source of truth for money (cents) and availability (isActive)
- **Atomicity** — Critical operations (orders, payments) use transactions
- **Scalability** — Add features without touching existing code

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
  isActive: boolean('is_active').default(true).notNull(),
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
  idempotencyKey: text('idempotency_key').unique(),
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
  provider: text('provider').notNull(),
  providerTransactionId: text('provider_transaction_id'),
  paymentMethod: text('payment_method'),
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

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
});

import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// Enums
// ============================================================================

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

// ============================================================================
// RajaOngkir Cache
// ============================================================================

export const rajaongkirProvinces = pgTable('rajaongkir_provinces', {
  id: text('id').primaryKey(), // RajaOngkir province_id (numeric as string)
  name: text('name').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rajaongkirCities = pgTable('rajaongkir_cities', {
  id: text('id').primaryKey(), // RajaOngkir city_id (numeric as string)
  name: text('name').notNull(),
  type: text('type').notNull(), // "Kabupaten" or "Kota"
  provinceId: text('province_id').notNull(),
  province: text('province').notNull(),
  postalCode: text('postal_code'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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

export const divingTypeEnum = pgEnum('diving_type', ['freediving', 'scuba']);

// ============================================================================
// Newsletter Subscribers
// ============================================================================

export const subscribers = pgTable('subscribers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  unsubscribedAt: timestamp('unsubscribed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// Users & Authentication
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password'), // Hashed password for credentials auth
  emailVerified: timestamp('email_verified'),
  role: userRoleEnum('role').default('customer').notNull(),
  blockedAt: timestamp('blocked_at'), // If set, user is blocked
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(), // Usually email
  token: text('token').notNull().unique(),
  expires: timestamp('expires', { withTimezone: true, mode: 'date' }).notNull(),
});

// ============================================================================
// Categories & Brands
// ============================================================================

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const brands = pgTable('brands', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// Products
// ============================================================================

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  sku: text('sku'),
  description: text('description'),
  priceCents: integer('price_cents').notNull(), // All prices stored as cents (integer)
  compareAtPriceCents: integer('compare_at_price_cents'), // Original price for sales
  costPriceCents: integer('cost_price_cents'), // For margin calculations
  categoryId: text('category_id')
    .references(() => categories.id)
    .notNull(),
  brandId: text('brand_id').references(() => brands.id),
  divingTypes: divingTypeEnum('diving_types').array().notNull(), // ['freediving', 'scuba'] or just one
  images: jsonb('images').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true).notNull(), // Sole availability flag (no stock qty tracking)
  isFeatured: boolean('is_featured').default(false),
  isNewArrival: boolean('is_new_arrival').default(false).notNull(),
  isOnSale: boolean('is_on_sale').default(false).notNull(),
  weightGrams: integer('weight_grams').default(500), // Product weight in grams, default 500g
  deletedAt: timestamp('deleted_at'), // For soft-delete
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  sku: text('sku'),
  name: text('name').notNull(), // e.g., "Red / Large"
  options: jsonb('options').$type<Record<string, string>>().notNull(), // e.g., { color: 'red', size: 'L' }
  priceCents: integer('price_cents'), // Null means use product base price
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// Customers & Addresses
// ============================================================================

export const customers = pgTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id), // Link to auth user
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  totalSpentCents: integer('total_spent_cents').default(0).notNull(),
  notes: text('notes'), // Admin notes about customer
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const addresses = pgTable('addresses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull().default('Alamat'), // Label like "Rumah", "Kantor"
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  // Street address
  address1: text('address1').notNull(),
  address2: text('address2'),
  // RajaOngkir destination
  rajaongkirCityId: text('rajaongkir_city_id').notNull(),
  rajaongkirCityName: text('rajaongkir_city_name'),
  rajaongkirProvince: text('rajaongkir_province'),
  rajaongkirCity: text('rajaongkir_city'),
  rajaongkirDistrict: text('rajaongkir_district'),
  rajaongkirSubdistrict: text('rajaongkir_subdistrict'),
  rajaongkirPostalCode: text('rajaongkir_postal_code'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// Cart
// ============================================================================

export const carts = pgTable('carts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id),
  guestId: text('guest_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cartItems = pgTable('cart_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  cartId: text('cart_id')
    .references(() => carts.id, { onDelete: 'cascade' })
    .notNull(),
  productId: text('product_id')
    .references(() => products.id)
    .notNull(),
  variantId: text('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const checkoutSessions = pgTable('checkout_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id),
  guestId: text('guest_id'),
  cartId: text('cart_id').references(() => carts.id),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  fullName: text('full_name').notNull(),
  // Shipping address (street level)
  address1: text('address1').notNull(),
  address2: text('address2'),
  notes: text('notes'),
  // RajaOngkir destination (subdistrict level for pricing)
  rajaongkirCityId: text('rajaongkir_city_id').notNull(),
  rajaongkirCityName: text('rajaongkir_city_name'),
  rajaongkirProvince: text('rajaongkir_province'),
  rajaongkirCity: text('rajaongkir_city'),
  rajaongkirDistrict: text('rajaongkir_district'),
  rajaongkirSubdistrict: text('rajaongkir_subdistrict'),
  rajaongkirPostalCode: text('rajaongkir_postal_code'),
  // Backward compatibility fields
  city: text('city'),
  province: text('province'),
  postalCode: text('postal_code'),
  country: text('country').notNull().default('Indonesia'),
  shippingMethod: text('shipping_method'),
  subtotalCents: integer('subtotal_cents'),
  shippingCents: integer('shipping_cents'),
  totalCents: integer('total_cents'),
  status: text('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// Orders
// ============================================================================

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderNumber: text('order_number').notNull().unique(),
  customerId: text('customer_id')
    .references(() => customers.id)
    .notNull(),
  status: orderStatusEnum('status').default('pending_payment').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  shippingCents: integer('shipping_cents').default(0).notNull(),
  taxCents: integer('tax_cents').default(0).notNull(),
  discountCents: integer('discount_cents').default(0).notNull(),
  totalCents: integer('total_cents').notNull(),
  idempotencyKey: text('idempotency_key').unique(), // Prevents double-submit
  // Shipping address snapshots (denormalized for order history accuracy)
  shippingFirstName: text('shipping_first_name').notNull(),
  shippingLastName: text('shipping_last_name').notNull(),
  shippingPhone: text('shipping_phone'),
  shippingAddress1: text('shipping_address1').notNull(),
  shippingAddress2: text('shipping_address2'),
  shippingCity: text('shipping_city').notNull(),
  shippingState: text('shipping_state'),
  shippingPostalCode: text('shipping_postal_code').notNull(),
  shippingCountry: text('shipping_country').notNull(),
  notes: text('notes'), // Customer notes
  // Shipping tracking
  trackingNumber: text('tracking_number'), // Nomor resi
  shippedAt: timestamp('shipped_at'), // When order was shipped
  deliveredAt: timestamp('delivered_at'), // When order was delivered
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: text('product_id')
    .references(() => products.id)
    .notNull(),
  variantId: text('variant_id').references(() => productVariants.id),
  name: text('name').notNull(), // Snapshot of product name at time of order
  quantity: integer('quantity').notNull(),
  priceCents: integer('price_cents').notNull(), // Snapshot of price at time of order
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderStatusHistory = pgTable('order_status_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  status: orderStatusEnum('status').notNull(),
  note: text('note'),
  changedBy: text('changed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// Payments
// ============================================================================

export const payments = pgTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .references(() => orders.id)
    .notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  amountCents: integer('amount_cents').notNull(),
  provider: text('provider').notNull(), // 'midtrans'
  providerTransactionId: text('provider_transaction_id'),
  paymentMethod: text('payment_method'), // 'gopay', 'bank_transfer', etc.
  paidAt: timestamp('paid_at'),
  expiredAt: timestamp('expired_at'),
  idempotencyKey: text('idempotency_key').unique(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(), // Provider-specific data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// Promotions
// ============================================================================

export const promotions = pgTable('promotions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  type: promotionTypeEnum('type').notNull(),
  valueCents: integer('value_cents').notNull(), // Percentage (as basis points) or fixed cents
  minOrderCents: integer('min_order_cents'), // Minimum order value in cents
  maxUses: integer('max_uses'), // Total usage limit
  usesCount: integer('uses_count').default(0).notNull(),
  maxUsesPerCustomer: integer('max_uses_per_customer'), // Per-customer limit
  isActive: boolean('is_active').default(true).notNull(),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// Banners
// ============================================================================

export const banners = pgTable('banners', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title'),
  subtitle: text('subtitle'),
  imageUrl: text('image_url').notNull(),
  link: text('link'),
  position: bannerPositionEnum('position').default('hero').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  // Additional content for hero banners
  eyebrow: text('eyebrow'),
  ctaText: text('cta_text'),
  ctaLink: text('cta_link'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// Shop Settings
// ============================================================================

export const shopSettings = pgTable('shop_settings', {
  id: text('id').primaryKey().default('default'),
  // Shop info
  storeName: text('store_name').notNull().default("Arnesh Dive Shop"),
  email: text('email').notNull().default('support@arneshdive.com'),
  phone: text('phone').notNull().default('+62 812-3456-7890'),
  whatsapp: text('whatsapp').notNull().default('6281234567890'),
  businessHours: text('business_hours').notNull().default('Senin – Jumat: 09:00 – 17:00 WIB'),
  about: text('about'),
  // Address (from map picker)
  addressFormatted: text('address_formatted'),
  addressLat: text('address_lat'),
  addressLng: text('address_lng'),
  addressCity: text('address_city'),
  addressProvince: text('address_province'),
  // Shipping origin
  rajaongkirCityId: text('rajaongkir_city_id'),
  rajaongkirCityName: text('rajaongkir_city_name'), // Human readable: "Kota Denpasar, Bali"
  // Active couriers for shipping
  activeCouriers: text('active_couriers').default('jne,jnt,sicepat'),
  // Social media
  instagram: text('instagram'),
  tiktok: text('tiktok'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ShopSettings = typeof shopSettings.$inferSelect;
export type NewShopSettings = typeof shopSettings.$inferInsert;

// ============================================================================
// Relations
// ============================================================================

export const usersRelations = relations(users, ({ one }) => ({
  customer: one(customers, {
    fields: [users.id],
    references: [customers.userId],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  addresses: many(addresses),
  orders: many(orders),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, {
    fields: [addresses.customerId],
    references: [customers.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  changedByUser: one(users, {
    fields: [orderStatusHistory.changedBy],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const checkoutSessionsRelations = relations(checkoutSessions, ({ one }) => ({
  user: one(users, {
    fields: [checkoutSessions.userId],
    references: [users.id],
  }),
  cart: one(carts, {
    fields: [checkoutSessions.cartId],
    references: [carts.id],
  }),
}));

export const rajaongkirCitiesRelations = relations(rajaongkirCities, ({ one }) => ({
  province: one(rajaongkirProvinces, {
    fields: [rajaongkirCities.provinceId],
    references: [rajaongkirProvinces.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;

export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;

export type CheckoutSession = typeof checkoutSessions.$inferSelect;
export type NewCheckoutSession = typeof checkoutSessions.$inferInsert;

export type RajaongkirProvince = typeof rajaongkirProvinces.$inferSelect;
export type NewRajaongkirProvince = typeof rajaongkirProvinces.$inferInsert;

export type RajaongkirCity = typeof rajaongkirCities.$inferSelect;
export type NewRajaongkirCity = typeof rajaongkirCities.$inferInsert;

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;

// Enum type exports
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type PromotionType = (typeof promotionTypeEnum.enumValues)[number];
export type BannerPosition = (typeof bannerPositionEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type DivingType = (typeof divingTypeEnum.enumValues)[number];

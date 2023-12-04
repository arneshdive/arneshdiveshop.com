# Database Migrations

This directory contains Drizzle ORM migration files for the Arnesh Dive Shop database.

## Running Migrations

### Development

```bash
# Generate migrations from schema changes
pnpm db:generate

# Apply migrations to the database
pnpm db:migrate

# Push schema directly (bypasses migrations - use for dev only)
pnpm db:push

# Open Drizzle Studio to inspect the database
pnpm db:studio
```

### Production (Vercel)

Migrations are typically applied during the build process. For Neon databases:

1. Ensure `DATABASE_URL` is set in Vercel environment variables
2. Use `pnpm db:migrate` in your build script, or
3. Use `drizzle-kit push` if migrations folder is not available

**Recommended:** Run migrations as a separate deployment step before deploying the application code.

## Migration History

| Version | Tag | Description |
|---------|-----|-------------|
| 0000 | married_microbe | Initial schema with all 13 tables |

## Schema Overview

The database contains the following tables:

- **users** - Authentication users with role-based access (customer/admin/super_admin)
- **customers** - Customer profiles linked to users
- **addresses** - Customer shipping addresses
- **categories** - Hierarchical product categories
- **brands** - Product brands
- **products** - Product catalog with pricing in cents
- **product_variants** - Size/color variants with individual pricing
- **orders** - Customer orders with status tracking
- **order_items** - Line items with price snapshots
- **payments** - Payment records (Midtrans integration)
- **promotions** - Discount codes and promotions
- **banners** - Homepage banner content
- **verification_tokens** - OTP tokens for email verification

## Important Notes

### Money Storage
All monetary values are stored as integers in cents (not floats) to avoid rounding errors:
- `price_cents` fields on products, variants, order items
- `amount_cents` on payments
- `total_spent_cents` on customers

### Enums
PostgreSQL enums are used for:
- `order_status` - Order workflow states
- `payment_status` - Payment states
- `promotion_type` - Discount types
- `banner_position` - Banner placement
- `user_role` - Access control levels

### Relations
All foreign key relationships are defined in `schema.ts` with appropriate cascade rules:
- `product_variants` cascade delete when product is deleted
- `addresses` cascade delete when customer is deleted
- `order_items` cascade delete when order is deleted

## Troubleshooting

### Migration Fails on Existing Database
If tables already exist, use `pnpm db:push` instead of `db:migrate` to sync the schema without running migration files.

### Reverting Migrations
Drizzle ORM does not generate down migrations by default. To revert, manually create SQL statements or restore from a database backup.

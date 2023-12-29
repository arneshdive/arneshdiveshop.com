# Checkout Flow: Cart to Payment

> Complete checkout flow with courier integration and seamless signup

## Overview

Implement end-to-end checkout flow:
1. **Cart** → Database-backed cart for both logged-in and guest users
2. **Checkout** → Contact info, address with map picker
3. **Courier Selection** → Real shipping rates from RajaOngkir API
4. **Payment** → Midtrans Snap integration
5. **Seamless Signup** → Auto-create account and login for guests

---

## Architecture

### User Flow

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌─────────────┐
│    Cart     │ ──► │   Checkout   │ ──► │ Select Courier │ ──► │   Payment   │
│ (DB cart)   │     │  (contact +  │     │ (RajaOngkir    │     │  (Midtrans) │
│             │     │   address)   │     │  rates)        │     │             │
└─────────────┘     └──────────────┘     └────────────────┘     └──────┬──────┘
                                                                       │
                                               ┌───────────────────────┘
                                               ▼
                                        ┌──────────────┐
                                        │   Redirect   │
                                        │  (logged in) │
                                        └──────────────┘
```

### Data Flow

```
Customer Address (city, province)
        │
        ▼
┌───────────────────┐
│ Match to          │
│ RajaOngkir City   │
│ (local cache)     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐     ┌───────────────────┐
│ Shop Origin       │     │ Customer          │
│ (city_id from     │     │ Destination       │
│ shopSettings)     │     │ (city_id match)   │
└────────┬──────────┘     └────────┬──────────┘
         │                         │
         └─────────┬───────────────┘
                   ▼
         ┌───────────────────┐
         │ RajaOngkir /cost  │
         │ API call          │
         └────────┬──────────┘
                  │
                  ▼
         ┌───────────────────┐
         │ Courier Options   │
         │ with real rates   │
         │ + ETAs            │
         └───────────────────┘
```

---

## Database Schema

### New Table: `rajaongkir_cities`

Cache RajaOngkir city data to avoid repeated API calls (100/day limit on Starter tier).

```typescript
// lib/db/schema.ts

export const rajaongkirCities = pgTable('rajaongkir_cities', {
  id: text('id').primaryKey(), // RajaOngkir city_id (numeric as string)
  name: text('name').notNull(),
  type: text('type').notNull(), // "Kabupaten" or "Kota"
  provinceId: text('province_id').notNull(),
  province: text('province').notNull(),
  postalCode: text('postal_code'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rajaongkirCitiesRelations = relations(rajaongkirCities, ({ one }) => ({
  province: one(rajaongkirProvinces, {
    fields: [rajaongkirCities.provinceId],
    references: [rajaongkirProvinces.id],
  }),
}));

export const rajaongkirProvinces = pgTable('rajaongkir_provinces', {
  id: text('id').primaryKey(), // RajaOngkir province_id
  name: text('name').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Schema Changes

#### `shopSettings` table

Add RajaOngkir city ID for shop origin:

```typescript
// Add to shopSettings table
rajaongkirCityId: text('rajaongkir_city_id'), // Cached when address updated
```

#### `checkoutSessions` table

Add RajaOngkir city ID for destination:

```typescript
// Add to checkoutSessions table
rajaongkirCityId: text('rajaongkir_city_id'), // Matched from customer address
```

---

## Components

### 1. RajaOngkir Client

```typescript
// lib/rajaongkir/client.ts

interface RajaOngkirConfig {
  apiKey: string;
  baseUrl: string; // 'https://api.rajaongkir.com/starter'
}

interface City {
  id: string;
  name: string;
  type: string;
  provinceId: string;
  province: string;
  postalCode: string;
}

interface CostResult {
  courier: string; // 'jne', 'pos', 'tiki'
  service: string; // 'REG', 'YES', 'ONS'
  name: string; // 'JNE Reguler', 'JNE YES'
  cost: number; // In Rupiah
  etd: string; // '1-2 hari'
}

async function getCities(): Promise<City[]>;
async function getProvinces(): Promise<Province[]>;
async function calculateCost(origin: string, destination: string, weight: number): Promise<CostResult[]>;
```

### 2. City Matcher

```typescript
// lib/rajaongkir/city-matcher.ts

interface AddressMatch {
  cityId: string;
  cityName: string;
  provinceId: string;
  confidence: 'exact' | 'fuzzy' | 'none';
}

/**
 * Match customer address to RajaOngkir city_id
 * Priority: exact match on city name + province → fuzzy match → return null
 */
async function matchCityToRajaOngkir(
  cityName: string,
  provinceName: string
): Promise<AddressMatch | null>;
```

### 3. Shipping Calculator

```typescript
// lib/shipping/calculator.ts

interface ShippingRate {
  courier: string;
  service: string;
  name: string;
  costCents: number; // Converted to cents
  etd: string;
  weight: number; // In grams
}

/**
 * Calculate shipping rates for checkout
 * 1. Get shop origin city_id from shopSettings
 * 2. Get/match customer destination city_id
 * 3. Calculate total package weight
 * 4. Call RajaOngkir /cost API
 * 5. Return sorted rates
 */
async function calculateShippingRates(
  destinationCityId: string,
  cartItems: CartItem[]
): Promise<ShippingRate[]>;
```

### 4. Seamless Signup

```typescript
// lib/auth/seamless-signup.ts

/**
 * Create user account from checkout data
 * - Create user with email from checkout
 * - Create customer record with name, phone
 * - Create session and set cookie (auto-login)
 */
async function createAccountFromCheckout(checkoutSession: CheckoutSession): Promise<{
  userId: string;
  customerId: string;
}>;
```

---

## API Endpoints

### POST `/api/shipping/calculate`

Calculate shipping rates for checkout session.

**Request:**
```json
{
  "checkoutSessionId": "uuid",
  "cityId": "optional - use if already matched"
}
```

**Response:**
```json
{
  "rates": [
    {
      "courier": "jne",
      "service": "REG",
      "name": "JNE Reguler",
      "costCents": 250000,
      "etd": "3-5 hari"
    },
    {
      "courier": "jne",
      "service": "YES",
      "name": "JNE YES",
      "costCents": 450000,
      "etd": "1-2 hari"
    }
  ],
  "destinationCityId": "42",
  "weight": 1500
}
```

### POST `/api/shipping/sync-cities`

Sync RajaOngkir cities to local cache (admin only).

**Response:**
```json
{
  "cities": 514,
  "provinces": 34,
  "syncedAt": "2024-07-13T10:00:00Z"
}
```

---

## Checkout Flow Implementation

### Step 1: Address Selection

When customer selects address via map picker:
1. Extract city and province from formatted address
2. Call `matchCityToRajaOngkir()` to find city_id
3. Save `rajaongkirCityId` to checkout session

### Step 2: Shipping Rate Calculation

When address is valid:
1. Call `POST /api/shipping/calculate` with checkout session ID
2. Display rates in `ShippingMethodSelector`
3. Customer selects preferred courier/service
4. Update checkout session with `shippingMethod` and `shippingCents`

### Step 3: Payment Creation

When customer clicks "Pay Now":
1. Validate checkout session
2. **For guest users:** Call `createAccountFromCheckout()` to create account and auto-login
3. Create order with order items
4. Create Midtrans Snap transaction
5. Return snap token to frontend

### Step 4: Payment Completion

After Midtrans payment:
1. Webhook updates order status to 'processing'
2. Customer redirected to success page
3. User is already logged in (seamless signup)

---

## File Structure

```
lib/
├── rajaongkir/
│   ├── client.ts           # RajaOngkir API client
│   ├── city-matcher.ts     # Match address to city_id
│   └── types.ts            # TypeScript types
├── shipping/
│   └── calculator.ts       # Shipping rate calculation
├── queries/
│   ├── rajaongkir-cities.ts  # DB queries for cached cities
│   └── checkout.ts         # Update: city_id handling
└── auth/
    └── seamless-signup.ts  # Account creation from checkout

app/api/
├── shipping/
│   ├── calculate/route.ts  # Shipping rates endpoint
│   └── sync-cities/route.ts # City sync endpoint (admin)
├── checkout/route.ts       # Update: integrate shipping
└── payments/create/route.ts # Update: seamless signup
```

---

## Environment Variables

```env
# RajaOngkir (Starter tier)
RAJAONGKIR_API_KEY="your-api-key"
RAJAONGKIR_BASE_URL="https://api.rajaongkir.com/starter"
```

---

## Weight Calculation

Products need weight for shipping calculation. Current schema doesn't have weight field.

**Solution:** Default weight of 500g per product, can be enhanced later with product-specific weights.

```typescript
// lib/shipping/calculator.ts
const DEFAULT_PRODUCT_WEIGHT_GRAMS = 500;

function calculateTotalWeight(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const weight = item.product.weightGrams ?? DEFAULT_PRODUCT_WEIGHT_GRAMS;
    return total + (weight * item.quantity);
  }, 0);
}
```

---

## Error Handling

### City Match Failure

If city cannot be matched:
1. Show message: "Mohon pilih alamat dari peta"
2. Customer must re-select address or manually enter city
3. Fallback: Show flat-rate shipping options

### RajaOngkir API Failure

If API is unavailable:
1. Use fallback flat-rate shipping:
   - Standard: Rp25.000
   - Express: Rp45.000
2. Log error for admin review
3. Continue checkout flow

---

## Testing Strategy

1. **Unit tests:**
   - `matchCityToRajaOngkir()` with various city/province inputs
   - Weight calculation
   - Price conversion (cents ↔ rupiah)

2. **Integration tests:**
   - Shipping calculation with mock RajaOngkir responses
   - Seamless signup flow
   - Checkout session creation with city_id

3. **Manual testing:**
   - RajaOngkir city sync
   - Live shipping calculation with real addresses
   - Guest checkout → account creation → login verification

---

## Success Criteria

- [ ] Guest checkout creates account and auto-logs in user
- [ ] Logged-in users see pre-filled contact info
- [ ] Shipping rates are accurate from RajaOngkir
- [ ] City matching works for Indonesian addresses
- [ ] No UI changes unless critical for functionality
- [ ] All existing tests pass

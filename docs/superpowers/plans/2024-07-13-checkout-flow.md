# Checkout Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete checkout flow with RajaOngkir courier integration and seamless guest signup.

**Architecture:** Database-backed cart → checkout session with city matching → RajaOngkir shipping rates → Midtrans payment → auto-create account for guests.

**Tech Stack:** Next.js 16, Drizzle ORM, RajaOngkir Starter API, Midtrans Snap, Zod

---

## File Structure

```
lib/
├── rajaongkir/
│   ├── types.ts            # TypeScript types for RajaOngkir
│   ├── client.ts           # RajaOngkir API client
│   └── city-matcher.ts     # Match address to city_id
├── shipping/
│   └── calculator.ts       # Shipping rate calculation
├── queries/
│   └── rajaongkir-cities.ts # DB queries for cached cities
└── auth/
    └── seamless-signup.ts  # Account creation from checkout

app/api/
├── shipping/
│   ├── calculate/route.ts  # Shipping rates endpoint
│   └── sync-cities/route.ts # City sync endpoint
├── checkout/route.ts       # Modify: integrate shipping
└── payments/create/route.ts # Modify: seamless signup

lib/db/
└── schema.ts               # Modify: add rajaongkir tables
```

---

## Task 1: Add Weight Field to Products Schema

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Add weightGrams field to products table**

```typescript
// Add inside products table definition (after isOnSale line, before deletedAt)
weightGrams: integer('weight_grams').default(500), // Product weight in grams, default 500g
```

- [ ] **Step 2: Push schema changes to database**

```bash
pnpm drizzle-kit push
```

Expected: Schema pushed successfully, no errors

- [ ] **Step 3: Commit schema changes**

```bash
git add lib/db/schema.ts
git commit -m "feat: add weight field to products for shipping calculation"
```

---

## Task 2: Add RajaOngkir Database Schema

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Add rajaongkir provinces and cities tables to schema**

```typescript
// Add after the paymentStatusEnum definition (around line 30)

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

// Add relations at the end of the relations section (before Type Exports)

export const rajaongkirCitiesRelations = relations(rajaongkirCities, ({ one }) => ({
  province: one(rajaongkirProvinces, {
    fields: [rajaongkirCities.provinceId],
    references: [rajaongkirProvinces.id],
  }),
}));

// Add type exports

export type RajaongkirProvince = typeof rajaongkirProvinces.$inferSelect;
export type NewRajaongkirProvince = typeof rajaongkirProvinces.$inferInsert;

export type RajaongkirCity = typeof rajaongkirCities.$inferSelect;
export type NewRajaongkirCity = typeof rajaongkirCities.$inferInsert;
```

- [ ] **Step 2: Add rajaongkirCityId to shopSettings table**

```typescript
// Add inside shopSettings table definition (after addressLng line)
rajaongkirCityId: text('rajaongkir_city_id'), // Cached when address updated
```

- [ ] **Step 3: Add rajaongkirCityId to checkoutSessions table**

```typescript
// Add inside checkoutSessions table definition (after formattedAddress line)
rajaongkirCityId: text('rajaongkir_city_id'), // Matched from customer address
```

- [ ] **Step 4: Push schema changes to database**

```bash
pnpm drizzle-kit push
```

Expected: Schema pushed successfully, no errors

- [ ] **Step 5: Commit schema changes**

```bash
git add lib/db/schema.ts
git commit -m "feat: add rajaongkir database tables for city caching"
```

---

## Task 3: Create RajaOngkir Types

**Files:**
- Create: `lib/rajaongkir/types.ts`

- [ ] **Step 1: Create types file**

```typescript
// lib/rajaongkir/types.ts

/**
 * RajaOngkir API Types
 * Starter tier supports: JNE, POS, TIKI
 */

export interface RajaongkirProvince {
  id: string;
  name: string;
}

export interface RajaongkirCity {
  id: string;
  name: string;
  type: string; // "Kabupaten" or "Kota"
  provinceId: string;
  province: string;
  postalCode: string;
}

export interface RajaongkirCostQuery {
  origin: string; // city_id
  destination: string; // city_id
  weight: number; // in grams
  courier: 'jne' | 'pos' | 'tiki';
}

export interface RajaongkirCostResult {
  code: string; // 'jne', 'pos', 'tiki'
  name: string; // 'Jalur Nugraha Ekakurir (JNE)'
  costs: RajaongkirServiceCost[];
}

export interface RajaongkirServiceCost {
  service: string; // 'REG', 'YES', 'ONS'
  description: string; // 'Layanan Reguler'
  cost: {
    value: number; // In Rupiah
    etd: string; // '1-2' (days)
    note: string;
  }[];
}

export interface ShippingRate {
  courier: string; // 'jne', 'pos', 'tiki'
  service: string; // 'REG', 'YES', etc.
  name: string; // 'JNE Reguler'
  description: string; // 'Layanan Reguler'
  costCents: number; // Converted to cents
  etd: string; // '1-2 hari'
}

export interface RajaongkirApiResponse<T> {
  rajaongkir: {
    status: {
      code: number;
      description: string;
    };
    results: T;
  };
}

export interface CityMatchResult {
  cityId: string;
  cityName: string;
  provinceId: string;
  provinceName: string;
  confidence: 'exact' | 'fuzzy' | 'none';
}
```

- [ ] **Step 2: Commit types**

```bash
git add lib/rajaongkir/types.ts
git commit -m "feat: add rajaongkir types"
```

---

## Task 4: Create RajaOngkir API Client

**Files:**
- Create: `lib/rajaongkir/client.ts`

- [ ] **Step 1: Create API client**

```typescript
// lib/rajaongkir/client.ts

import type {
  RajaongkirProvince,
  RajaongkirCity,
  RajaongkirCostQuery,
  RajaongkirCostResult,
  RajaongkirApiResponse,
} from './types';

const RAJAONGKIR_BASE_URL = process.env.RAJAONGKIR_BASE_URL || 'https://api.rajaongkir.com/starter';
const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;

if (!RAJAONGKIR_API_KEY) {
  console.warn('RAJAONGKIR_API_KEY is not set. Shipping calculation will use fallback rates.');
}

/**
 * RajaOngkir API Client (Starter tier)
 * Supports: JNE, POS, TIKI
 */
export const rajaongkirClient = {
  /**
   * Get all provinces
   * Endpoint: /province
   */
  async getProvinces(): Promise<RajaongkirProvince[]> {
    if (!RAJAONGKIR_API_KEY) {
      throw new Error('RAJAONGKIR_API_KEY is not configured');
    }

    const response = await fetch(`${RAJAONGKIR_BASE_URL}/province`, {
      headers: {
        key: RAJAONGKIR_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`RajaOngkir API error: ${response.status}`);
    }

    const data: RajaongkirApiResponse<RajaongkirProvince[]> = await response.json();
    
    if (data.rajaongkir.status.code !== 200) {
      throw new Error(`RajaOngkir error: ${data.rajaongkir.status.description}`);
    }

    return data.rajaongkir.results;
  },

  /**
   * Get all cities (optionally filtered by province)
   * Endpoint: /city
   */
  async getCities(provinceId?: string): Promise<RajaongkirCity[]> {
    if (!RAJAONGKIR_API_KEY) {
      throw new Error('RAJAONGKIR_API_KEY is not configured');
    }

    const url = provinceId 
      ? `${RAJAONGKIR_BASE_URL}/city?province=${provinceId}`
      : `${RAJAONGKIR_BASE_URL}/city`;

    const response = await fetch(url, {
      headers: {
        key: RAJAONGKIR_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`RajaOngkir API error: ${response.status}`);
    }

    const data: RajaongkirApiResponse<RajaongkirCity[]> = await response.json();
    
    if (data.rajaongkir.status.code !== 200) {
      throw new Error(`RajaOngkir error: ${data.rajaongkir.status.description}`);
    }

    return data.rajaongkir.results;
  },

  /**
   * Calculate shipping cost
   * Endpoint: /cost
   */
  async calculateCost(query: RajaongkirCostQuery): Promise<RajaongkirCostResult> {
    if (!RAJAONGKIR_API_KEY) {
      throw new Error('RAJAONGKIR_API_KEY is not configured');
    }

    const response = await fetch(`${RAJAONGKIR_BASE_URL}/cost`, {
      method: 'POST',
      headers: {
        key: RAJAONGKIR_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        origin: query.origin,
        destination: query.destination,
        weight: query.weight.toString(),
        courier: query.courier,
      }),
    });

    if (!response.ok) {
      throw new Error(`RajaOngkir API error: ${response.status}`);
    }

    const data: RajaongkirApiResponse<RajaongkirCostResult[]> = await response.json();
    
    if (data.rajaongkir.status.code !== 200) {
      throw new Error(`RajaOngkir error: ${data.rajaongkir.status.description}`);
    }

    return data.rajaongkir.results[0];
  },

  /**
   * Calculate costs for all available couriers
   */
  async calculateAllCouriers(
    origin: string,
    destination: string,
    weight: number
  ): Promise<RajaongkirCostResult[]> {
    const couriers: Array<'jne' | 'pos' | 'tiki'> = ['jne', 'pos', 'tiki'];
    
    const results = await Promise.all(
      couriers.map(courier => 
        this.calculateCost({ origin, destination, weight, courier })
          .catch(err => {
            console.error(`Failed to get ${courier} rates:`, err);
            return null;
          })
      )
    );

    return results.filter((r): r is RajaongkirCostResult => r !== null);
  },
};
```

- [ ] **Step 2: Add environment variables to .env.example**

```typescript
// Add to .env.example

# RajaOngkir API (Starter tier - JNE, POS, TIKI)
RAJAONGKIR_API_KEY="your-api-key-here"
RAJAONGKIR_BASE_URL="https://api.rajaongkir.com/starter"
```

- [ ] **Step 3: Commit client**

```bash
git add lib/rajaongkir/client.ts .env.example
git commit -m "feat: add rajaongkir api client"
```

---

## Task 5: Create City Matcher

**Files:**
- Create: `lib/rajaongkir/city-matcher.ts`

- [ ] **Step 1: Create city matcher**

```typescript
// lib/rajaongkir/city-matcher.ts

import { db } from '@/lib/db';
import { rajaongkirCities, rajaongkirProvinces } from '@/lib/db/schema';
import { sql, like, or, and, eq } from 'drizzle-orm';
import type { CityMatchResult } from './types';

/**
 * Normalize city name for matching
 * - Lowercase
 * - Remove "Kabupaten ", "Kota ", "Kab. ", "Kota "
 * - Remove special characters
 */
function normalizeCityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(kabupaten|kab\.?|kota)\s*/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Normalize province name for matching
 */
function normalizeProvinceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Match customer address to RajaOngkir city_id
 * Uses cached cities from database
 */
export async function matchCityToRajaOngkir(
  cityName: string,
  provinceName: string
): Promise<CityMatchResult | null> {
  const normalizedCity = normalizeCityName(cityName);
  const normalizedProvince = normalizeProvinceName(provinceName);

  // Try exact match first
  const exactMatch = await db.query.rajaongkirCities.findFirst({
    where: (cities, { and, or, eq }) => {
      const cityNormalized = sql`LOWER(REPLACE(REPLACE(REPLACE(${cities.name}, 'Kabupaten ', ''), 'Kota ', ''), 'Kab. ', ''))`;
      const provinceNormalized = sql`LOWER(REPLACE(${cities.province}, ' ', ''))`;
      
      return and(
        sql`${cityNormalized} LIKE ${'%' + normalizedCity + '%'}`,
        sql`${provinceNormalized} LIKE ${'%' + normalizedProvince + '%'}`
      );
    },
  });

  if (exactMatch) {
    return {
      cityId: exactMatch.id,
      cityName: exactMatch.name,
      provinceId: exactMatch.provinceId,
      provinceName: exactMatch.province,
      confidence: 'exact',
    };
  }

  // Try fuzzy match (city only, ignore province)
  const fuzzyMatch = await db.query.rajaongkirCities.findFirst({
    where: (cities) => {
      const cityNormalized = sql`LOWER(REPLACE(REPLACE(REPLACE(${cities.name}, 'Kabupaten ', ''), 'Kota ', ''), 'Kab. ', ''))`;
      return sql`${cityNormalized} LIKE ${'%' + normalizedCity + '%'}`;
    },
  });

  if (fuzzyMatch) {
    return {
      cityId: fuzzyMatch.id,
      cityName: fuzzyMatch.name,
      provinceId: fuzzyMatch.provinceId,
      provinceName: fuzzyMatch.province,
      confidence: 'fuzzy',
    };
  }

  return null;
}

/**
 * Get shop origin city_id from shopSettings
 * If not cached, try to match from address
 */
export async function getShopOriginCityId(): Promise<string | null> {
  // Import here to avoid circular dependency
  const { shopSettings } = await import('@/lib/db/schema');
  
  const settings = await db.query.shopSettings.findFirst();
  
  if (!settings) {
    console.error('Shop settings not found');
    return null;
  }

  // Return cached city_id if available
  if (settings.rajaongkirCityId) {
    return settings.rajaongkirCityId;
  }

  // Try to match from address if we have province/city info
  // For now, return null - admin should sync cities and set up address
  console.warn('Shop origin city_id not set. Please update shop settings with a valid address.');
  return null;
}
```

- [ ] **Step 2: Commit city matcher**

```bash
git add lib/rajaongkir/city-matcher.ts
git commit -m "feat: add city matcher for rajaongkir"
```

---

## Task 6: Create Shipping Calculator

**Files:**
- Create: `lib/shipping/calculator.ts`

- [ ] **Step 1: Create shipping calculator**

```typescript
// lib/shipping/calculator.ts

import { rajaongkirClient } from '@/lib/rajaongkir/client';
import { getShopOriginCityId } from '@/lib/rajaongkir/city-matcher';
import type { ShippingRate } from '@/lib/rajaongkir/types';

const DEFAULT_PRODUCT_WEIGHT_GRAMS = 500;

interface CartItemForShipping {
  quantity: number;
  product?: {
    weightGrams?: number | null;
  } | null;
}

/**
 * Calculate total package weight in grams
 * Uses product weight if set, otherwise defaults to 500g
 */
export function calculateTotalWeight(items: CartItemForShipping[]): number {
  return items.reduce((total, item) => {
    const weight = item.product?.weightGrams ?? DEFAULT_PRODUCT_WEIGHT_GRAMS;
    return total + (weight * item.quantity);
  }, 0);
}

/**
 * Convert Rupiah to cents
 */
function rupiahToCents(rupiah: number): number {
  return rupiah; // 1 Rupiah = 1 cent in our system
}

/**
 * Format ETD string
 */
function formatEtd(etd: string): string {
  if (!etd) return 'N/A';
  return `${etd} hari`;
}

/**
 * Get fallback shipping rates when RajaOngkir is unavailable
 */
export function getFallbackRates(): ShippingRate[] {
  return [
    {
      courier: 'jne',
      service: 'REG',
      name: 'JNE Reguler',
      description: 'Layanan Reguler',
      costCents: 250000, // Rp 25.000
      etd: '3-5 hari',
    },
    {
      courier: 'jne',
      service: 'YES',
      name: 'JNE YES',
      description: 'Yakin Esok Sampai',
      costCents: 450000, // Rp 45.000
      etd: '1-2 hari',
    },
  ];
}

/**
 * Calculate shipping rates from RajaOngkir
 */
export async function calculateShippingRates(
  destinationCityId: string,
  items: CartItemForShipping[]
): Promise<{ rates: ShippingRate[]; weight: number; error?: string }> {
  const weight = calculateTotalWeight(items);
  
  // Minimum weight for RajaOngkir is 1 gram
  const weightForApi = Math.max(weight, 1);

  // Get shop origin
  const originCityId = await getShopOriginCityId();
  
  if (!originCityId) {
    return {
      rates: getFallbackRates(),
      weight,
      error: 'Shop origin not configured. Using fallback rates.',
    };
  }

  try {
    const results = await rajaongkirClient.calculateAllCouriers(
      originCityId,
      destinationCityId,
      weightForApi
    );

    const rates: ShippingRate[] = [];

    for (const result of results) {
      for (const cost of result.costs) {
        const costValue = cost.cost[0];
        if (costValue) {
          rates.push({
            courier: result.code,
            service: cost.service,
            name: `${result.name} ${cost.service}`,
            description: cost.description,
            costCents: rupiahToCents(costValue.value),
            etd: formatEtd(costValue.etd),
          });
        }
      }
    }

    // Sort by cost (cheapest first)
    rates.sort((a, b) => a.costCents - b.costCents);

    return { rates, weight };
  } catch (error) {
    console.error('Failed to calculate shipping rates:', error);
    return {
      rates: getFallbackRates(),
      weight,
      error: error instanceof Error ? error.message : 'Failed to get shipping rates',
    };
  }
}
```

- [ ] **Step 2: Commit shipping calculator**

```bash
git add lib/shipping/calculator.ts
git commit -m "feat: add shipping calculator with rajaongkir integration"
```

---

## Task 7: Create RajaOngkir Database Queries

**Files:**
- Create: `lib/queries/rajaongkir-cities.ts`

- [ ] **Step 1: Create queries file**

```typescript
// lib/queries/rajaongkir-cities.ts

import { db } from '@/lib/db';
import { rajaongkirCities, rajaongkirProvinces } from '@/lib/db/schema';
import { rajaongkirClient } from '@/lib/rajaongkir/client';

/**
 * Sync all provinces from RajaOngkir API to database
 */
export async function syncProvinces(): Promise<number> {
  const provinces = await rajaongkirClient.getProvinces();
  
  // Clear existing
  await db.delete(rajaongkirProvinces);
  
  // Insert new
  await db.insert(rajaongkirProvinces).values(
    provinces.map(p => ({
      id: p.id,
      name: p.name,
    }))
  );

  return provinces.length;
}

/**
 * Sync all cities from RajaOngkir API to database
 */
export async function syncCities(): Promise<number> {
  const cities = await rajaongkirClient.getCities();
  
  // Clear existing
  await db.delete(rajaongkirCities);
  
  // Insert new
  await db.insert(rajaongkirCities).values(
    cities.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      provinceId: c.provinceId,
      province: c.province,
      postalCode: c.postalCode || null,
    }))
  );

  return cities.length;
}

/**
 * Sync all RajaOngkir data (provinces + cities)
 */
export async function syncAllRajaongkirData(): Promise<{
  provinces: number;
  cities: number;
}> {
  const provinces = await syncProvinces();
  const cities = await syncCities();
  
  return { provinces, cities };
}

/**
 * Get city by ID
 */
export async function getCityById(cityId: string) {
  return db.query.rajaongkirCities.findFirst({
    where: (cities, { eq }) => eq(cities.id, cityId),
  });
}

/**
 * Search cities by name
 */
export async function searchCities(query: string, limit = 10) {
  const searchPattern = `%${query.toLowerCase()}%`;
  
  return db.query.rajaongkirCities.findMany({
    where: (cities, { sql }) => sql`LOWER(${cities.name}) LIKE ${searchPattern}`,
    limit,
    with: {
      province: true,
    },
  });
}
```

- [ ] **Step 2: Commit queries**

```bash
git add lib/queries/rajaongkir-cities.ts
git commit -m "feat: add rajaongkir cities database queries"
```

---

## Task 8: Create Shipping Calculate API Endpoint

**Files:**
- Create: `app/api/shipping/calculate/route.ts`

- [ ] **Step 1: Create shipping calculate endpoint**

```typescript
// app/api/shipping/calculate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCheckoutSessionById } from '@/lib/queries/checkout';
import { calculateShippingRates } from '@/lib/shipping/calculator';
import { matchCityToRajaOngkir } from '@/lib/rajaongkir/city-matcher';
import { updateCheckoutSession } from '@/lib/queries/checkout';

const calculateSchema = z.object({
  checkoutSessionId: z.string().min(1, 'Checkout session ID required'),
  cityId: z.string().optional(), // Override: use if already matched
});

/**
 * POST /api/shipping/calculate
 * Calculate shipping rates for checkout session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = calculateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { checkoutSessionId, cityId } = result.data;

    // Get checkout session
    const session = await getCheckoutSessionById(checkoutSessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Checkout session not found' },
        { status: 404 }
      );
    }

    if (!session.cart || session.cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Get or match destination city_id
    let destinationCityId = cityId || session.rajaongkirCityId;

    if (!destinationCityId && session.city && session.province) {
      const match = await matchCityToRajaOngkir(session.city, session.province);
      if (match) {
        destinationCityId = match.cityId;
        // Cache the city_id in checkout session
        await updateCheckoutSession(checkoutSessionId, {
          rajaongkirCityId: destinationCityId,
        });
      }
    }

    if (!destinationCityId) {
      return NextResponse.json(
        { error: 'Could not determine destination city. Please verify your address.' },
        { status: 400 }
      );
    }

    // Calculate rates
    const { rates, weight, error } = await calculateShippingRates(
      destinationCityId,
      session.cart.items
    );

    return NextResponse.json({
      rates,
      destinationCityId,
      weight,
      error: error || null,
    });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping rates' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit endpoint**

```bash
git add app/api/shipping/calculate/route.ts
git commit -m "feat: add shipping calculate api endpoint"
```

---

## Task 9: Create City Sync API Endpoint

**Files:**
- Create: `app/api/shipping/sync-cities/route.ts`

- [ ] **Step 1: Create city sync endpoint**

```typescript
// app/api/shipping/sync-cities/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { syncAllRajaongkirData } from '@/lib/queries/rajaongkir-cities';

/**
 * POST /api/shipping/sync-cities
 * Sync RajaOngkir cities to local cache (admin only)
 */
export async function POST() {
  try {
    // Check admin access
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await syncAllRajaongkirData();

    return NextResponse.json({
      success: true,
      provinces: result.provinces,
      cities: result.cities,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error syncing cities:', error);
    return NextResponse.json(
      { error: 'Failed to sync cities' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit endpoint**

```bash
git add app/api/shipping/sync-cities/route.ts
git commit -m "feat: add city sync api endpoint for admin"
```

---

## Task 10: Create Seamless Signup Module

**Files:**
- Create: `lib/auth/seamless-signup.ts`

- [ ] **Step 1: Create seamless signup module**

```typescript
// lib/auth/seamless-signup.ts

import { db, users, customers } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';

interface CheckoutSessionForSignup {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  userId?: string | null;
}

/**
 * Create user account from checkout session
 * Called for guest users who don't have an account
 */
export async function createAccountFromCheckout(
  checkoutSession: CheckoutSessionForSignup
): Promise<{ userId: string; customerId: string; isNewUser: boolean }> {
  const { email, phone, fullName, userId: existingUserId } = checkoutSession;

  // If user already logged in, just return their IDs
  if (existingUserId) {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.userId, existingUserId),
    });
    
    if (customer) {
      return { userId: existingUserId, customerId: customer.id, isNewUser: false };
    }
  }

  // Check if user exists by email
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    // User exists, get their customer record
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, email),
    });

    if (customer) {
      // Log them in
      const token = await createSession({
        userId: existingUser.id,
        role: existingUser.role,
      });
      await setSessionCookie(token);

      return { userId: existingUser.id, customerId: customer.id, isNewUser: false };
    }
  }

  // Create new user with random password
  // They can reset password later or use magic link
  const randomPassword = randomBytes(32).toString('hex');
  const hashedPassword = await hash(randomPassword, 12);

  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') || '-';

  // Create user
  const [newUser] = await db.insert(users).values({
    email,
    name: fullName,
    password: hashedPassword,
    role: 'customer',
    emailVerified: new Date(), // Auto-verify from checkout
  }).returning();

  if (!newUser) {
    throw new Error('Failed to create user');
  }

  // Create customer
  const [newCustomer] = await db.insert(customers).values({
    userId: newUser.id,
    email,
    phone,
    firstName,
    lastName,
  }).returning();

  if (!newCustomer) {
    throw new Error('Failed to create customer');
  }

  // Create session and set cookie (auto-login)
  const token = await createSession({
    userId: newUser.id,
    role: newUser.role,
  });
  await setSessionCookie(token);

  return { userId: newUser.id, customerId: newCustomer.id, isNewUser: true };
}
```

- [ ] **Step 2: Commit seamless signup**

```bash
git add lib/auth/seamless-signup.ts
git commit -m "feat: add seamless signup from checkout"
```

---

## Task 11: Update Checkout Route for Shipping

**Files:**
- Modify: `lib/queries/checkout.ts`
- Modify: `app/api/checkout/route.ts`

- [ ] **Step 1: Add rajaongkirCityId to updateCheckoutSession**

First, check the current `updateCheckoutSession` function to see what fields it handles:

```bash
grep -A 20 "export async function updateCheckoutSession" lib/queries/checkout.ts
```

Then add rajaongkirCityId support. If the function uses a partial update pattern, it should already support it.

- [ ] **Step 2: Update checkout route to calculate and store rajaongkirCityId**

The checkout route already handles address creation. We need to add city matching after the address is saved.

Find the POST handler around where `createCheckoutSession` is called and add:

```typescript
// After checkout session is created (around line 130)
// Add city matching
import { matchCityToRajaOngkir } from '@/lib/rajaongkir/city-matcher';

// After creating the checkout session:
if (data.city && data.province) {
  const cityMatch = await matchCityToRajaOngkir(data.city, data.province);
  if (cityMatch) {
    await updateCheckoutSession(checkoutSession.id, {
      rajaongkirCityId: cityMatch.cityId,
    });
  }
}
```

- [ ] **Step 3: Commit checkout route changes**

```bash
git add lib/queries/checkout.ts app/api/checkout/route.ts
git commit -m "feat: integrate rajaongkir city matching in checkout"
```

---

## Task 12: Update Payment Creation for Seamless Signup

**Files:**
- Modify: `app/api/payments/create/route.ts`

- [ ] **Step 1: Add seamless signup to payment creation**

Add import at top:

```typescript
import { createAccountFromCheckout } from '@/lib/auth/seamless-signup';
```

Find where the customer is created/retrieved (around `createOrFindCustomer` function). Replace the logic to use seamless signup for guests:

```typescript
// Replace the createOrFindCustomer call with:
// Create/fetch user account for checkout
const { userId, customerId, isNewUser } = await createAccountFromCheckout({
  id: checkoutSessionId,
  email: session.email,
  phone: session.phone,
  fullName: session.fullName,
  userId: session.userId,
});
```

The seamless signup function handles:
- Creating user if doesn't exist
- Creating customer record
- Setting session cookie (auto-login)

- [ ] **Step 2: Commit payment changes**

```bash
git add app/api/payments/create/route.ts
git commit -m "feat: add seamless signup to payment creation"
```

---

## Task 13: Update ShippingMethodSelector Component

**Files:**
- Modify: `components/checkout/shipping-method-selector.tsx`

- [ ] **Step 1: Update component to fetch real rates**

The current component likely uses hardcoded rates. Update to call the shipping calculate API.

Key changes:
1. Add checkoutSessionId prop
2. Fetch rates from `/api/shipping/calculate` when component mounts or address changes
3. Handle loading/error states
4. Display rates from API response

This is a minimal change - keep the existing UI structure, just replace the data source.

Read the current component first:

```bash
cat components/checkout/shipping-method-selector.tsx
```

Then update to fetch from API instead of using static data.

- [ ] **Step 2: Test shipping rate display**

Run dev server and go through checkout to verify rates appear.

- [ ] **Step 3: Commit component changes**

```bash
git add components/checkout/shipping-method-selector.tsx
git commit -m "feat: integrate real shipping rates from rajaongkir"
```

---

## Task 13: Update ShippingMethodSelector Component

**Files:**
- Modify: `components/checkout/shipping-method-selector.tsx`

- [ ] **Step 1: Read current component to understand structure**

```bash
cat components/checkout/shipping-method-selector.tsx
```

- [ ] **Step 2: Add checkoutSessionId prop and fetch rates from API**

Update the component to:
1. Accept `checkoutSessionId` prop
2. Call `POST /api/shipping/calculate` when mounted
3. Display real rates instead of static options
4. Handle loading and error states

Keep existing UI structure - minimal changes.

- [ ] **Step 3: Commit component changes**

```bash
git add components/checkout/shipping-method-selector.tsx
git commit -m "feat: integrate real shipping rates from rajaongkir"
```

---

## Task 14: Wire Up Checkout Page

**Files:**
- Modify: `app/(store)/checkout/page.tsx`

- [ ] **Step 1: Pass checkoutSessionId to ShippingMethodSelector**

Find where `ShippingMethodSelector` is rendered and pass the session ID:

```tsx
<ShippingMethodSelector 
  checkoutSessionId={data.checkoutSessionId}
  // ... existing props
/>
```

- [ ] **Step 2: Commit checkout page changes**

```bash
git add app/(store)/checkout/page.tsx
git commit -m "feat: pass checkout session id to shipping selector"
```

---

## Task 15: End-to-End Testing

**Files:**
- None (manual testing)

- [ ] **Step 1: Sync RajaOngkir cities**

```bash
curl -X POST http://localhost:3000/api/shipping/sync-cities \
  -H "Cookie: session=<admin-session-cookie>"
```

Expected: `{"success":true,"provinces":34,"cities":514}`

- [ ] **Step 2: Test guest checkout flow**

1. Add item to cart
2. Go to checkout
3. Fill contact info and select address from map
4. Verify shipping rates appear
5. Select courier
6. Click "Pay Now"
7. Complete Midtrans payment (use test cards)
8. Verify redirect to success page
9. Verify user is logged in (check session)

- [ ] **Step 3: Test logged-in user checkout**

1. Log in as existing user
2. Add item to cart
3. Go to checkout
4. Verify contact info is pre-filled
5. Complete checkout
6. Verify order appears in account

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add weight field to products | schema.ts |
| 2 | Add RajaOngkir tables | schema.ts |
| 3 | Create types | rajaongkir/types.ts |
| 4 | Create API client | rajaongkir/client.ts |
| 5 | Create city matcher | rajaongkir/city-matcher.ts |
| 6 | Create shipping calculator | shipping/calculator.ts |
| 7 | Create DB queries | queries/rajaongkir-cities.ts |
| 8 | Create calculate endpoint | api/shipping/calculate/route.ts |
| 9 | Create sync endpoint | api/shipping/sync-cities/route.ts |
| 10 | Create seamless signup | auth/seamless-signup.ts |
| 11 | Update checkout route | api/checkout/route.ts |
| 12 | Update payment creation | api/payments/create/route.ts |
| 13 | Update shipping selector | shipping-method-selector.tsx |
| 14 | Wire up checkout page | checkout/page.tsx |
| 15 | End-to-end testing | Manual |
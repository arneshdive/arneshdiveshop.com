# Courier Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to toggle couriers on/off in settings, reducing API calls and showing only relevant shipping options at checkout.

**Architecture:** Add `activeCouriers` column to shop_settings, create getter function, modify shipping calculator to read active couriers, add toggle UI in admin settings.

**Tech Stack:** Drizzle ORM, Next.js API routes, React forms

---

## Task 1: Add Database Schema

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Add activeCouriers column**

Add the new column to `shopSettings` table after `rajaongkirCityName`:

```typescript
// In lib/db/schema.ts, inside shopSettings pgTable definition
// After rajaongkirCityName line, add:
  // Active couriers for shipping
  activeCouriers: text('active_couriers').default('jne,jnt,sicepat'),
```

- [ ] **Step 2: Generate migration**

```bash
npx drizzle-kit generate
```

- [ ] **Step 3: Run migration**

```bash
npx drizzle-kit push
```

- [ ] **Step 4: Commit schema change**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat: add activeCouriers column to shop_settings"
```

---

## Task 2: Create Get Active Couriers Helper

**Files:**
- Modify: `lib/queries/settings.ts` (or create if needed)

- [ ] **Step 1: Check if settings query file exists**

```bash
ls -la lib/queries/settings.ts
```

- [ ] **Step 2: Add getActiveCouriers function**

If `lib/queries/settings.ts` exists, add to it. If not, create it:

```typescript
// lib/queries/settings.ts

import { db } from '@/lib/db';
import { shopSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// All supported couriers
export const COURIERS = [
  { code: 'jne', name: 'JNE' },
  { code: 'jnt', name: 'J&T Express' },
  { code: 'sicepat', name: 'SiCepat' },
  { code: 'idexpress', name: 'ID Express' },
  { code: 'anteraja', name: 'AnterAja' },
  { code: 'pos', name: 'POS Indonesia' },
  { code: 'tiki', name: 'TIKI' },
] as const;

export type CourierCode = typeof COURIERS[number]['code'];

const DEFAULT_COURIERS: CourierCode[] = ['jne', 'jnt', 'sicepat'];

/**
 * Get active couriers from shop settings
 * Falls back to default if not configured
 */
export async function getActiveCouriers(): Promise<CourierCode[]> {
  const settings = await db.query.shopSettings.findFirst({
    where: eq(shopSettings.id, 'default'),
  });

  if (!settings?.activeCouriers) {
    return DEFAULT_COURIERS;
  }

  const couriers = settings.activeCouriers
    .split(',')
    .map(c => c.trim())
    .filter((c): c is CourierCode => 
      COURIERS.some(courier => courier.code === c)
    );

  return couriers.length > 0 ? couriers : DEFAULT_COURIERS;
}

/**
 * Validate courier codes
 */
export function validateCourierCodes(codes: string[]): {
  valid: boolean;
  error?: string;
  validCodes: CourierCode[];
} {
  if (!Array.isArray(codes) || codes.length === 0) {
    return { valid: false, error: 'Minimal 1 kurir harus aktif', validCodes: [] };
  }

  const validCodes = codes.filter((c): c is CourierCode =>
    COURIERS.some(courier => courier.code === c)
  );

  if (validCodes.length === 0) {
    return { valid: false, error: 'Minimal 1 kurir harus aktif', validCodes: [] };
  }

  return { valid: true, validCodes };
}
```

- [ ] **Step 3: Commit helper function**

```bash
git add lib/queries/settings.ts
git commit -m "feat: add getActiveCouriers helper"
```

---

## Task 3: Update Settings API

**Files:**
- Modify: `app/api/admin/settings/route.ts`

- [ ] **Step 1: Read current settings route**

```bash
head -100 app/api/admin/settings/route.ts
```

- [ ] **Step 2: Add activeCouriers to GET response**

In the GET handler, ensure `activeCouriers` is included in the response. Find the return statement and add the field if not present:

```typescript
// In GET handler, add activeCouriers to the response object
return NextResponse.json({
  // ... existing fields ...
  activeCouriers: settings.activeCouriers?.split(',').filter(Boolean) ?? [],
});
```

- [ ] **Step 3: Add activeCouriers to PUT handler**

In the PUT handler, add handling for `activeCouriers`:

```typescript
// At the top of the file, add import:
import { validateCourierCodes } from '@/lib/queries/settings';

// In the PUT handler body, extract activeCouriers:
const { activeCouriers, ...rest } = body;

// Validate if provided:
if (activeCouriers !== undefined) {
  const validation = validateCourierCodes(activeCouriers);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
}

// In the db.update call, add:
activeCouriers: activeCouriers ? activeCouriers.join(',') : settings.activeCouriers,
```

- [ ] **Step 4: Commit API changes**

```bash
git add app/api/admin/settings/route.ts
git commit -m "feat: handle activeCouriers in settings API"
```

---

## Task 4: Update Shipping Calculator

**Files:**
- Modify: `lib/shipping/calculator.ts`
- Modify: `lib/rajaongkir/client.ts`

- [ ] **Step 1: Modify rajaongkir client to accept couriers parameter**

Update `calculateAllCouriers` in `lib/rajaongkir/client.ts`:

```typescript
// Change the function signature to accept couriers array
async calculateAllCouriers(
  origin: string,
  destination: string,
  weight: number,
  couriers: string[] = ['jne', 'jnt', 'sicepat', 'idexpress', 'anteraja', 'pos', 'tiki']
): Promise<RajaongkirCostResult[]> {
  // Remove the hardcoded couriers line, use the parameter instead
  // const couriers = ['jne', 'jnt', 'sicepat', 'idexpress', 'anteraja', 'pos', 'tiki'];
  // (delete this line, now passed as parameter)
  
  const results = await Promise.all(
    couriers.map(courier => 
      this.calculateCost({ origin, destination, weight, courier: courier as 'jne' | 'pos' | 'tiki' })
        .catch(err => {
          console.error(`Failed to get ${courier} rates:`, err);
          return null;
        })
    )
  );

  return results.filter((r): r is RajaongkirCostResult => r !== null);
},
```

- [ ] **Step 2: Update shipping calculator to use active couriers**

Update `lib/shipping/calculator.ts`:

```typescript
// Add import at the top:
import { getActiveCouriers } from '@/lib/queries/settings';

// Update calculateShippingRates function:
export async function calculateShippingRates(
  destinationCityId: string,
  items: CartItemForShipping[]
): Promise<{ rates: ShippingRate[]; weight: number; error?: string }> {
  const weight = calculateTotalWeight(items);
  const weightForApi = Math.max(weight, 1);

  const originCityId = await getShopOriginCityId();

  if (!originCityId) {
    return {
      rates: [],
      weight,
      error: 'Alamat toko belum dikonfigurasi. Silakan hubungi admin.',
    };
  }

  // Get active couriers from settings
  const activeCouriers = await getActiveCouriers();

  try {
    const results = await rajaongkirClient.calculateAllCouriers(
      originCityId,
      destinationCityId,
      weightForApi,
      activeCouriers  // Pass active couriers
    );
    
    // ... rest of function unchanged ...
```

- [ ] **Step 3: Commit shipping calculator changes**

```bash
git add lib/rajaongkir/client.ts lib/shipping/calculator.ts
git commit -m "feat: use active couriers from settings in shipping calculator"
```

---

## Task 5: Add Courier Toggle UI

**Files:**
- Modify: `app/admin/settings/page.tsx`

- [ ] **Step 1: Add activeCouriers to state**

Update the `ShopSettingsData` interface and initial state:

```typescript
interface ShopSettingsData {
  storeName: string;
  email: string;
  phone: string;
  whatsapp: string;
  businessHours: string;
  about: string;
  rajaongkirCityId: string | null;
  rajaongkirCityName: string | null;
  instagram: string | null;
  tiktok: string | null;
  activeCouriers: string[];  // Add this
}

// In the useState initial value:
const [settings, setSettings] = useState<ShopSettingsData>({
  // ... existing fields ...
  activeCouriers: ['jne', 'jnt', 'sicepat'],  // Add default
});
```

- [ ] **Step 2: Add courier toggle handler**

Add the constants and handler inside the component:

```typescript
// Inside the component, before the useEffect
const AVAILABLE_COURIERS = [
  { code: 'jne', name: 'JNE' },
  { code: 'jnt', name: 'J&T Express' },
  { code: 'sicepat', name: 'SiCepat' },
  { code: 'idexpress', name: 'ID Express' },
  { code: 'anteraja', name: 'AnterAja' },
  { code: 'pos', name: 'POS Indonesia' },
  { code: 'tiki', name: 'TIKI' },
] as const;

const toggleCourier = (code: string) => {
  setSettings(prev => {
    const isActive = prev.activeCouriers.includes(code);
    
    // Prevent unchecking the last courier
    if (isActive && prev.activeCouriers.length === 1) {
      toast.error('Minimal 1 kurir harus aktif');
      return prev;
    }
    
    return {
      ...prev,
      activeCouriers: isActive
        ? prev.activeCouriers.filter(c => c !== code)
        : [...prev.activeCouriers, code],
    };
  });
};
```

- [ ] **Step 3: Update fetchSettings to load activeCouriers**

Find the `fetchSettings` function in useEffect and update:

```typescript
// In the fetchSettings useEffect, update setSettings:
setSettings({
  storeName: data.storeName || '',
  email: data.email || '',
  phone: data.phone || '',
  whatsapp: data.whatsapp || '',
  businessHours: data.businessHours || '',
  about: data.about || '',
  rajaongkirCityId: data.rajaongkirCityId || null,
  rajaongkirCityName: data.rajaongkirCityName || null,
  instagram: data.instagram || '',
  tiktok: data.tiktok || '',
  activeCouriers: data.activeCouriers || ['jne', 'jnt', 'sicepat'],  // Add this
});
```

- [ ] **Step 4: Add courier toggle UI section**

Add the new section after the "Lokasi Pengiriman" section (after the closing `</div>` of that section):

```tsx
{/* Active Couriers */}
<div className="bg-white rounded-xl p-6 space-y-4">
  <h2 className="text-base font-medium tracking-tight text-neutral-900">Kurir Pengiriman</h2>
  <p className="text-sm text-neutral-500">
    Pilih kurir yang tersedia untuk pelanggan
  </p>

  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {AVAILABLE_COURIERS.map((courier) => {
      const isActive = settings.activeCouriers.includes(courier.code);
      return (
        <label
          key={courier.code}
          className={`
            flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
            ${isActive 
              ? 'border-neutral-900 bg-neutral-50' 
              : 'border-neutral-200 hover:border-neutral-300'}
          `}
        >
          <input
            type="checkbox"
            checked={isActive}
            onChange={() => toggleCourier(courier.code)}
            className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
          />
          <span className={`text-sm font-medium ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`}>
            {courier.name}
          </span>
        </label>
      );
    })}
  </div>

  <p className="text-xs text-neutral-400">
    💡 Minimal 1 kurir harus aktif
  </p>
</div>
```

- [ ] **Step 5: Commit UI changes**

```bash
git add app/admin/settings/page.tsx
git commit -m "feat: add courier toggle UI to admin settings"
```

---

## Task 6: Manual Testing

**Files:**
- None (manual verification)

- [ ] **Step 1: Start development server**

```bash
npm run dev
```

- [ ] **Step 2: Test courier toggle in admin settings**

1. Navigate to http://localhost:3000/admin/settings
2. Verify "Kurir Pengiriman" section appears
3. Toggle couriers on/off
4. Verify you cannot uncheck the last active courier
5. Save settings
6. Refresh page and verify settings persisted

- [ ] **Step 3: Test checkout shipping rates**

1. Add items to cart
2. Go to checkout
3. Enter shipping address
4. Verify only active couriers appear in shipping options
5. Change active couriers in admin
6. Re-calculate shipping and verify updated options

- [ ] **Step 4: Verify API call reduction**

1. Open browser dev tools Network tab
2. Calculate shipping at checkout
3. Count number of calls to `rajaongkir.komerce.id/api/v1/calculate/domestic-cost`
4. Should match number of active couriers (not always 7)

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add `activeCouriers` column to database schema |
| 2 | Create `getActiveCouriers` helper function |
| 3 | Update settings API to handle `activeCouriers` |
| 4 | Update shipping calculator to use active couriers |
| 5 | Add courier toggle UI to admin settings |
| 6 | Manual testing |

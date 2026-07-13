# Checkout Contact/Address Prefill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Logged-in users skip contact-info fields entirely at checkout and pick (or create) a shipping address from their saved address book instead of retyping it every order; guest checkout is untouched.

**Architecture:** `app/(store)/checkout/page.tsx` detects login state with a plain `fetch` to `GET /api/account/profile` (mirroring the existing raw-fetch pattern already used by `ShippingMethodSelector` in the same directory — no React Query provider exists on this route and none is being added for this feature). On success it sets `checkoutStore.data.email` from the profile and swaps `<ContactForm />` + `<ShippingAddressForm />` for a new `<SavedAddressSelector />`. That component fetches `GET /api/addresses`, renders each as a selectable card, and on selection maps the address onto the same `CheckoutData` fields `ShippingAddressForm` already writes — so `ShippingMethodSelector`, checkout-session creation, and order creation require zero changes. Adding a new address reuses the existing `AddressForm` component and `POST /api/addresses` route verbatim.

**Tech Stack:** Next.js App Router (client components), Zustand (`useCheckoutStore`), Vitest (`environment: 'node'`, no jsdom configured — component behavior is verified manually via `pnpm dev`, not automated).

## Global Constraints

- No backend/schema changes: `/api/checkout`, `/api/payments/create`, `orders`, `checkoutSessions`, `addresses` tables are all out of scope (per spec).
- Guest checkout path must render byte-for-byte identical to today — no visual or behavioral change.
- All new UI copy is Bahasa Indonesia, matching the rest of checkout (see existing strings in `contact-form.tsx` / `shipping-address-form.tsx` for tone).
- Any profile-fetch failure (network error or non-200 other than a clean "not logged in") must fail open to the guest form — checkout must never be blocked by this feature.
- Reuse existing components (`AddressForm`) rather than duplicating their fields/validation.

---

### Task 1: Pure address→checkout-fields mapping function

**Files:**
- Create: `lib/checkout/map-address-to-checkout-fields.ts`
- Test: `lib/checkout/map-address-to-checkout-fields.test.ts`

**Interfaces:**
- Consumes: nothing (pure function, no dependencies on other tasks)
- Produces: `mapAddressToCheckoutFields(address: AddressForMapping): CheckoutFieldsFromAddress` — used by Task 3 (`SavedAddressSelector`) to turn a selected/created address into the fields `useCheckoutStore().setData(...)` expects. `CheckoutFieldsFromAddress` keys (`fullName`, `phone`, `address1`, `address2`, `rajaongkirCityId`, `rajaongkirCityName`, `rajaongkirProvince`, `rajaongkirCity`, `rajaongkirDistrict`, `rajaongkirSubdistrict`, `rajaongkirPostalCode`) are a subset of `CheckoutData` in `lib/store/checkout.ts` and share its exact value types.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/checkout/map-address-to-checkout-fields.test.ts
import { describe, it, expect } from 'vitest';
import { mapAddressToCheckoutFields } from './map-address-to-checkout-fields';

describe('mapAddressToCheckoutFields', () => {
  it('combines first and last name into fullName and passes through address/destination fields', () => {
    const result = mapAddressToCheckoutFields({
      firstName: 'Budi',
      lastName: 'Santoso',
      phone: '081234567890',
      address1: 'Jl. Merdeka No. 1',
      address2: 'Dekat masjid',
      rajaongkirCityId: '501',
      rajaongkirCityName: 'Sanur, Denpasar Selatan, Denpasar, Bali',
      rajaongkirProvince: 'Bali',
      rajaongkirCity: 'Denpasar',
      rajaongkirDistrict: 'Denpasar Selatan',
      rajaongkirSubdistrict: 'Sanur',
      rajaongkirPostalCode: '80227',
    });

    expect(result).toEqual({
      fullName: 'Budi Santoso',
      phone: '081234567890',
      address1: 'Jl. Merdeka No. 1',
      address2: 'Dekat masjid',
      rajaongkirCityId: '501',
      rajaongkirCityName: 'Sanur, Denpasar Selatan, Denpasar, Bali',
      rajaongkirProvince: 'Bali',
      rajaongkirCity: 'Denpasar',
      rajaongkirDistrict: 'Denpasar Selatan',
      rajaongkirSubdistrict: 'Sanur',
      rajaongkirPostalCode: '80227',
    });
  });

  it('falls back to empty strings for null phone and address2, and trims a missing last name', () => {
    const result = mapAddressToCheckoutFields({
      firstName: 'Ani',
      lastName: '',
      phone: null,
      address1: 'Jl. Sudirman No. 2',
      address2: null,
      rajaongkirCityId: '502',
      rajaongkirCityName: null,
      rajaongkirProvince: null,
      rajaongkirCity: null,
      rajaongkirDistrict: null,
      rajaongkirSubdistrict: null,
      rajaongkirPostalCode: null,
    });

    expect(result.fullName).toBe('Ani');
    expect(result.phone).toBe('');
    expect(result.address2).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run lib/checkout/map-address-to-checkout-fields.test.ts`
Expected: FAIL — `Cannot find module './map-address-to-checkout-fields'` (or similar resolution error), since the implementation file doesn't exist yet.

- [ ] **Step 3: Write the implementation**

```typescript
// lib/checkout/map-address-to-checkout-fields.ts

export interface AddressForMapping {
  firstName: string;
  lastName: string;
  phone: string | null;
  address1: string;
  address2: string | null;
  rajaongkirCityId: string;
  rajaongkirCityName: string | null;
  rajaongkirProvince: string | null;
  rajaongkirCity: string | null;
  rajaongkirDistrict: string | null;
  rajaongkirSubdistrict: string | null;
  rajaongkirPostalCode: string | null;
}

export interface CheckoutFieldsFromAddress {
  fullName: string;
  phone: string;
  address1: string;
  address2: string;
  rajaongkirCityId: string;
  rajaongkirCityName: string | null;
  rajaongkirProvince: string | null;
  rajaongkirCity: string | null;
  rajaongkirDistrict: string | null;
  rajaongkirSubdistrict: string | null;
  rajaongkirPostalCode: string | null;
}

/**
 * Maps a saved address (or a freshly created one) onto the CheckoutData
 * fields that ShippingAddressForm already populates, so the rest of the
 * checkout flow (rate calculation, session creation, order creation)
 * doesn't need to know whether the data came from typing or from picking
 * a saved address.
 */
export function mapAddressToCheckoutFields(address: AddressForMapping): CheckoutFieldsFromAddress {
  return {
    fullName: `${address.firstName} ${address.lastName}`.trim(),
    phone: address.phone ?? '',
    address1: address.address1,
    address2: address.address2 ?? '',
    rajaongkirCityId: address.rajaongkirCityId,
    rajaongkirCityName: address.rajaongkirCityName,
    rajaongkirProvince: address.rajaongkirProvince,
    rajaongkirCity: address.rajaongkirCity,
    rajaongkirDistrict: address.rajaongkirDistrict,
    rajaongkirSubdistrict: address.rajaongkirSubdistrict,
    rajaongkirPostalCode: address.rajaongkirPostalCode,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run lib/checkout/map-address-to-checkout-fields.test.ts`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add lib/checkout/map-address-to-checkout-fields.ts lib/checkout/map-address-to-checkout-fields.test.ts
git commit -m "feat: add pure mapper from saved address to checkout fields"
```

---

### Task 2: `SavedAddressSelector` component

**Files:**
- Create: `components/checkout/saved-address-selector.tsx`

**Interfaces:**
- Consumes: `mapAddressToCheckoutFields` from Task 1 (`lib/checkout/map-address-to-checkout-fields.ts`); `useCheckoutStore` from `lib/store/checkout.ts` (existing — `data.rajaongkirCityId` etc., `setData`); `AddressForm` from `components/account/address-form.tsx` (existing, unmodified — props `{ initialData?: Address | null; onSave: (data: Partial<Address>) => void; onCancel: () => void }`); `GET /api/addresses` → `{ addresses: Address[] }`; `POST /api/addresses` → `{ address: Address }` (201) or `{ error: string }` (400/401/500).
- Produces: `<SavedAddressSelector />` — a self-contained client component with no props, rendered by Task 4 in place of `<ContactForm />` + `<ShippingAddressForm />` for logged-in users.

- [ ] **Step 1: Write the component**

```typescript
// components/checkout/saved-address-selector.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils/cn';
import { useCheckoutStore } from '@/lib/store/checkout';
import { AddressForm } from '@/components/account/address-form';
import { mapAddressToCheckoutFields } from '@/lib/checkout/map-address-to-checkout-fields';

interface Address {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address1: string;
  address2: string | null;
  rajaongkirCityId: string;
  rajaongkirCityName: string | null;
  rajaongkirProvince: string | null;
  rajaongkirCity: string | null;
  rajaongkirDistrict: string | null;
  rajaongkirSubdistrict: string | null;
  rajaongkirPostalCode: string | null;
  isDefault: boolean;
}

export function SavedAddressSelector() {
  const { setData } = useCheckoutStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectAddress = useCallback((address: Address) => {
    setSelectedId(address.id);
    setData(mapAddressToCheckoutFields(address));
  }, [setData]);

  // Load saved addresses on mount
  useEffect(() => {
    let isCancelled = false;

    async function loadAddresses() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/addresses');
        if (!response.ok) throw new Error('Gagal memuat alamat tersimpan');

        const result = await response.json();
        const fetchedAddresses: Address[] = result.addresses || [];

        if (isCancelled) return;

        setAddresses(fetchedAddresses);

        if (fetchedAddresses.length === 0) {
          setIsAddingNew(true);
        } else {
          const defaultAddress = fetchedAddresses.find((a) => a.isDefault) ?? fetchedAddresses[0]!;
          selectAddress(defaultAddress);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat alamat tersimpan');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadAddresses();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveNewAddress = async (addressData: Partial<Address>) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Gagal menyimpan alamat');
      }

      const result = await response.json();
      const newAddress: Address = result.address;

      setAddresses((prev) => [newAddress, ...prev]);
      selectAddress(newAddress);
      setIsAddingNew(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan alamat');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pb-8 mb-8 border-b border-neutral-200">
        <h2 className="text-lg font-semibold tracking-tight mb-6">Alamat Pengiriman</h2>
        <div className="flex items-center gap-2 text-neutral-500 text-sm py-4">
          <Icon icon="solar:spinner-linear" className="w-5 h-5 animate-spin" />
          Memuat alamat tersimpan...
        </div>
      </div>
    );
  }

  if (isAddingNew) {
    return (
      <div className="pb-8 mb-8 border-b border-neutral-200">
        <h2 className="text-lg font-semibold tracking-tight mb-6">Alamat Pengiriman</h2>
        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}
        <AddressForm
          onSave={handleSaveNewAddress}
          onCancel={() => setIsAddingNew(false)}
        />
        {isSaving && (
          <p className="text-sm text-neutral-500 mt-3">Menyimpan alamat...</p>
        )}
      </div>
    );
  }

  return (
    <div className="pb-8 mb-8 border-b border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Alamat Pengiriman</h2>
        <button
          type="button"
          onClick={() => setIsAddingNew(true)}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors inline-flex items-center gap-1.5"
        >
          <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
          Tambah Alamat Baru
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="space-y-3">
        {addresses.map((address) => {
          const isSelected = selectedId === address.id;
          const locationParts = [
            address.rajaongkirSubdistrict,
            address.rajaongkirDistrict,
            address.rajaongkirCity,
          ].filter(Boolean);
          const location = locationParts.length > 0
            ? locationParts.join(', ')
            : address.rajaongkirCityName || '';

          return (
            <label
              key={address.id}
              className={cn(
                'flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors',
                isSelected ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'
              )}
            >
              <input
                type="radio"
                name="savedAddress"
                checked={isSelected}
                onChange={() => selectAddress(address)}
                className="sr-only"
              />
              <div
                className={cn(
                  'mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                  isSelected ? 'border-neutral-900' : 'border-neutral-300'
                )}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-neutral-900" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    {address.name}
                  </span>
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                      <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
                      Utama
                    </span>
                  )}
                </div>
                <p className="font-medium text-sm">{address.firstName} {address.lastName}</p>
                <p className="text-sm text-neutral-500">{address.phone}</p>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {address.address1}
                  {address.address2 && <>, {address.address2}</>}
                  <br />
                  {location}
                  {address.rajaongkirPostalCode && <> {address.rajaongkirPostalCode}</>}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
```

`onCancel` always goes back to the list view; when there are zero addresses the list view is simply empty aside from the "Tambah Alamat Baru" button, which is an acceptable, honest state — not worth special-casing.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p tsconfig.json`
Expected: no errors referencing `saved-address-selector.tsx`.

- [ ] **Step 3: Lint**

Run: `pnpm exec eslint components/checkout/saved-address-selector.tsx`
Expected: no new errors (a `react-hooks/exhaustive-deps` warning suppressed by the inline comment on the mount effect is expected and intentional — `selectAddress` is stable across renders only in identity via `useCallback([setData])`, but running it on every dep change would refetch-loop; same pattern already exists in `shipping-method-selector.tsx`).

- [ ] **Step 4: Commit**

```bash
git add components/checkout/saved-address-selector.tsx
git commit -m "feat: add saved address selector for logged-in checkout"
```

---

### Task 3: Wire login detection + conditional rendering into the checkout page

**Files:**
- Modify: `app/(store)/checkout/page.tsx`

**Interfaces:**
- Consumes: `SavedAddressSelector` from Task 2; `GET /api/account/profile` → `{ profile: { email: string; firstName: string | null; lastName: string | null; phone: string | null } }` (200) or `{ error: string }` (401); existing `ContactForm`, `ShippingAddressForm`, `useCheckoutStore().setField`.
- Produces: nothing consumed elsewhere — this is the top-level page.

- [ ] **Step 1: Add the profile-detection state and effect**

In `app/(store)/checkout/page.tsx`, add to the imports:

```typescript
import { SavedAddressSelector } from '@/components/checkout/saved-address-selector';
```

Add a type and state near the top of the `CheckoutPage` component body, right after the existing `useState` declarations (`isSubmitting`, `isCreatingSession`):

```typescript
  type CheckoutViewer = 'loading' | 'guest' | 'logged-in';
  const [viewer, setViewer] = useState<CheckoutViewer>('loading');
```

Add an effect (place it near the other `useEffect`s, before the "Auto-create session" effect):

```typescript
  // Detect login state once on mount. Any failure (network error, 401,
  // 500) fails open to the guest view — checkout must never be blocked
  // by this check.
  useEffect(() => {
    let isCancelled = false;

    async function detectViewer() {
      try {
        const response = await fetch('/api/account/profile');
        if (!response.ok) {
          if (!isCancelled) setViewer('guest');
          return;
        }

        const result = await response.json();
        if (isCancelled) return;

        setField('email', result.profile.email);
        setViewer('logged-in');
      } catch {
        if (!isCancelled) setViewer('guest');
      }
    }

    detectViewer();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 2: Swap the rendered forms based on viewer state**

Find this block in the JSX (inside the `flex-1` column):

```typescript
              <ContactForm />
              <ShippingAddressForm />
              <ShippingMethodSelector checkoutSessionId={data.checkoutSessionId} />
```

Replace it with:

```typescript
              {viewer === 'logged-in' ? (
                <SavedAddressSelector />
              ) : (
                <>
                  <ContactForm />
                  <ShippingAddressForm />
                </>
              )}
              <ShippingMethodSelector checkoutSessionId={data.checkoutSessionId} />
```

(While `viewer === 'loading'`, this renders the guest forms — same as `'guest'`. That's intentional: the profile check is a single fast local-network fetch, so any flicker window is minimal, and defaulting to the always-safe guest form means there's never a moment where checkout shows nothing or is blocked. If the check later resolves to `'logged-in'`, the swap happens; if the user had already started typing into the guest fields in that brief window, `SavedAddressSelector`'s own `setData` call on mount will overwrite `fullName`/`phone`/`address*` — an acceptable tradeoff given the check typically resolves in well under a second and this is a local dev/production API call, not a third-party round trip.)

- [ ] **Step 3: Update `validateForm` — no change needed, verify why**

`validateForm` (existing, unmodified) checks `data.email`, `data.phone`, `data.fullName`, `data.rajaongkirCityId`, `data.address1` — all of which `SavedAddressSelector` populates via `setData`/the profile effect's `setField('email', ...)`, and all of which `ContactForm`/`ShippingAddressForm` populate for guests. No change is needed here; this step is just confirming that during a manual test.

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 5: Lint**

Run: `pnpm exec eslint "app/(store)/checkout/page.tsx"`
Expected: no new errors (the same `react-hooks/exhaustive-deps` suppression pattern as Task 2's effect is expected and intentional — this effect must only run once on mount).

- [ ] **Step 6: Commit**

```bash
git add "app/(store)/checkout/page.tsx"
git commit -m "feat: skip contact form and offer saved addresses for logged-in checkout"
```

---

### Task 4: Manual end-to-end verification

No test framework covers rendered UI in this repo (`vitest.config.ts` runs in `environment: 'node'`, no jsdom/`@testing-library/react` wiring exists for any component today) — this task is a manual pass through `pnpm dev`, not an automated test. Do not skip it; it is the only verification the UI actually works.

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`

- [ ] **Step 2: Guest path is unchanged**

In an incognito/private browser window (no session cookie), add an item to cart and go to `/checkout`. Confirm: `ContactForm` (email/phone) and `ShippingAddressForm` (name/destination/address) render exactly as before — same fields, same layout, no `SavedAddressSelector` visible.

- [ ] **Step 3: Logged-in, zero saved addresses**

Log in as a customer account with no entries under Account → Addresses (or delete them all there first). Go to `/checkout` with items in cart. Confirm: no `ContactForm` is shown; `SavedAddressSelector` immediately shows the `AddressForm` (add-new state, no picker); email is not visible/editable anywhere on the page.

- [ ] **Step 4: Logged-in, one or more saved addresses**

Add 2 addresses to that account under Account → Addresses (mark one as default). Go to `/checkout`. Confirm: the default address is pre-selected on load, both addresses render as selectable cards, clicking the non-default one switches selection, and the shipping-rate selector (`ShippingMethodSelector`) recalculates rates for whichever address is currently selected (since it reads `data.rajaongkirCityId`, which `SavedAddressSelector` updates on selection).

- [ ] **Step 5: Add a new address mid-checkout**

From the state in Step 4, click "Tambah Alamat Baru", fill in the form, save. Confirm: the new address appears selected immediately (no page reload), and it now also shows up under Account → Addresses afterward (confirming it persisted via the shared `POST /api/addresses`).

- [ ] **Step 6: Complete an order as a logged-in user**

Using a selected saved address, proceed through shipping method selection and submit the order (through to the Midtrans redirect). Confirm: the resulting order's shipping address (visible at `/account/orders/[id]` and in the admin order detail) matches the selected saved address's recipient name/phone/address, not the account owner's own profile phone (if they differ) — this confirms the "selected address's phone, not the account phone" judgment call from the spec.

- [ ] **Step 7: Fail-open check**

Temporarily rename `app/api/account/profile/route.ts`'s export (e.g. comment out `GET`) or block the `/api/account/profile` request in browser devtools' network tab, then reload `/checkout` while logged in. Confirm: checkout falls back to the guest `ContactForm` + `ShippingAddressForm` instead of hanging or erroring. Revert the temporary change afterward.

# Courier Activation Feature

**Date:** 2026-07-13
**Status:** Draft

## Problem

Currently, the system calls all 7 couriers (jne, jnt, sicepat, idexpress, anteraja, pos, tiki) for every shipping rate calculation. This results in 7 API calls per checkout, even if some couriers aren't needed. Admins should be able to choose which couriers to offer.

## Solution

Add courier activation controls to `/admin/settings` allowing admins to toggle individual couriers on/off. Require at least one active courier to prevent "no shipping" scenarios.

## Data Model

### Schema Change

Add `activeCouriers` column to `shop_settings` table:

```typescript
// lib/db/schema.ts
activeCouriers: text('active_couriers').default('jne,jnt,sicepat'),
```

**Format:** Comma-separated courier codes (e.g., `'jne,jnt,sicepat'`)

**Default:** `'jne,jnt,sicepat'` — the 3 most common couriers for Indonesian e-commerce.

### Available Couriers

| Code | Display Name |
|------|-------------|
| jne | JNE |
| jnt | J&T Express |
| sicepat | SiCepat |
| idexpress | ID Express |
| anteraja | AnterAja |
| pos | POS Indonesia |
| tiki | TIKI |

## UI Design

### Location

New section "Kurir Pengiriman" in `/admin/settings`, positioned below "Lokasi Pengiriman".

### Components

```
┌─────────────────────────────────────────────┐
│ Kurir Pengiriman                            │
│                                             │
│ Pilih kurir yang tersedia untuk pelanggan   │
│                                             │
│ ☑ JNE            ☑ J&T Express             │
│ ☑ SiCepat        ☐ ID Express              │
│ ☐ AnterAja       ☐ POS Indonesia           │
│ ☐ TIKI                                      │
│                                             │
│ 💡 Minimal 1 kurir harus aktif              │
└─────────────────────────────────────────────┘
```

### Interactions

1. **Toggle courier:** Click checkbox to enable/disable
2. **Prevent last uncheck:** If user tries to uncheck the only active courier:
   - Checkbox remains checked
   - Toast: "Minimal 1 kurir harus aktif"
3. **Save:** Persist changes via PUT `/api/admin/settings`

## API Changes

### Settings API

**PUT `/api/admin/settings`**

```typescript
// Request body
{
  activeCouriers: string[] // ['jne', 'jnt', 'sicepat']
}

// Validation
- Must be array of valid courier codes
- Must have at least 1 element
- Invalid codes return 400 error
```

**Response on validation error:**
```json
{
  "error": "Minimal 1 kurir harus aktif"
}
```

### Shipping Calculator

Modify `lib/shipping/calculator.ts`:

```typescript
// Before (hardcoded)
const couriers = ['jne', 'jnt', 'sicepat', 'idexpress', 'anteraja', 'pos', 'tiki'];

// After (from settings)
const settings = await getShopSettings();
const couriers = settings.activeCouriers?.split(',').filter(Boolean) ?? ['jne', 'jnt', 'sicepat'];
```

## Error Handling

### No Active Couriers (Edge Case)

If `activeCouriers` is empty or missing in database:
- Fallback to default: `['jne', 'jnt', 'sicepat']`
- Log warning for admin investigation

### API Failure for Specific Courier

If one courier's API call fails:
- Continue showing other couriers
- Log error for debugging
- Do not block checkout

### All Couriers Fail

If all courier API calls fail:
- Show error message: "Gagal menghitung ongkos kirim. Silakan coba lagi."
- User cannot proceed with checkout

## Migration

1. Add `activeCouriers` column with default value
2. Existing installs automatically get `'jne,jnt,sicepat'`
3. No data migration needed

## Files to Modify

| File | Change |
|------|--------|
| `lib/db/schema.ts` | Add `activeCouriers` column |
| `lib/queries/settings.ts` | Add getter for active couriers |
| `lib/shipping/calculator.ts` | Read from settings instead of hardcoded |
| `app/admin/settings/page.tsx` | Add courier toggle UI |
| `app/api/admin/settings/route.ts` | Handle `activeCouriers` in PUT |

## Testing Checklist

- [ ] Toggle courier on/off persists correctly
- [ ] Cannot uncheck last active courier
- [ ] Checkout shows only active couriers
- [ ] Empty `activeCouriers` falls back to default
- [ ] Invalid courier codes rejected with 400

# Checkout Contact/Address Prefill — Design

## Problem

Checkout currently asks every user — logged-in or guest — to type email, phone, full name, and shipping address from scratch on every order. For logged-in users this is unnecessary: the account already has a profile (`customers` table) and, once this ships, a saved address book (`addresses` table, already fully built for the Account → Addresses page but never consumed by checkout).

## Scope

- **Guest checkout**: unchanged. Full `ContactForm` + `ShippingAddressForm`, typed fresh every time.
- **Logged-in checkout**: no contact fields shown at all (email/phone/name). Shipping address is chosen from saved addresses or added new — never retyped from scratch if one already exists.
- No database schema changes. No changes to `/api/checkout`, `/api/payments/create`, or the `orders`/`checkoutSessions` tables — this is a checkout-page UI change that feeds the same store fields those routes already consume.

## Data sources (already exist, no backend work needed)

- `GET /api/account/profile` → `{ profile: { email, firstName, lastName, phone } }`. 401 if not logged in. Email is not user-editable anywhere in the app (Account Settings' `PUT` only accepts firstName/lastName/phone) — checkout follows that same rule and never shows/edits it.
- `GET /api/addresses` / `POST /api/addresses` → existing full CRUD (`lib/queries/addresses.ts`), already used by `app/(store)/account/addresses/page.tsx`. First address a customer creates is automatically marked default (existing behavior, unchanged).

## Behavior

### Detecting login state

On mount, `checkout/page.tsx` fetches `/api/account/profile` once (React Query). A 200 means logged-in; a 401 **or any other non-200/network error** is treated as guest — checkout must never be blocked by a profile-fetch hiccup, so failure always fails open to the existing guest form.

### Guest path (profile fetch = 401 or error)

No change: `<ContactForm />` + `<ShippingAddressForm />` render exactly as they do today.

### Logged-in path (profile fetch = 200)

- `checkoutStore.data.email` is set from `profile.email` once, on load — not rendered as an input anywhere on the page.
- `<ContactForm />` and `<ShippingAddressForm />` are replaced by a new `<SavedAddressSelector />`:
  - Fetches `GET /api/addresses`.
  - **Has saved addresses**: renders each as a selectable card — recipient name, phone, address, "Utama" badge if default. A trimmed-down, select-only variant of the existing `AddressCard` (no edit/delete affordances here; those stay on the Account → Addresses page). The default address (or the only one) is pre-selected on load.
  - **Selecting a card** copies that address's `firstName + lastName` → `data.fullName`, `phone` → `data.phone`, and `address1`/`address2`/all `rajaongkir*` fields → the matching store fields. These are the *exact same* fields `ShippingAddressForm` already populates for guests, so `ShippingMethodSelector`, checkout-session creation, and order creation need zero changes.
  - **"+ Tambah Alamat Baru"** swaps the card list for the existing `AddressForm` component (already built, already handles validation + destination search). Saving it `POST`s to `/api/addresses` (persists to the address book, auto-defaults if it's the first one — existing behavior), then selects the newly created address the same way a card click does.
  - **Zero saved addresses**: skips straight to showing `AddressForm` (equivalent to the "add new" state) — no empty picker shown.

### Judgment call: whose phone number is used

The order's `phone` (used both as contact phone and `shippingPhone`) comes from the **selected address's** recipient phone, not the account owner's own profile phone. This matches how the field already behaves for guests today (`ContactForm`'s phone doubles as both) and correctly handles shipping to someone else (e.g. a gift) — the courier should be able to reach whoever's actually receiving the package.

## Non-goals (explicitly out of scope for this change)

- No "save this address" checkbox / opt-out — creating an address via checkout always saves it, same as the Account page always does.
- No editing an existing saved address inline from checkout — only select or add new. Editing/deleting stays on the Account → Addresses page.
- No syncing checkout-entered data back to the `customers` profile — logged-in users never enter contact info at checkout in the first place, so there's nothing to sync.

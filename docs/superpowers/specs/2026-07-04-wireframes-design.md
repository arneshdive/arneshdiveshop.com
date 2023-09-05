# Wireframe Design: Arnes Dive Shop

Desktop-only wireframes for a freediving and scuba diving gear e-commerce site. All UI text in Bahasa Indonesia.

## Overview

**8 screens total:**
1. Homepage (complete, relocate to wireframes folder)
2. Product Listing Page (PLP)
3. Product Detail Page (PDP)
4. Cart Page
5. Checkout Flow (2-step)
6. Search Results
7. Contact Page
8. FAQ / Help Center

## File Structure

```
docs/
├── wireframes/
│   ├── homepage.html
│   ├── plp.html
│   ├── pdp.html
│   ├── cart.html
│   ├── checkout.html
│   ├── search.html
│   ├── contact.html
│   └── faq.html
└── screen-roadmap.md
```

## Shared Design System

### Wireframe Aesthetic

All wireframes share consistent styling:

- **Wireframe boxes:** Dashed 2px #999 border, #f0f0f0 background
- **Typography:** System-ui font stack, 14px base
- **Colors:** Gray scale only (#333, #666, #999, #ddd, #f0f0f0, #f5f5f5)
- **Badges:** Solid background, 10px uppercase, for New/Sale/Freediving/Scuba
- **Container:** Max-width 1400px, 16px padding

### Buttons

- **Primary:** #333 background, white text, uppercase, 12px
- **Secondary:** Transparent, #999 border, #333 text, uppercase, 12px
- **Padding:** 12px 24px

### Forms

- **Inputs:** 100% width, 12px padding, 1px #999 border
- **Dropdowns:** Match input styling
- **Labels:** 11px uppercase, letter-spacing 1px

### Spacing Scale

- 8px (tight)
- 16px (base)
- 24px (medium)
- 32px (section)
- 48px (large section)

---

## Screen Specifications

### 1. Homepage (`homepage.html`)

**Status:** Complete (exists as `design.html`)

**Action:** Move to `wireframes/homepage.html`

**Elements:**
- Announcement bar
- Navigation (links, logo, icons)
- Hero section (split: content + image)
- Category strip (5 circular thumbnails)
- Featured products grid (4 columns)
- Split promotional banner
- Social/UGC section (5 images)
- Value propositions (4 items)
- Footer (newsletter, links, social)

---

### 2. Product Listing Page (`plp.html`)

**Purpose:** Browse products within a category or filtered selection

**Layout:**
- Breadcrumb
- Category header (title, optional description)
- Main content: sidebar (250px) + product grid
- Pagination at bottom

**Sidebar Filters:**
- Tipe Selam (Diving Type): Freediving, Scuba — checkboxes
- Kategori Produk: Masker, Fin, Wetsuit, Sabuk Pemberat, Aksesoris — checkboxes
- Harga: Slider or min/max inputs
- Ukuran: Checkboxes (contextual based on category)
- Warna: Swatches
- Merek: Checkboxes
- "Hapus Semua Filter" link

**Product Grid:**
- 4 columns, 24px gap
- Sort dropdown top right
- Each card: image (3:4), name, price, color swatches, badge if applicable

---

### 3. Product Detail Page (`pdp.html`)

**Purpose:** View full product details and add to cart

**Layout:**
- Left (60%): Image gallery
- Right (40%): Product info panel

**Image Gallery:**
- Main image (zoom on hover)
- Thumbnail strip (click to swap)

**Product Info Panel:**
- Breadcrumb
- Product title
- Price (sale price with strikethrough if applicable)
- Star rating + review count
- Diving type badge (Freediving / Scuba)
- Size selector
- Color swatches
- Quantity selector
- "Tambah ke Keranjang" button (primary)
- "Beli Sekarang" button (secondary)
- Description accordion
- Size guide link
- Shipping info

**Below Fold:**
- Detail produk accordion (materials, specs, care)
- Ulasan Pelanggan section
- Produk Terkait carousel

---

### 4. Cart Page (`cart.html`)

**Purpose:** Review items before checkout

**Layout:**
- Left (65%): Cart items
- Right (35%): Order summary

**Cart Items:**
- Each row: thumbnail, name, variant (size/color), qty selector, remove button, line price
- "Lanjut Belanja" link

**Order Summary:**
- Subtotal
- Estimated shipping note
- Promo code input + "Terapkan" button
- Total
- "Lanjut ke Checkout" button (primary, full width)
- Trust badges

**Empty State:**
- Empty illustration
- "Keranjang Anda Kosong"
- "Mulai Belanja" button

---

### 5. Checkout Flow (`checkout.html`)

**Purpose:** Complete purchase in 2 steps

**Progress Indicator:**
- Informasi → Pembayaran (checkmark on completion)

**Step 1: Informasi (Contact + Shipping)**

Left column (60%):
- Email
- Phone
- Shipping address form (name, address lines, city, province dropdown, postal code, notes)
- Shipping method radio (Standard 3-5 hari, Express 1-2 hari)
- "Lanjut ke Pembayaran" button

Right column (40%):
- Order summary (same as cart)

**Step 2: Pembayaran (Payment)**

Left column:
- Collapsed order summary
- Payment method selection:
  - Transfer Bank (VA)
  - Kartu Kredit/Debit
  - E-wallet (GoPay, OVO, Dana)
- Card form (conditional)
- "Bayar Sekarang" button
- Secure badge

Right column:
- Full order summary
- Support contact

---

### 6. Search Results (`search.html`)

**Purpose:** Display products matching search query

**Layout:**
- Same grid structure as PLP
- Search-specific header

**Header:**
- "Hasil pencarian untuk '[query]'"
- Result count
- "Maksud Anda:" suggestions if applicable

**Content:**
- Minimal filters (price, category)
- Sort dropdown
- 4-column product grid

**No Results State:**
- "Tidak ada hasil untuk '[query]'"
- Search suggestions
- Popular category links
- "Coba kata kunci lain"

---

### 7. Contact Page (`contact.html`)

**Purpose:** Customer support contact

**Layout:**
- Left (55%): Contact form
- Right (45%): Contact info

**Contact Form:**
- "Hubungi Kami" heading
- Name
- Email
- Subject dropdown (Pesanan, Pengiriman, Pengembalian, Lainnya)
- Message textarea
- "Kirim Pesan" button

**Contact Info:**
- Service hours
- WhatsApp number + chat button
- Email
- Response time note
- FAQ link

---

### 8. FAQ / Help Center (`faq.html`)

**Purpose:** Self-service support

**Layout:**
- Header with search
- Category quick links
- Accordion FAQ sections

**Header:**
- "Pusat Bantuan" title
- Search input

**Categories:**
- Pengiriman
- Pengembalian & Penukaran
- Pembayaran
- Produk
- Akun

**FAQ Accordion:**
- Question row (click to expand)
- Answer reveals below

**Footer:**
- "Masih butuh bantuan?"
- Contact link
- WhatsApp button

---

## Next Steps

1. Create all wireframe HTML files
2. Relocate existing `design.html` to `wireframes/homepage.html`
3. Ensure consistent styling across all files

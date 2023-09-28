# Product Detail Page (PDP) — Frontstore UI

## Overview
Build the product detail page for the storefront, matching the premium aesthetic established in the homepage.

## Design Reference
- Wireframe: `docs/wireframes/pdp.html`
- Design system: Homepage (`app/(store)/page.tsx`)
- Components: ProductCard, AnimatedButton, Header, Footer

## Layout

### Structure
```
[Breadcrumbs]
├── [Gallery - 60% width, sticky]    [Product Info - 40% width, sticky]
│   ├── Main image container
│   └── Thumbnail strip
│
├── [Accordion sections]
│   ├── Description
│   ├── Specifications
│   └── Shipping
│
└── [Related Products grid]
```

### Responsive Behavior
- Desktop (lg+): Two-column 60/40 split, both columns sticky
- Mobile: Single column stack, gallery first, then info

## Components to Build

### 1. Gallery Component (`components/product-gallery.tsx`)
- Main image container: aspect-[4/3] or aspect-square
- Thumbnail strip: horizontal scroll, w-20 h-20 thumbnails
- Selected thumbnail: ring-2 ring-neutral-900
- Hidden scrollbar on thumbnails
- Mobile: allow swipe (scroll-snap)

### 2. Product Info Section (inline in page for now)
- Category badge: uppercase text-xs tracking-widest
- Title: text-3xl lg:text-4xl font-bold tracking-tighter
- Price: text-xl lg:text-2xl font-semibold
- Variant selector: pill buttons with selected ring state
- Quantity: +/- stepper or input
- Stock status: text-green-600 with checkmark
- Actions: AnimatedButton (primary) + outline wishlist button

### 3. Accordion Component (`components/ui/accordion.tsx`)
- Simple collapsible sections
- Border-b between items
- Chevron icon rotates on open
- Smooth height transition
- Items: Description, Specifications, Shipping

### 4. Related Products Section
- Reuse ProductCard component
- 4-column grid (2 on mobile)
- Section header matching homepage style

## Styling Guidelines

### Typography
- Section headers: text-3xl lg:text-[44px] font-bold tracking-tighter
- Labels: text-xs uppercase tracking-widest text-neutral-500
- Body: text-sm text-neutral-600 leading-relaxed

### Colors
- Primary button: bg-neutral-900 text-white
- Outline button: border border-neutral-900
- Selected state: ring-2 ring-neutral-900
- Stock available: text-green-600
- Sale price: text-red-500

### Spacing
- Page container: max-w-[1440px] mx-auto px-6 lg:px-12
- Section gaps: py-12 lg:py-16
- Grid gaps: gap-4 lg:gap-6

### No Decorative Elements
- No wavy SVG transitions on PDP
- Clean white background throughout
- Focus on product and information

## File Structure
```
app/(store)/products/[slug]/
└── page.tsx              # Main PDP page

components/
├── product-gallery.tsx   # Image gallery component
└── ui/
    └── accordion.tsx     # Reusable accordion

types/
└── product.ts            # Product type definitions (if needed)
```

## Data (Mock for Now)
Use mock product data similar to homepage. Structure:
```typescript
interface Product {
  id: string;
  handle: string;
  title: string;
  category: string;
  price: string;           // "Rp 850.000"
  compareAtPrice?: string; // For sale items
  description: string;
  specifications: Record<string, string>;
  images: string[];
  variants?: {
    name: string;          // e.g. "Warna"
    options: { label: string; value: string }[];
  };
  stock: number;
  badge?: string;          // "Baru", "Sale", etc.
}
```

## Implementation Order
1. Create Product type/interface
2. Build ProductGallery component
3. Build Accordion component
4. Build PDP page with all sections
5. Add mock data and test responsiveness

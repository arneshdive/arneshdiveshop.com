export interface MockProduct {
  id: string;
  handle: string;
  title: string;
  vendor?: string;
  price: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  compareAtPrice?: string;
  badges?: string[];
  image?: string;
  secondaryImage?: string;
  category?: 'masker' | 'fin' | 'wetsuit' | 'sabuk-pemberat' | 'aksesoris';
  diveType?: 'freediving' | 'scuba' | 'both';
  // First active variant's id, when the product has variants.
  variantId?: string;
  // Admin-only fields (catalog management, not shown on the storefront) —
  // optional since most consumers of MockProduct are storefront-only mock
  // objects that never populate them.
  brand?: 'mares' | 'cressi' | 'beuchat' | 'salvimar';
  isActive?: boolean;
  stockStatus?: 'in_stock' | 'out_of_stock';
}

// Icon + stable translation key. The actual title/desc copy lives in
// messages/*.json under `common.valueProps.<key>` — this file no longer
// hardcodes the Indonesian prose, since it can't call useTranslations()
// itself (plain data, not a component).
export const valueProps = [
  { icon: 'solar:verified-check-linear', key: 'originalProduct' },
  { icon: 'solar:shield-check-linear', key: 'securePayment' },
  { icon: 'solar:map-linear', key: 'nationwideShipping' },
] as const;

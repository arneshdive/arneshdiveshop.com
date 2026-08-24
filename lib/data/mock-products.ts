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

export const valueProps = [
  { icon: 'solar:verified-check-linear', title: 'Produk Original', desc: '100% kualitas terjamin' },
  { icon: 'solar:shield-check-linear', title: 'Pembayaran Aman', desc: 'Transaksi terlindungi' },
  { icon: 'solar:map-linear', title: 'Kirim Seluruh Indonesia', desc: 'Jangkauan luas' },
];

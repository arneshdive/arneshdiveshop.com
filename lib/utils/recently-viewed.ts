/**
 * Recently Viewed Products - localStorage management
 *
 * Stores up to 50 products, displays 4 in the UI.
 * Each entry contains minimal data needed for the ProductCard component.
 */

export interface RecentlyViewedProduct {
  id: string;
  slug: string;
  name: string;
  vendor?: string;
  price: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  compareAtPrice?: string;
  badges?: string[];
  image?: string;
  secondaryImage?: string;
  variantId?: string;
  viewedAt: number; // Unix timestamp
}

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 50;

/**
 * Get recently viewed products from localStorage
 */
export function getRecentlyViewed(): RecentlyViewedProduct[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const products = JSON.parse(stored) as RecentlyViewedProduct[];
    // Sort by viewedAt descending (most recent first)
    return products.sort((a, b) => b.viewedAt - a.viewedAt);
  } catch {
    return [];
  }
}

/**
 * Add or update a product in recently viewed
 * If product already exists, it moves to the front with updated timestamp
 */
export function addToRecentlyViewed(product: Omit<RecentlyViewedProduct, 'viewedAt'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getRecentlyViewed();
    
    // Remove existing entry for this product (if any)
    const filtered = existing.filter(p => p.id !== product.id);
    
    // Add new entry at the beginning
    const updated: RecentlyViewedProduct[] = [
      { ...product, viewedAt: Date.now() },
      ...filtered,
    ];
    
    // Keep only MAX_ITEMS
    const trimmed = updated.slice(0, MAX_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to update recently viewed:', error);
  }
}

/**
 * Clear all recently viewed products
 */
export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear recently viewed:', error);
  }
}

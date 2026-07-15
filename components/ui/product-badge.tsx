import { cn } from '@/lib/utils/cn';

export type BadgeType = 'sale' | 'new' | 'inactive';

interface ProductBadgeProps {
  /** The text to display in the badge */
  children: React.ReactNode;
  /** Badge type for predefined styling */
  type: BadgeType;
  /** Context: card for store product cards, list for admin list views */
  context: 'card' | 'list';
  /** Additional CSS classes */
  className?: string;
}

// Product card styles (solid backgrounds, no rounded corners)
const cardStyles: Record<BadgeType, string> = {
  sale: 'bg-red-500 text-white px-1.5 py-1 text-[10px] uppercase tracking-wider font-medium',
  new: 'bg-blue-600 text-white px-1.5 py-1 text-[10px] uppercase tracking-wider font-medium',
  inactive: 'bg-neutral-400 text-white px-1.5 py-1 text-[10px] uppercase tracking-wider font-medium',
};

// Admin list styles (soft backgrounds, rounded-full)
const listStyles: Record<BadgeType, string> = {
  sale: 'bg-red-100 text-red-700 px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full',
  new: 'bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full',
  inactive: 'bg-neutral-200 text-neutral-600 px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full',
};

/**
 * Reusable product badge component.
 * 
 * @example
 * // Store-facing product card
 * <ProductBadge type="sale" context="card">Sale</ProductBadge>
 * <ProductBadge type="new" context="card">New</ProductBadge>
 * 
 * // Admin list view
 * <ProductBadge type="sale" context="list">Sale</ProductBadge>
 * <ProductBadge type="new" context="list">New</ProductBadge>
 * <ProductBadge type="inactive" context="list">Nonaktif</ProductBadge>
 */
export function ProductBadge({ 
  children, 
  type, 
  context,
  className 
}: ProductBadgeProps) {
  const styles = context === 'card' ? cardStyles : listStyles;

  return (
    <span className={cn(styles[type], className)}>
      {children}
    </span>
  );
}

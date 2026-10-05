// Historical category slugs retained for incoming storefront and API links.
export const CATEGORY_SLUG_ALIASES = {
  fin: 'fins',
  mask: 'masker',
  wetsuits: 'wetsuit',
  accessories: 'aksesoris',
} as const;

export function canonicalCategorySlug(slug: string): string {
  return Object.hasOwn(CATEGORY_SLUG_ALIASES, slug)
    ? CATEGORY_SLUG_ALIASES[slug as keyof typeof CATEGORY_SLUG_ALIASES]
    : slug;
}

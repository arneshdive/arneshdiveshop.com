import { expect, it } from 'vitest';
import { canonicalCtaHref, expectedConsolidation, MERGES } from './consolidate-categories.mjs';
import { CATEGORY_SLUG_ALIASES } from '@/lib/constants/category-aliases';

it('keeps the migration plan and storefront aliases aligned', () => {
  expect(Object.fromEntries(MERGES.map((merge) => [merge.source, merge.target])))
    .toEqual(CATEGORY_SLUG_ALIASES);
});

it.each([
  ['/produk?category=fin&brand=mares&page=2#gear', '/produk?category=fins&brand=mares&page=2#gear'],
  ['/en/produk?q=blue%20fins&category=%66in&tag=a&tag=b', '/en/produk?q=blue%20fins&category=fins&tag=a&tag=b'],
  ['/es/produk?category=mask', '/es/produk?category=masker'],
  ['/ja/produk?category=wetsuits', '/ja/produk?category=wetsuit'],
  ['/fr/produk?category=accessories', '/fr/produk?category=aksesoris'],
  ['/produk?category=bcd', '/produk?category=bcd'],
  ['/blog?category=fin', '/blog?category=fin'],
  ['/produk#?category=fin', '/produk#?category=fin'],
])('preserves unrelated parts of a blog CTA: %s', (href, expected) => {
  expect(canonicalCtaHref(href)).toBe(expected);
});

it('moves inactive and soft-deleted rows, preserving all fields and variant associations', () => {
  const before = {
    categories: MERGES.flatMap((merge) => [
      { id: merge.sourceId, slug: merge.source, name: merge.source, description: 'Source description' },
      { id: merge.targetId, slug: merge.target, name: merge.target === 'masker' ? 'Mask' : merge.target, description: merge.target === 'fins' ? null : 'Keep description' },
    ]).concat([{ id: 'bcd-id', slug: 'bcd', name: 'BCD', description: 'BCD description' }]),
    // wetsuits deliberately has zero products, as in the reviewed database.
    products: MERGES.filter((merge) => merge.source !== 'wetsuits').flatMap((merge) => [
      { id: `${merge.source}-inactive`, slug: 'keep-slug', category_id: merge.sourceId, price_cents: 12345, is_active: false, deleted_at: null },
      { id: `${merge.source}-deleted`, slug: 'keep-deleted-slug', category_id: merge.sourceId, price_cents: 67890, is_active: true, deleted_at: '2026-01-01' },
    ]),
    product_variants: [{ id: 'variant-id', product_id: 'fin-deleted', options: { size: 'M' }, price_cents: 23456 }],
    blog_posts: [{ id: 'draft', slug: 'fin-freediving-vs-fin-scuba', related_category_slug: 'fin', cta_href: '/produk?category=fin&page=2', is_published: false, updated_at: 'keep-timestamp', content: ['keep-content'] }],
  };
  const original = structuredClone(before);
  const after = expectedConsolidation(before);
  expect(before).toEqual(original);
  expect(after.categories).toHaveLength(5);
  expect(after.categories.find((category) => category.slug === 'fins')?.description).toBe('Source description');
  expect(after.categories.find((category) => category.slug === 'masker')?.name).toBe('Masker');
  expect(after.categories.find((category) => category.slug === 'masker')?.description).toBe('Keep description');
  expect(after.categories.find((category) => category.slug === 'bcd')).toEqual(before.categories.at(-1));
  expect(after.product_variants).toEqual(before.product_variants);
  for (const [index, product] of after.products.entries()) {
    const old = before.products[index]!;
    const destination = MERGES.find((merge) => merge.sourceId === old.category_id)!;
    expect(product).toEqual({ ...old, category_id: destination.targetId });
  }
  expect(after.blog_posts[0]).toEqual({
    ...before.blog_posts[0], related_category_slug: 'fins', cta_href: '/produk?category=fins&page=2',
  });

  const populated = structuredClone(before);
  populated.categories.find((category) => category.slug === 'fins')!.description = 'Existing destination description';
  expect(expectedConsolidation(populated).categories.find((category) => category.slug === 'fins')?.description)
    .toBe('Existing destination description');

  const changedIds = structuredClone(before);
  changedIds.categories[0]!.id = 'unexpected-id';
  expect(() => expectedConsolidation(changedIds)).toThrow('Category IDs changed');
});

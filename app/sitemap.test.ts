import { beforeEach, expect, it, vi } from 'vitest';

const { getProducts, getPublishedBlogPosts } = vi.hoisted(() => ({
  getProducts: vi.fn(),
  getPublishedBlogPosts: vi.fn(),
}));
vi.mock('@/lib/queries/products', () => ({ getProducts }));
vi.mock('@/lib/queries/blog', () => ({ getPublishedBlogPosts }));
vi.mock('@/i18n/navigation', () => ({
  getPathname: ({ href, locale }: {
    href: string | { pathname: string; query?: Record<string, string> };
    locale: string;
  }) => {
    const prefix = locale === 'id' ? '' : `/${locale}`;
    return typeof href === 'string'
      ? `${prefix}${href}`
      : `${prefix}${href.pathname}?${new URLSearchParams(href.query)}`;
  },
}));

import sitemap from './sitemap';

beforeEach(() => {
  vi.clearAllMocks();
  getPublishedBlogPosts.mockResolvedValue([]);
});

it('advertises each category represented by visible products once, with locale alternates', async () => {
  // BCD has no visible products, so it never appears in getProducts' result.
  getProducts.mockResolvedValue([
    { slug: 'fins-one', category: { slug: 'fins' } },
    { slug: 'fins-two', category: { slug: 'fins' } },
    { slug: 'mask-one', category: { slug: 'masker' } },
  ]);
  const routes = await sitemap();
  expect(getProducts).toHaveBeenCalledWith({ isActive: true });
  const categoryRoutes = routes.filter((route) => route.url.includes('?category='));
  expect(categoryRoutes.map((route) => new URL(route.url).searchParams.get('category')))
    .toEqual(['fins', 'masker']);
  const alternates = categoryRoutes[0]!.alternates!.languages!;
  expect(Object.keys(alternates)).toEqual(['id', 'en', 'es', 'ja', 'fr', 'x-default']);
  expect(alternates.en).toContain('/en/produk?category=fins');
  expect(routes.some((route) => route.url.endsWith('/tentang-kami'))).toBe(true);
});

it('omits category routes when there are no visible products or the database fails', async () => {
  getProducts.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Unavailable'));
  for (let attempt = 0; attempt < 2; attempt++) {
    expect((await sitemap()).some((route) => route.url.includes('?category='))).toBe(false);
  }
});

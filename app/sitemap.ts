import type { MetadataRoute } from 'next';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { siteConfig } from '@/config/site';

export const dynamic = 'force-dynamic';

// Builds the `alternates.languages` map for a sitemap entry — the same path
// in every locale, since none of these routes have per-locale pathnames
// (see i18n/routing.ts). `x-default` points at the unprefixed default-locale
// (id) URL, per Google's hreflang sitemap guidance.
function localizedAlternates(href: string | { pathname: string; query?: Record<string, string> }) {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${siteConfig.url}${getPathname({ href, locale })}`;
  }
  languages['x-default'] = `${siteConfig.url}${getPathname({ href, locale: routing.defaultLocale })}`;
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Dynamic import so the DB module is only loaded at runtime
  const { getProducts } = await import('@/lib/queries/products');
  let products: Array<{ slug: string; updatedAt?: string | Date | null }> = [];
  try {
    products = await getProducts({ isActive: true });
  } catch {
    // DB not available — skip dynamic product routes
  }

  let categories: Array<{ slug: string }> = [];
  try {
    const { db } = await import('@/lib/db');
    const { categories: categoriesTable } = await import('@/lib/db/schema');
    categories = await db.select({ slug: categoriesTable.slug }).from(categoriesTable);
  } catch {
    // DB not available — skip category filter routes
  }

  let posts: Array<{
    slug: string;
    updatedAt: Date;
    coverImageUrl: string;
  }> = [];
  try {
    const { getPublishedBlogPosts } = await import('@/lib/queries/blog');
    posts = await getPublishedBlogPosts();
  } catch {
    // DB not available — skip dynamic blog routes
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: 'daily', priority: 1, alternates: { languages: localizedAlternates('/') } },
    { url: `${siteConfig.url}/produk`, changeFrequency: 'daily', priority: 0.9, alternates: { languages: localizedAlternates('/produk') } },
    {
      url: `${siteConfig.url}/produk?divingType=freediving`,
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: { languages: localizedAlternates({ pathname: '/produk', query: { divingType: 'freediving' } }) },
    },
    {
      url: `${siteConfig.url}/produk?divingType=scuba`,
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: { languages: localizedAlternates({ pathname: '/produk', query: { divingType: 'scuba' } }) },
    },
    { url: `${siteConfig.url}/blog`, changeFrequency: 'weekly', priority: 0.6, alternates: { languages: localizedAlternates('/blog') } },
    { url: `${siteConfig.url}/faq`, changeFrequency: 'monthly', priority: 0.3, alternates: { languages: localizedAlternates('/faq') } },
    { url: `${siteConfig.url}/kontak`, changeFrequency: 'monthly', priority: 0.3, alternates: { languages: localizedAlternates('/kontak') } },
    { url: `${siteConfig.url}/privasi`, changeFrequency: 'yearly', priority: 0.1, alternates: { languages: localizedAlternates('/privasi') } },
    { url: `${siteConfig.url}/syarat`, changeFrequency: 'yearly', priority: 0.1, alternates: { languages: localizedAlternates('/syarat') } },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteConfig.url}/produk?category=${category.slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
    alternates: { languages: localizedAlternates({ pathname: '/produk', query: { category: category.slug } }) },
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteConfig.url}/produk/${product.slug}`,
    lastModified: product.updatedAt ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
    alternates: { languages: localizedAlternates(`/produk/${product.slug}`) },
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
    images: [
      post.coverImageUrl.startsWith('http')
        ? post.coverImageUrl
        : `${siteConfig.url}${post.coverImageUrl}`,
    ],
    alternates: { languages: localizedAlternates(`/blog/${post.slug}`) },
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}

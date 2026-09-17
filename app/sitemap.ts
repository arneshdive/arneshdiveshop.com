import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { guides } from '@/lib/data/guides';

export const dynamic = 'force-dynamic';

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

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: 'daily', priority: 1 },
    { url: `${siteConfig.url}/produk`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteConfig.url}/produk?divingType=freediving`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteConfig.url}/produk?divingType=scuba`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteConfig.url}/panduan`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteConfig.url}/faq`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteConfig.url}/kontak`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteConfig.url}/privasi`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${siteConfig.url}/syarat`, changeFrequency: 'yearly', priority: 0.1 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteConfig.url}/produk?category=${category.slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteConfig.url}/produk/${product.slug}`,
    lastModified: product.updatedAt ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const guideRoutes: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${siteConfig.url}/panduan/${guide.slug}`,
    lastModified: guide.publishedAt,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...guideRoutes];
}

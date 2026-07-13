import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getProducts } from '@/lib/queries/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts({ isActive: true });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: 'daily', priority: 1 },
    { url: `${siteConfig.url}/produk`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteConfig.url}/faq`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteConfig.url}/kontak`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteConfig.url}/privasi`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${siteConfig.url}/syarat`, changeFrequency: 'yearly', priority: 0.1 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteConfig.url}/produk/${product.slug}`,
    lastModified: product.updatedAt ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}

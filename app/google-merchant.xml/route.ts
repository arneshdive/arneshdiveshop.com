import { siteConfig } from '@/config/site';
import { computeProductPriceDisplay } from '@/lib/utils/product-pricing';

// Google Merchant Center product feed (scheduled fetch), served outside
// /api so it isn't caught by the `Disallow: /api` rule in robots.txt.
// Register this exact URL in Merchant Center → Products → Feeds → add a
// "Scheduled fetch" feed, daily.
//
// v1 simplification: one feed item per product at its lowest variant price,
// not one item per variant. Good enough for free listings; revisit with
// item_group_id-based per-variant items only if Merchant Center flags
// price-accuracy issues.
export const dynamic = 'force-dynamic';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const { getProducts } = await import('@/lib/queries/products');

  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    products = await getProducts({ isActive: true });
  } catch {
    // DB not available — return an empty-but-valid feed rather than erroring,
    // matching the sitemap's fallback behavior.
  }

  const items = products
    .filter((product) => (product.images as string[] | undefined)?.length)
    .map((product) => {
      const priceInfo = computeProductPriceDisplay({
        priceCents: product.priceCents,
        compareAtPriceCents: product.compareAtPriceCents ?? null,
        variants: (product.variants ?? []).map((v: any) => ({
          isActive: v.isActive,
          priceCents: v.priceCents,
        })),
      });

      const effectiveCents = priceInfo.priceRangeMin ?? product.priceCents;
      const link = `${siteConfig.url}/produk/${product.slug}`;
      const image = (product.images as string[])[0];
      const description = product.description?.trim() || `${product.name} — ${product.brand?.name ?? siteConfig.name}, tersedia di ${siteConfig.name}.`;

      const priceFields = priceInfo.hasDiscount
        ? `<g:price>${(product.compareAtPriceCents! / 100).toFixed(2)} IDR</g:price>
      <g:sale_price>${(effectiveCents / 100).toFixed(2)} IDR</g:sale_price>`
        : `<g:price>${(effectiveCents / 100).toFixed(2)} IDR</g:price>`;

      return `    <item>
      <g:id>${product.id}</g:id>
      <title>${escapeXml(product.name)}</title>
      <description>${escapeXml(description)}</description>
      <link>${link}</link>
      <g:image_link>${image}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${product.isActive ? 'in_stock' : 'out_of_stock'}</g:availability>
      ${priceFields}
      <g:brand>${escapeXml(product.brand?.name ?? siteConfig.name)}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      ${product.category ? `<g:product_type>${escapeXml(product.category.name)}</g:product_type>` : ''}
    </item>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(siteConfig.name)} — Product Feed</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(siteConfig.description)}</description>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

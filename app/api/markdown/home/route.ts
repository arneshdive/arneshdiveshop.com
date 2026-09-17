import { getProducts } from '@/lib/queries/products';
import { formatCurrency } from '@/lib/utils/format';
import { siteConfig } from '@/config/site';

function productLine(p: Awaited<ReturnType<typeof getProducts>>[number]) {
  const price = formatCurrency(p.priceCents);
  const brand = p.brand?.name ? ` · ${p.brand.name}` : '';
  return `- [${p.name}](${siteConfig.url}/produk/${p.slug}) — ${price}${brand}`;
}

// Markdown-for-agents: middleware.ts rewrites GET / here when the request's
// Accept header asks for text/markdown. Reuses the same queries the
// homepage Server Component renders from, so this never drifts from what a
// browser actually sees.
export async function GET() {
  const [newArrivals, onSale, latest] = await Promise.all([
    getProducts({ isActive: true, isNewArrival: true, limit: 4 }),
    getProducts({ isActive: true, isOnSale: true, limit: 4 }),
    getProducts({ isActive: true, limit: 8 }),
  ]);

  const body = [
    `# ${siteConfig.name}`,
    siteConfig.description,
    '',
    '## Baru Tiba',
    ...newArrivals.map(productLine),
    '',
    '## Sedang Diskon',
    ...onSale.map(productLine),
    '',
    '## Katalog Terbaru',
    ...latest.map(productLine),
    '',
    `Full catalog: ${siteConfig.url}/produk`,
    `API catalog: ${siteConfig.url}/.well-known/api-catalog`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      // Rough token estimate (chars/4) — no tokenizer dependency for this.
      'x-markdown-tokens': String(Math.ceil(body.length / 4)),
      Vary: 'Accept',
    },
  });
}

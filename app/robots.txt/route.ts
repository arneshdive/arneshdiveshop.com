import { siteConfig } from '@/config/site';

// A plain Route Handler instead of the typed `robots.ts` metadata file: the
// typed `MetadataRoute.Robots` shape has no field for Content-Signal, so
// generating it needs raw text control.
export function GET() {
  const body = [
    'User-agent: *',
    // Content Signals (contentsignals.org draft): ai-train=no keeps product
    // copy/images out of training corpora; search=yes and ai-input=yes keep
    // the catalog visible to search engines and usable by shopping agents.
    'Content-Signal: ai-train=no, search=yes, ai-input=yes',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api',
    'Disallow: /account',
    'Disallow: /checkout',
    'Disallow: /cart',
    '',
    `Sitemap: ${siteConfig.url}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

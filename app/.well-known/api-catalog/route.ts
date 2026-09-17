import { siteConfig } from '@/config/site';

// RFC 9727 API catalog. Scoped to the four GET endpoints that are actually
// public and unauthenticated (verified against their route handlers — only
// their POST/mutation paths call requireAdmin). The rest of app/api/* backs
// the admin CSR panel or requires a session, so it isn't listed here.
export function GET() {
  const base = siteConfig.url;
  const docs = `${base}/docs/api`;

  const linkset = [
    {
      anchor: `${base}/api/search`,
      'service-doc': [{ href: `${docs}#search` }],
    },
    {
      anchor: `${base}/api/products`,
      'service-doc': [{ href: `${docs}#products` }],
    },
    {
      anchor: `${base}/api/categories`,
      'service-doc': [{ href: `${docs}#categories` }],
    },
    {
      anchor: `${base}/api/brands`,
      'service-doc': [{ href: `${docs}#brands` }],
    },
  ];

  return new Response(JSON.stringify({ linkset }), {
    headers: { 'Content-Type': 'application/linkset+json' },
  });
}

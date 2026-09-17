import { siteConfig } from '@/config/site';
import { DIVING_TYPES, formatDivingType } from '@/lib/constants/diving-types';

// llms.txt (llmstxt.org draft): a short, LLM-oriented map of the site.
// Plain Route Handler to match the app/robots.txt/route.ts convention —
// keeps this dynamic (siteConfig-driven) instead of a static public/ file.
// Activity list is read from DIVING_TYPES rather than hardcoded, so this
// can't silently fall out of sync if a type is added/removed later.
export function GET() {
  const labels = DIVING_TYPES.map((type) => formatDivingType(type).toLowerCase());
  const activities = `${labels.slice(0, -1).join(', ')}, dan ${labels.at(-1)}`;
  const body = [
    `# ${siteConfig.name}`,
    '',
    `> ${siteConfig.description}`,
    '',
    `Toko daring perlengkapan ${activities}. Tidak memiliki toko fisik.`,
    '',
    '## Katalog',
    `- [Semua Produk](${siteConfig.url}/produk): Katalog lengkap, mendukung filter lewat query params (kategori, brand, tipe diving, sale).`,
    `- [Markdown Beranda](${siteConfig.url}/): Kirim header \`Accept: text/markdown\` untuk versi markdown dari beranda.`,
    '',
    '## Untuk Agent & Developer',
    `- [API Catalog](${siteConfig.url}/.well-known/api-catalog): Daftar endpoint publik (RFC 9727 linkset).`,
    `- [Robots](${siteConfig.url}/robots.txt): Aturan crawling dan content signals.`,
    `- [Sitemap](${siteConfig.url}/sitemap.xml)`,
    '',
    '## Optional',
    `- [Instagram](${siteConfig.links.instagram})`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}

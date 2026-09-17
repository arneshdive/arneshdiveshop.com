import { siteConfig } from '@/config/site';

// llms.txt (llmstxt.org draft): a short, LLM-oriented map of the site.
// Plain Route Handler to match the app/robots.txt/route.ts convention —
// keeps this dynamic (siteConfig-driven) instead of a static public/ file.
export function GET() {
  const body = [
    `# ${siteConfig.name}`,
    '',
    `> ${siteConfig.description}`,
    '',
    'Toko daring perlengkapan freediving, scuba diving, dan spearfishing. Tidak memiliki toko fisik.',
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

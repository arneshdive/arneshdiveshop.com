import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Images are served straight from Vercel Blob and /public, never through
    // /_next/image. Vercel's optimizer bills one transformation per unique
    // (image, width, quality): with ~780 catalogue images and the default
    // eight device widths plus seven image widths, browsing the catalogue
    // exhausted the account's quota and every image on the site started
    // coming back 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED. Most sources
    // are already 1080x1080 at 40-100KB, so there was little to gain from
    // resizing them on the fly anyway. Sizing is handled at upload time
    // instead — see app/api/upload/route.ts.
    unoptimized: true,
    // Kept so the optimizer stays correctly configured if it is ever re-enabled.
    //
    // The R2 host is pinned to the one bucket this project owns. `*.r2.dev`
    // would have been an allowance across every Cloudflare account on earth —
    // r2.dev subdomains are handed out per bucket to all R2 users, so that
    // pattern let next/image fetch and re-serve a stranger's public bucket
    // from this origin.
    //
    // String literals rather than reads of R2_PUBLIC_URL because
    // `remotePatterns` is evaluated when the config is loaded and baked into
    // the build: a runtime env var would be whatever the build machine had,
    // which is not something to depend on for an allowlist. The cost is that
    // changing a host means editing this file — a deliberate trade, so the
    // allowlist changes only by review.
    //
    // Both hosts are now pinned. The Blob store id was verified against the
    // live store during the 2026-09-07 incident (its URLs are the ones that
    // 403'd, and the 887 legacy image URLs in `products.images` all sit on
    // it), not taken from the seed fixture in lib/scripts/seed-products.ts.
    // The R2 host is the Cloudflare custom domain; `pub-*.r2.dev` is
    // rate-limited and was never meant to serve traffic.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'duruwpeexnyc4tce.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'file.arneshdiveshop.com',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/panduan', destination: '/blog', permanent: true },
      { source: '/panduan/:slug', destination: '/blog/:slug', permanent: true },
      { source: '/sale', destination: '/produk?onSale=true', permanent: true },
      { source: '/freediving', destination: '/produk?divingType=freediving', permanent: true },
      { source: '/scuba', destination: '/produk?divingType=scuba', permanent: true },
      { source: '/aksesoris', destination: '/produk?category=aksesoris', permanent: true },
    ];
  },
};

export default nextConfig;

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
    // A string literal rather than a read of R2_PUBLIC_URL because
    // `remotePatterns` is evaluated when the config is loaded and baked into
    // the build: a runtime env var would be whatever the build machine had,
    // which is not something to depend on for an allowlist. Cost of that
    // choice: switching to the Cloudflare custom domain (which Phase D needs
    // anyway — pub-*.r2.dev is rate-limited and not meant to serve traffic)
    // means editing this file. That is a deliberate trade — an allowlist that
    // changes only by review.
    //
    // The Blob host below is still a wildcard, and has the same shape of
    // problem: every Vercel Blob store gets a subdomain there. It is left as
    // is only because the production store id could not be confirmed from the
    // repo (the one that appears in lib/scripts/seed-products.ts is a seed
    // fixture, not necessarily the live store) and a wrong pin would break
    // every image the day the optimizer is re-enabled. Pin it from the live
    // store id before ever turning `unoptimized` off.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-e2bc11c40cb644838a7ddc22ac9f29c9.r2.dev',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/sale', destination: '/produk?onSale=true', permanent: true },
      { source: '/freediving', destination: '/produk?divingType=freediving', permanent: true },
      { source: '/scuba', destination: '/produk?divingType=scuba', permanent: true },
      { source: '/aksesoris', destination: '/produk?category=aksesoris', permanent: true },
    ];
  },
};

export default nextConfig;

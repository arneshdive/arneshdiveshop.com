// Owner-confirmed public storefront; independent of DB shipping/admin addresses.
const publicStoreAddress = {
  streetAddress: 'Ruko Griya Pesona Rinjani, Jl. Adi Sucipto Blok B15, Ampenan Utara, Kec. Ampenan',
  addressLocality: 'Kota Mataram',
  addressRegion: 'Nusa Tenggara Barat',
  postalCode: '83118',
  addressCountry: 'ID',
  countryName: 'Indonesia',
} as const;

export const siteConfig = {
  // "Arnesh Dive" is the real store name (see shop_settings.store_name in
  // the DB) — not "Arnesh Dive Shop"/"Arnes Dive Shop", both of which drifted
  // into various pages/emails over time.
  name: "Arnesh Dive",
  sellerName: 'Haeste Diveshop',
  // Used for the browser tab title — the full name still reads as the domain
  // name (arneshdiveshop.com), not the brand, so the tab just shows "Arnesh".
  shortName: "Arnesh",
  description: 'Perlengkapan freediving dan scuba diving premium untuk setiap level penyelam',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  publicStoreAddress: {
    ...publicStoreAddress,
    formatted: [
      publicStoreAddress.streetAddress,
      publicStoreAddress.addressLocality,
      `${publicStoreAddress.addressRegion} ${publicStoreAddress.postalCode}`,
      publicStoreAddress.countryName,
    ].join(', '),
  },
  links: {
    // Matches the handle actually linked on the homepage (app/[locale]/(store)/page.tsx)
    // — not "arneshdiveshop", which is the same stale domain-derived name the
    // comment above already warns against.
    instagram: 'https://www.instagram.com/arnesh.official',
    haesteInstagram: 'https://www.instagram.com/haeste_diveshop',
    // "Haeste Diveshop" is the marketplace seller name for these two — same
    // owner, sells the Arnesh brand under a different storefront name.
    shopee: 'https://shopee.co.id/haeste_diveshop',
    tokopedia: 'https://www.tokopedia.com/haeste-diveshop',
  },
} as const;

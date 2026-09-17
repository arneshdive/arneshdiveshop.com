export const siteConfig = {
  // "Arnesh Dive" is the real store name (see shop_settings.store_name in
  // the DB) — not "Arnesh Dive Shop"/"Arnes Dive Shop", both of which drifted
  // into various pages/emails over time.
  name: "Arnesh Dive",
  // Used for the browser tab title — the full name still reads as the domain
  // name (arneshdiveshop.com), not the brand, so the tab just shows "Arnesh".
  shortName: "Arnesh",
  description: 'Perlengkapan freediving dan scuba diving premium untuk setiap level penyelam',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  links: {
    instagram: 'https://instagram.com/arneshdiveshop',
  },
} as const;

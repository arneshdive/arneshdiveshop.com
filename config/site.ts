export const siteConfig = {
  name: "Arnesh Dive Shop",
  // Used for the browser tab title — "Arnesh Dive Shop" reads as the domain
  // name (arneshdiveshop.com), not the brand, so the tab just shows "Arnesh".
  shortName: "Arnesh",
  description: 'Perlengkapan freediving dan scuba diving premium untuk setiap level penyelam',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  links: {
    instagram: 'https://instagram.com/arneshdiveshop',
  },
} as const;

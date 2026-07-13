export const siteConfig = {
  name: "Arne's Dive Shop",
  description: 'Premium diving equipment and gear for underwater enthusiasts',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  links: {
    instagram: 'https://instagram.com/arnesdiveshop',
  },
} as const;

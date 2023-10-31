export interface HeroBanner {
  id: 'hero';
  backgroundImage: string;
  eyebrow: string;
  heading: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

export interface SplitBanner {
  id: string;
  collection: 'freediving' | 'scuba';
  eyebrow: string;
  heading: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
}

export type Banner = HeroBanner | SplitBanner;

// Default banner data - matches current homepage content
export const mockBanners: Banner[] = [
  {
    id: 'hero',
    backgroundImage: '/hero-image.webp',
    eyebrow: 'Freediving & Scuba',
    heading: 'Berjelajah di kedalaman',
    description: 'Temukan perlengkapan freediving yang Anda butuhkan.',
    ctaText: 'Lihat Koleksi',
    ctaLink: '/freediving',
  },
  {
    id: 'split-freediving',
    collection: 'freediving',
    eyebrow: 'Freediving',
    heading: 'Koleksi Freediving',
    ctaText: 'Lihat Koleksi',
    ctaLink: '/freediving',
    backgroundImage: undefined,
  },
  {
    id: 'split-scuba',
    collection: 'scuba',
    eyebrow: 'Scuba',
    heading: 'Koleksi Scuba',
    ctaText: 'Lihat Koleksi',
    ctaLink: '/scuba',
    backgroundImage: undefined,
  },
];

export function getHeroBanner(): HeroBanner {
  return mockBanners.find((b): b is HeroBanner => b.id === 'hero')!;
}

export function getSplitBanners(): SplitBanner[] {
  return mockBanners.filter((b): b is SplitBanner => b.id.startsWith('split-'));
}

export function getSplitBanner(collection: 'freediving' | 'scuba'): SplitBanner | undefined {
  return mockBanners.find((b): b is SplitBanner => b.id === `split-${collection}`);
}

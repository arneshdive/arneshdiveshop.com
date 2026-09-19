import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { DIVING_TYPES } from '@/lib/constants/diving-types';
import type { DivingType } from '@/lib/db/schema';

interface DivingTypeTile {
  title: string;
  subtitle: string;
  href: string;
  image: string;
}

// Marketing copy image per diving type — kept separate from
// DIVING_TYPES (lib/constants/diving-types.ts) so the enum stays the
// single source of truth for which types exist, matching the admin
// product form's checklist.
const TILE_IMAGES: Record<DivingType, string> = {
  freediving: '/freediving-banner.webp',
  scuba: '/scuba-banner.webp',
  spearfishing: '/spearfishing-banner.webp',
  surfing: '/surfing-banner.webp',
  swimming: '/swimming-banner.webp',
};

export async function DivingTypeGrid() {
  const t = await getTranslations('home');
  const tDivingTypes = await getTranslations('common.divingTypes');

  const divingTypeTiles: DivingTypeTile[] = [
    ...DIVING_TYPES.map((type) => ({
      title: tDivingTypes(type),
      subtitle: t(`divingGrid.${type}Subtitle`),
      href: `/produk?divingType=${type}`,
      image: TILE_IMAGES[type],
    })),
    {
      title: t('divingGrid.otherTitle'),
      subtitle: t('divingGrid.otherSubtitle'),
      href: '/produk',
      image: '/lainnya-banner.webp',
    },
  ];

  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
        <div className="flex flex-col mb-10">
          <span className="text-[10px] lg:text-xs text-neutral-500 uppercase tracking-widest mb-2">{t('divingGrid.category')}</span>
          <h2 className="text-3xl lg:text-[44px] font-bold tracking-tighter mb-2">
            {t('divingGrid.headingPrefix')}{' '}
            <em
              is="highlighted-text"
              className="highlighted-text not-italic relative inline-block animated"
              data-style="scribble"
            >
              <span className="relative z-10">{t('divingGrid.headingHighlight')}</span>
              <svg
                className="icon icon-squiggle-underline absolute -bottom-1 lg:-bottom-2 left-0 w-full"
                viewBox="-347 -30.1947 694 96.19"
                stroke="#93c5fd"
                fill="none"
                role="presentation"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeWidth={24}
                  pathLength={1}
                  d="M-335,35 C-280,35 -250,70 -200,25 C-150,-20 -120,60 -60,30 C0,0 50,55 120,35 C190,15 250,45 335,20"
                />
              </svg>
            </em>
          </h2>
          <p className="text-sm lg:text-base max-w-md">{t('divingGrid.description')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-3">
          {divingTypeTiles.map((type) => (
            <Link
              key={type.title}
              href={type.href}
              className="group relative min-h-[320px] lg:min-h-[360px] bg-neutral-900 rounded flex items-end p-6 lg:p-8 overflow-hidden"
            >
              <Image
                src={type.image}
                alt={type.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
              <div className="relative z-10">
                <h3 className="text-xl lg:text-2xl font-semibold tracking-tight text-white">
                  {type.title}
                </h3>
                <p className="text-xs lg:text-sm text-white/70">{type.subtitle}</p>
                              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

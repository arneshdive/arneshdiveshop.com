import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Icon } from '@iconify/react';
import { Link, getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchResults } from '@/components/search/search-results';
import { RecentlyViewed } from '@/components/product/recently-viewed';
import { valueProps } from '@/lib/data/mock-products';
import { searchProductsWithFacets, formatProductForStorefront } from '@/lib/queries/products';
import { siteConfig } from '@/config/site';
import { JsonLd } from '@/components/seo/json-ld';
import { getBlogPostForFilter } from '@/lib/queries/blog';

const PAGE_SIZE = 24;

// Mirrors lib/db/schema.ts's divingTypeEnum — used to guard the `filters.*`
// message lookup below since t() throws on an unknown key and divingType is
// arbitrary user/search-engine-supplied input.
const DIVING_TYPES = ['freediving', 'scuba', 'spearfishing', 'surfing', 'swimming'] as const;
type DivingTypeFilterKey = (typeof DIVING_TYPES)[number];
function isDivingTypeFilterKey(value: string): value is DivingTypeFilterKey {
  return (DIVING_TYPES as readonly string[]).includes(value);
}

interface ProdukPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    divingType?: string;
    newArrival?: string;
    onSale?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ searchParams, params }: ProdukPageProps): Promise<Metadata> {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const t = await getTranslations({ locale, namespace: 'produk' });
  const label = (slug: string) =>
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  let title = t('meta.allCatalogTitle');
  let description: string = t('meta.defaultCatalogDescription');
  const divingTypeDescription =
    searchParamsResolved.divingType && isDivingTypeFilterKey(searchParamsResolved.divingType)
      ? t(`filters.${searchParamsResolved.divingType}`)
      : undefined;

  if (searchParamsResolved.q) {
    title = t('meta.searchResultsTitle', { query: searchParamsResolved.q });
    description = t('meta.searchResultsDescription');
  } else if (searchParamsResolved.newArrival === 'true') {
    title = t('meta.newArrivalsTitle');
    description = t('filters.newArrival');
  } else if (searchParamsResolved.onSale === 'true') {
    title = t('meta.saleTitle');
    description = t('filters.onSale');
  } else if (searchParamsResolved.divingType) {
    title = t('meta.divingTypeTitle', { label: label(searchParamsResolved.divingType) });
    description = divingTypeDescription ?? t('meta.divingTypeDescription', { label: label(searchParamsResolved.divingType) });
  } else if (searchParamsResolved.category) {
    title = label(searchParamsResolved.category);
    description = t('meta.categoryDescription', { label: label(searchParamsResolved.category) });
  } else if (searchParamsResolved.brand) {
    title = label(searchParamsResolved.brand);
    description = t('meta.brandDescription', { label: label(searchParamsResolved.brand) });
  }

  // Canonicalize to the filter identity (category/brand/divingType/newArrival/onSale/q) —
  // sort, page and price-range are presentation-only and shouldn't fragment the
  // canonical URL across many near-duplicate combinations.
  const canonicalParams = new URLSearchParams();
  if (searchParamsResolved.q) canonicalParams.set('q', searchParamsResolved.q);
  if (searchParamsResolved.category) canonicalParams.set('category', searchParamsResolved.category);
  if (searchParamsResolved.brand) canonicalParams.set('brand', searchParamsResolved.brand);
  if (searchParamsResolved.divingType) canonicalParams.set('divingType', searchParamsResolved.divingType);
  if (searchParamsResolved.newArrival) canonicalParams.set('newArrival', searchParamsResolved.newArrival);
  if (searchParamsResolved.onSale) canonicalParams.set('onSale', searchParamsResolved.onSale);
  const query = canonicalParams.toString();
  // next-intl's getPathname appends a bare "?" whenever `query` is present in
  // the href, even for an empty object — so only pass it through when there's
  // actually something to serialize, to keep the canonical/hreflang URLs clean
  // for the (very common) unfiltered /produk case.
  const canonicalHref = query
    ? { pathname: '/produk' as const, query: Object.fromEntries(canonicalParams) }
    : '/produk';
  const canonical = `${siteConfig.url}${getPathname({ href: canonicalHref, locale })}`;

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${siteConfig.url}${getPathname({ href: canonicalHref, locale: loc })}`;
  }
  languages['x-default'] = `${siteConfig.url}/produk${query ? `?${query}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

// Get banner config based on filters. `t` is the 'produk' namespace
// translator, threaded in rather than called here since this isn't itself a
// component/request-scoped function — its caller already resolved it.
function getBannerConfig(
  t: Awaited<ReturnType<typeof getTranslations>>,
  query: string,
  category: any | null,
  brand: any | null,
  divingType: string | undefined,
  isNewArrival: boolean | undefined,
  isOnSale: boolean | undefined
): { title: string; description: string; gradient: string; icon?: string } {
  if (isNewArrival) {
    return {
      title: query ? t('banner.newArrivalsWithQuery', { query }) : t('meta.newArrivalsTitle'),
      description: t('filters.newArrival'),
      gradient: 'from-emerald-600 to-emerald-500',
      icon: 'solar:star-bold',
    };
  }

  if (isOnSale) {
    return {
      title: query ? t('banner.saleWithQuery', { query }) : t('meta.saleTitle'),
      description: t('filters.onSale'),
      gradient: 'from-red-600 to-red-500',
      icon: 'solar:tag-bold',
    };
  }

  if (divingType === 'freediving') {
    return {
      title: query ? t('banner.freedivingWithQuery', { query }) : t('banner.freedivingTitle'),
      description: t('filters.freediving'),
      gradient: 'from-blue-600 to-blue-500',
      icon: 'solar:swimming-bold',
    };
  }

  if (divingType === 'scuba') {
    return {
      title: query ? t('banner.scubaWithQuery', { query }) : t('banner.scubaTitle'),
      description: t('filters.scuba'),
      gradient: 'from-teal-600 to-teal-500',
      icon: 'solar:swimming-bold',
    };
  }

  if (divingType === 'spearfishing') {
    return {
      title: query ? t('banner.spearfishingWithQuery', { query }) : t('banner.spearfishingTitle'),
      description: t('filters.spearfishing'),
      gradient: 'from-cyan-600 to-cyan-500',
      icon: 'solar:swimming-bold',
    };
  }

  if (divingType === 'surfing') {
    return {
      title: query ? t('banner.surfingWithQuery', { query }) : t('banner.surfingTitle'),
      description: t('filters.surfing'),
      gradient: 'from-sky-600 to-sky-500',
    };
  }

  if (divingType === 'swimming') {
    return {
      title: query ? t('banner.swimmingWithQuery', { query }) : t('banner.swimmingTitle'),
      description: t('filters.swimming'),
      gradient: 'from-indigo-600 to-indigo-500',
      icon: 'solar:swimming-bold',
    };
  }

  if (category) {
    return {
      title: query ? t('banner.categoryWithQuery', { name: category.name, query }) : category.name,
      description: category.description || t('banner.categoryDefaultDescription'),
      gradient: 'from-blue-600 to-blue-500',
    };
  }

  if (brand) {
    return {
      title: query ? t('banner.brandWithQuery', { name: brand.name, query }) : brand.name,
      description: brand.description || t('banner.brandDefaultDescription'),
      gradient: 'from-teal-600 to-teal-500',
    };
  }

  // No category or brand - show search results or all products
  if (query) {
    return {
      title: t('meta.searchResultsTitle', { query }),
      description: t('meta.searchResultsDescription'),
      gradient: 'from-neutral-700 to-neutral-500',
      icon: 'solar:magnifer-bold',
    };
  }

  // All products
  return {
    title: t('meta.allCatalogTitle'),
    description: t('meta.defaultCatalogDescription'),
    gradient: 'from-neutral-700 to-neutral-500',
    icon: 'solar:box-bold',
  };
}

// Turns a plain, unprefixed path (with an optional raw query string) into the
// URL for a given locale — used for the JSON-LD breadcrumb `item` URLs, which
// go out as bare strings rather than through <Link>.
function localizeHref(href: string, locale: string) {
  const [pathname = '/', query] = href.split('?');
  return getPathname({
    href: query ? { pathname, query: Object.fromEntries(new URLSearchParams(query)) } : pathname,
    locale,
  });
}

export default async function ProdukPage({ searchParams }: ProdukPageProps) {
  const params = await searchParams;
  const t = await getTranslations('produk');
  const tValueProps = await getTranslations('common.valueProps');
  const locale = await getLocale();
  const query = params.q || '';
  const sortBy = params.sort || 'newest';
  const categoryFilter = params.category || undefined;
  const brandFilter = params.brand || undefined;
  const divingTypeFilter = params.divingType || undefined;
  const newArrivalFilter = params.newArrival || undefined;
  const onSaleFilter = params.onSale || undefined;
  const minPrice = params.minPrice || undefined;
  const maxPrice = params.maxPrice || undefined;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);

  // Fetch search results directly (Server Component — no HTTP round-trip)
  const { products: rawProducts, total, categories, brands, categoryDistribution, brandDistribution } =
    await searchProductsWithFacets({
      search: query || undefined,
      category: categoryFilter,
      brand: brandFilter,
      divingType: divingTypeFilter,
      isNewArrival: newArrivalFilter === 'true' ? true : undefined,
      isOnSale: onSaleFilter === 'true' ? true : undefined,
      minPrice: minPrice ? parseInt(minPrice, 10) * 100 : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) * 100 : undefined,
      sort: sortBy,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    });

  const products = rawProducts.map(formatProductForStorefront);

  // Find selected category and brand for banner
  const selectedCategory = categoryFilter
    ? categories.find((c: any) => c.id === categoryFilter || c.slug === categoryFilter)
    : null;
  const selectedBrand = brandFilter
    ? brands.find((b: any) => b.id === brandFilter || b.slug === brandFilter)
    : null;

  const matchingPost = await getBlogPostForFilter(selectedCategory?.slug, divingTypeFilter);

  // Get banner config
  const banner = getBannerConfig(
    t,
    query,
    selectedCategory,
    selectedBrand,
    divingTypeFilter,
    newArrivalFilter === 'true',
    onSaleFilter === 'true'
  );

  // Build breadcrumb
  const breadcrumb = [
    { label: t('breadcrumb.home'), href: '/' },
    ...(selectedCategory ? [{ label: selectedCategory.name, href: `/produk?category=${selectedCategory.slug}` }] : []),
    ...(selectedBrand && !selectedCategory ? [{ label: selectedBrand.name, href: `/produk?brand=${selectedBrand.slug}` }] : []),
    ...(query ? [{ label: `"${query}"`, href: `/produk?q=${query}` }] : []),
  ];

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumb.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.label.replace(/^"|"$/g, ''),
            item: `${siteConfig.url}${localizeHref(item.href, locale)}`,
          })),
        }}
      />

      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 pt-4 text-xs text-neutral-500">
        {breadcrumb.map((item, i) => (
          <span key={item.href}>
            {i > 0 && ' / '}
            {i === breadcrumb.length - 1 ? (
              <span className="text-neutral-900">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-neutral-900">
                {item.label}
              </Link>
            )}
          </span>
        ))}
      </div>

      {/* Banner */}
      <section className={`bg-gradient-to-r ${banner.gradient} text-white py-12 lg:py-16 px-4 lg:px-12 mt-4 transition-all duration-300`}>
        <div className="max-w-[1440px] mx-auto flex items-center gap-4">
          {banner.icon && (
            <div className="hidden lg:flex w-16 h-16 rounded-2xl bg-white/20 items-center justify-center">
              <Icon icon={banner.icon} className="w-8 h-8" />
            </div>
          )}
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold tracking-tight mb-2">{banner.title}</h1>
            <p className="text-white/80 max-w-xl">{banner.description}</p>
            {matchingPost && (
              <Link
                href={`/blog/${matchingPost.slug}`}
                className="inline-flex items-center gap-1 mt-3 text-sm text-white/90 underline underline-offset-2 hover:text-white"
              >
                {t('banner.readJournal', { title: matchingPost.title })}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <SearchFilters
            categories={categories}
            brands={brands}
            categoryDistribution={categoryDistribution}
            brandDistribution={brandDistribution}
            selectedCategory={categoryFilter}
            selectedBrand={brandFilter}
            selectedDivingType={divingTypeFilter}
            minPrice={minPrice}
            maxPrice={maxPrice}
            query={query}
            totalResults={total}
          />
          <SearchResults products={products} total={total} sortBy={sortBy} page={page} pageSize={PAGE_SIZE} />
        </div>
      </div>

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* USP / Value Props - overlaps the footer below it */}
      <section className="relative z-10 bg-white rounded-b-[2.5rem] shadow-[0_30px_50px_-35px_rgba(0,0,0,0.35)] -mb-16 lg:-mb-20 py-14 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
            {valueProps.map((prop) => (
              <div key={prop.key} className="text-center px-6 py-6 sm:py-0">
                <Icon icon={prop.icon} className="w-8 h-8 mx-auto mb-4 text-neutral-800" />
                <h4 className="font-semibold text-base mb-1.5">{tValueProps(`${prop.key}.title`)}</h4>
                <p className="text-xs lg:text-sm text-neutral-500 max-w-[220px] mx-auto">{tValueProps(`${prop.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

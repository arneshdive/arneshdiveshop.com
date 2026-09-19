import { redirect } from '@/i18n/navigation';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    priceMin?: string;
    priceMax?: string;
    sort?: string;
  }>;
  params: Promise<{ locale: string }>;
}

// `/search` is a legacy route kept only for old links/bookmarks — the
// real, DB-backed search experience lives at `/produk`.
export default async function SearchPage({ searchParams, params }: SearchPageProps) {
  const [resolvedSearchParams, { locale }] = await Promise.all([searchParams, params]);

  const query: Record<string, string> = {};
  if (resolvedSearchParams.q) query.q = resolvedSearchParams.q;
  if (resolvedSearchParams.priceMin) query.minPrice = resolvedSearchParams.priceMin;
  if (resolvedSearchParams.priceMax) query.maxPrice = resolvedSearchParams.priceMax;
  if (resolvedSearchParams.sort) query.sort = resolvedSearchParams.sort;

  redirect({ href: { pathname: '/produk', query }, locale });
}

import { redirect } from 'next/navigation';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    priceMin?: string;
    priceMax?: string;
    sort?: string;
  }>;
}

// `/search` is a legacy route kept only for old links/bookmarks — the
// real, DB-backed search experience lives at `/produk`.
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  const target = new URLSearchParams();
  if (params.q) target.set('q', params.q);
  if (params.priceMin) target.set('minPrice', params.priceMin);
  if (params.priceMax) target.set('maxPrice', params.priceMax);
  if (params.sort) target.set('sort', params.sort);

  const queryString = target.toString();
  redirect(`/produk${queryString ? `?${queryString}` : ''}`);
}

import { ProductsPage } from '@/components/admin/products-page-content';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  return <ProductsPage initialCategory={params.category || ''} />;
}

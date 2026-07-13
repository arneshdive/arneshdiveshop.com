import Link from 'next/link';
import type { Metadata } from 'next';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductCard } from '@/components/product/product-card';
import { ProductInfo } from '@/components/product/product-info';
import { USPSection } from '@/components/layout/usp-section';
import { TrackProductView } from '@/components/product/track-product-view';
import { RecentlyViewed } from '@/components/product/recently-viewed';
import { getProductBySlug, getRelatedProducts } from '@/lib/queries/products';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Produk tidak ditemukan' };
  }

  const description = product.description
    ? product.description.slice(0, 160)
    : `Beli ${product.name} di Arne's Dive Shop.`;
  const image = product.images?.[0];

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  // Fetch product by slug
  const product = await getProductBySlug(slug);
  
  // If no product found, show error
  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Produk tidak ditemukan</h1>
          <Link href="/produk" className="text-neutral-600 hover:text-neutral-900">
            Kembali ke katalog
          </Link>
        </div>
      </div>
    );
  }
  
  // Prepare variants for the client component
  const variants = (product.variants || []).map(v => ({
    id: v.id,
    name: v.name,
    options: v.options,
    priceCents: v.priceCents,
    isActive: v.isActive,
  }));
  
  // Prepare product data for ProductInfo
  const productData = {
    id: product.id,
    name: product.name,
    description: product.description,
    sku: product.sku,
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    isActive: product.isActive,
    category: product.category,
    brand: product.brand,
    divingTypes: product.divingTypes,
  };
  
  // Fetch related products
  const relatedProducts = await getRelatedProducts(
    product.id, 
    product.categoryId, 
    product.brandId
  );
  
  // Format related products for ProductCard
  const formattedRelatedProducts = relatedProducts.map(p => ({
    id: p.id,
    handle: p.slug,
    title: p.name,
    vendor: p.brand?.name,
    price: new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format((p.priceCents || 0) / 100),
    badge: p.isOnSale ? 'Sale' : p.isNewArrival ? 'Baru' : undefined,
    image: (p.images as string[] | undefined)?.[0] || '/placeholder-product.jpg',
    secondaryImage: (p.images as string[] | undefined)?.[1] || (p.images as string[] | undefined)?.[0] || '/placeholder-product.jpg',
  }));

  return (
    <>
      {/* Breadcrumbs */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-4">
        <nav className="text-xs text-neutral-600">
          <Link href="/" className="hover:text-neutral-900 transition-colors">Beranda</Link>
          <span className="mx-2">/</span>
          <Link href="/produk" className="hover:text-neutral-900 transition-colors">Produk</Link>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/kategori/${product.category.slug}`} className="hover:text-neutral-900 transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-neutral-900 font-medium">{product.name}</span>
        </nav>
      </div>

      {/* Product Main */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-12 lg:pb-16">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="w-full lg:w-3/5">
            <ProductGallery images={product.images || []} productTitle={product.name} />
          </div>

          {/* Product Info */}
          <div className="w-full lg:w-2/5">
            <ProductInfo product={productData} variants={variants} />
          </div>
        </div>
      </section>

      {/* Track this product view */}
      <TrackProductView product={product} variants={variants} />

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* Related Products */}
      <section className="py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="mb-8">
            <span className="text-[10px] lg:text-xs text-neutral-600 uppercase tracking-widest font-medium mb-2 block">
              Related Products
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tighter">
              Produk Terkait
            </h2>
          </div>

          {formattedRelatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {formattedRelatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          ) : (
            <p className="text-neutral-500">Tidak ada produk terkait.</p>
          )}
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* Recently Viewed */}
      <RecentlyViewed currentProductId={product.id} />

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* USP / Value Props - overlaps the footer */}
      <section className="relative z-10 -mb-16 lg:-mb-20">
        <USPSection />
      </section>
    </>
  );
}

import Link from 'next/link';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductCard } from '@/components/product/product-card';
import { ProductInfo } from '@/components/product/product-info';
import { USPSection } from '@/components/layout/usp-section';
import { getProductBySlug } from '@/lib/queries/products';

const relatedProducts = [
  {
    id: '2',
    handle: 'masker-low-volume',
    title: 'Masker Low Volume',
    vendor: 'Arnes',
    price: 'Rp 650.000',
    badge: 'Sale',
    image: '/product-sample-1.webp',
    secondaryImage: '/product-sample-2.webp',
  },
  {
    id: '3',
    handle: 'snorkel-dry-top',
    title: 'Snorkel Dry Top',
    vendor: 'Arnes',
    price: 'Rp 280.000',
    image: '/product-sample-1.webp',
    secondaryImage: '/product-sample-2.webp',
  },
  {
    id: '4',
    handle: 'fin-carbon-pro',
    title: 'Fin Carbon Pro',
    vendor: 'Arnes',
    price: 'Rp 2.500.000',
    badge: 'Baru',
    image: '/product-sample-1.webp',
    secondaryImage: '/product-sample-2.webp',
  },
  {
    id: '5',
    handle: 'wetsuit-3mm-premium',
    title: 'Wetsuit 3mm Premium',
    vendor: 'Arnes',
    price: 'Rp 1.800.000',
    image: '/product-sample-1.webp',
    secondaryImage: '/product-sample-2.webp',
  },
];

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
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

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* Related Products */}
      <section className="py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="mb-10">
            <span className="text-[10px] lg:text-xs text-neutral-600 uppercase tracking-widest font-medium mb-2 block">
              Related Products
            </span>
            <h2 className="text-3xl lg:text-[44px] font-bold tracking-tighter">
              Produk Terkait
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

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

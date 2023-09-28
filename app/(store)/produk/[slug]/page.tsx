import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ProductGallery } from '@/components/product-gallery';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ProductCard } from '@/components/product-card';

// Mock data - will be replaced with real data fetching
const mockProduct = {
  id: '1',
  handle: 'masker-freediving-pro',
  title: 'Masker Freediving Pro',
  category: 'Freediving',
  vendor: 'Arnes',
  price: 'Rp 850.000',
  compareAtPrice: undefined,
  description: 'Masker freediving profesional dengan volume rendah untuk penglihatan maksimal di bawah air. Lensa tempered glass dan skirt silicone premium untuk kenyamanan. Cocok untuk freediving dan snorkeling.',
  specifications: {
    'Volume': '110ml',
    'Lensa': 'Tempered Glass',
    'Skirt': 'Silicone Premium',
    'Warna': 'Hitam, Biru, Clear',
    'Garansi': '1 Tahun',
  },
  images: [
    '/product-sample-1.webp',
    '/product-sample-2.webp',
    '/product-sample-1.webp',
    '/product-sample-2.webp',
  ],
  variants: [
    {
      name: 'Warna',
      options: [
        { label: 'Hitam', value: 'hitam' },
        { label: 'Biru', value: 'biru' },
        { label: 'Clear', value: 'clear' },
      ],
    },
  ],
  stock: 15,
  badge: 'Baru',
};

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
  const { slug: _slug } = await params;
  // TODO: Fetch product by slug
  const product = mockProduct;

  return (
    <>
      {/* Breadcrumbs */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-4">
        <nav className="text-xs text-neutral-600">
          <Link href="/" className="hover:text-neutral-900 transition-colors">Beranda</Link>
          <span className="mx-2">/</span>
          <Link href="/freediving" className="hover:text-neutral-900 transition-colors">Freediving</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900 font-medium">{product.title}</span>
        </nav>
      </div>

      {/* Product Main */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-12 lg:pb-16">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="w-full lg:w-3/5">
            <ProductGallery images={product.images} productTitle={product.title} />
          </div>

          {/* Product Info */}
          <div className="w-full lg:w-2/5">
            <div className="lg:sticky lg:top-24">
              {/* Category Badge */}
              <span className="inline-block bg-neutral-900 text-white text-[10px] uppercase tracking-widest px-3 py-1 mb-4">
                {product.category}
              </span>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter mb-3">
                {product.title}
              </h1>

              {/* Price */}
              <p className="text-xl lg:text-2xl font-semibold mb-4">
                {product.compareAtPrice ? (
                  <>
                    <span className="text-red-500">{product.price}</span>{' '}
                    <s className="text-neutral-400 font-normal">{product.compareAtPrice}</s>
                  </>
                ) : (
                  product.price
                )}
              </p>

              {/* Variant Selection */}
              {product.variants?.[0] && (
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-widest text-neutral-600 font-medium mb-3">
                    {product.variants[0].name}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.variants[0].options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className="min-w-[48px] h-12 px-4 rounded-md border border-neutral-300 text-sm font-medium hover:border-neutral-900 transition-colors"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <p className="text-xs uppercase tracking-widest text-neutral-600 font-medium mb-3">Jumlah</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="w-12 h-12 border border-neutral-300 rounded-md text-lg hover:border-neutral-900 transition-colors flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-medium">1</span>
                  <button
                    type="button"
                    className="w-12 h-12 border border-neutral-300 rounded-md text-lg hover:border-neutral-900 transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Stock Status */}
              <p className="text-sm text-green-600 mb-6 flex items-center gap-2">
                <Icon icon="solar:check-circle-linear" className="w-4 h-4" />
                Stok tersedia ({product.stock} unit)
              </p>

              {/* Actions */}
              <div className="flex gap-3 mb-8">
                <AnimatedButton className="flex-1" variant="default">
                  Tambah ke Keranjang
                </AnimatedButton>
                <button
                  type="button"
                  className="w-12 h-12 border border-neutral-300 rounded-md hover:border-neutral-900 transition-colors flex items-center justify-center"
                  aria-label="Tambah ke Wishlist"
                >
                  <Icon icon="solar:heart-linear" className="w-5 h-5" />
                </button>
              </div>

              {/* Accordion */}
              <Accordion>
                <AccordionItem title="Deskripsi" defaultOpen>
                  <p className="leading-relaxed">{product.description}</p>
                </AccordionItem>
                <AccordionItem title="Spesifikasi">
                  <table className="w-full">
                    <tbody>
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <tr key={key}>
                          <td className="py-1.5 text-neutral-500 w-1/3">{key}</td>
                          <td className="py-1.5">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </AccordionItem>
                <AccordionItem title="Pengiriman">
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Icon icon="solar:check-circle-linear" className="w-4 h-4 text-green-600 mt-0.5" />
                      Gratis ongkir untuk pembelian di atas Rp 500.000
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon icon="solar:check-circle-linear" className="w-4 h-4 text-green-600 mt-0.5" />
                      Pengiriman 1-3 hari kerja (Jabodetabek)
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon icon="solar:check-circle-linear" className="w-4 h-4 text-green-600 mt-0.5" />
                      Pengiriman 3-7 hari kerja (Luar Jabodetabek)
                    </li>
                  </ul>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-12 lg:py-16 bg-neutral-50">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-[10px] lg:text-xs text-neutral-600 uppercase tracking-widest font-medium mb-2 block">
                Related Products
              </span>
              <h2 className="text-3xl lg:text-[44px] font-bold tracking-tighter">
                Produk Terkait
              </h2>
            </div>
            <AnimatedButton asChild variant="outline" className="hidden sm:flex text-sm font-medium px-6 py-3">
              <Link href="/freediving" className="inline-flex items-center gap-2.5">
                Lihat Semua
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </Link>
            </AnimatedButton>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

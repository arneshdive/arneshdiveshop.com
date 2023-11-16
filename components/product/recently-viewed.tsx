import { ProductCard } from '@/components/product/product-card';
import { featuredProducts } from '@/lib/data/mock-products';

export function RecentlyViewed() {
  const products = featuredProducts.slice(0, 4);

  return (
    <section className="py-12 lg:py-16 bg-white border-t border-neutral-100">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
        <div className="flex flex-col mb-10">
          <span className="text-[10px] lg:text-xs text-neutral-500 uppercase tracking-widest mb-2">
            Riwayat
          </span>
          <h2 className="text-3xl lg:text-[44px] font-bold tracking-tighter mb-2">
            Baru{' '}
            <em
              is="highlighted-text"
              className="highlighted-text not-italic relative inline-block animated"
              data-style="scribble"
            >
              <span className="relative z-10">Dilihat</span>
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
          <p className="text-sm lg:text-base max-w-md">
            Lanjutkan dari produk yang baru saja Anda lihat.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

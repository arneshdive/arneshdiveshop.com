'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ProductCard } from '@/components/product-card';
import { AnimatedButton } from '@/components/ui/animated-button';

export default function HomePage() {
  const categories = [
    { name: 'Masker', href: '/freediving?kategori=masker', icon: 'solar:swimming-linear' },
    { name: 'Fin', href: '/freediving?kategori=fin', icon: 'solar:fin-linear' },
    { name: 'Wetsuit', href: '/freediving?kategori=wetsuit', icon: 'solar:t-shirt-linear' },
    { name: 'Sabuk', href: '/freediving?kategori=sabuk', icon: 'solar:belt-linear' },
    { name: 'Aksesoris', href: '/aksesoris', icon: 'solar:box-linear' },
  ];

  const featuredProducts = [
    {
      id: '1',
      handle: 'masker-freediving-pro',
      title: 'Masker Freediving Pro',
      vendor: 'Arnes',
      price: 'Rp 850.000',
      badge: 'Baru',
      image: '/product-sample-1.webp',
      secondaryImage: '/product-sample-2.webp',
    },
    {
      id: '2',
      handle: 'fin-carbon-pro',
      title: 'Fin Carbon Pro',
      vendor: 'Arnes',
      price: 'Rp 2.500.000',
      badge: 'Baru',
      image: '/product-sample-1.webp',
      secondaryImage: '/product-sample-2.webp',
    },
    {
      id: '3',
      handle: 'wetsuit-3mm-premium',
      title: 'Wetsuit 3mm Premium',
      vendor: 'Arnes',
      price: 'Rp 1.800.000',
      image: '/product-sample-1.webp',
      secondaryImage: '/product-sample-2.webp',
    },
    {
      id: '4',
      handle: 'snorkel-dry-top',
      title: 'Snorkel Dry Top',
      vendor: 'Arnes',
      price: 'Rp 250.000',
      compareAtPrice: 'Rp 320.000',
      badge: 'Sale',
      image: '/product-sample-1.webp',
      secondaryImage: '/product-sample-2.webp',
    },
    {
      id: '5',
      handle: 'sabuk-timah-premium',
      title: 'Sabuk Timah Premium',
      vendor: 'Arnes',
      price: 'Rp 350.000',
      image: '/product-sample-1.webp',
      secondaryImage: '/product-sample-2.webp',
    },
    {
      id: '6',
      handle: 'gloves-2mm',
      title: 'Gloves 2mm',
      vendor: 'Arnes',
      price: 'Rp 280.000',
      image: '/product-sample-1.webp',
      secondaryImage: '/product-sample-2.webp',
    },
    {
      id: '7',
      handle: 'fin-socks-3mm',
      title: 'Fin Socks 3mm',
      vendor: 'Arnes',
      price: 'Rp 200.000',
      badge: 'Baru',
      image: '/product-sample-1.webp',
      secondaryImage: '/product-sample-2.webp',
    },
    {
      id: '8',
      handle: 'masker-low-volume',
      title: 'Masker Low Volume',
      vendor: 'Arnes',
      price: 'Rp 650.000',
      compareAtPrice: 'Rp 750.000',
      badge: 'Sale',
      image: '/product-sample-1.webp',
      secondaryImage: '/product-sample-2.webp',
    },
    {
      id: '9',
      handle: 'wetsuit-5mm',
      title: 'Wetsuit 5mm Pro',
      vendor: 'Arnes',
      price: 'Rp 2.200.000',
      image: '/product-sample-1.webp',
      secondaryImage: '/product-sample-2.webp',
    },
    {
      id: '10',
      handle: 'fin-fiberglass',
      title: 'Fin Fiberglass',
      vendor: 'Arnes',
      price: 'Rp 1.900.000',
      badge: 'Best Seller',
      image: '/product-sample-1.webp',
      secondaryImage: '/product-sample-2.webp',
    },
    {
      id: '11',
      handle: 'dive-computer',
      title: 'Dive Computer',
      vendor: 'Arnes',
      price: 'Rp 3.500.000',
      image: '/product-sample-1.webp',
      secondaryImage: '/product-sample-2.webp',
    },
    {
      id: '12',
      handle: 'underwater-camera',
      title: 'Underwater Camera',
      vendor: 'Arnes',
      price: 'Rp 4.200.000',
      badge: 'Baru',
      image: '/product-sample-1.webp',
      secondaryImage: '/product-sample-2.webp',
    },
  ];

  const valueProps = [
    { icon: 'solar:delivery-linear', title: 'Gratis Ongkir', desc: 'Pembelian di atas Rp 500.000' },
    { icon: 'solar:verified-check-linear', title: 'Produk Original', desc: '100% kualitas terjamin' },
    { icon: 'solar:refresh-linear', title: 'Easy Return', desc: '14 hari pengembalian' },
    { icon: 'solar:chat-round-dots-linear', title: 'Support 24/7', desc: 'Siap membantu' },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[650px] lg:min-h-[740px] mb-20">
        {/* Background Image - full width */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-image.webp"
            alt="Freediving"
            className="w-full h-full object-cover"
          />
          {/* Overlay for text readability */}

        </div>

        {/* Content */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 min-h-[650px] lg:min-h-[740px] items-center gap-8 lg:gap-12">
            <div className="py-12 lg:py-0">
              <span className="inline-block text-xs uppercase tracking-widest text-white/70 mb-4">
                Freediving & Scuba
              </span>
              <h1 className="text-4xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tighter">
                Berjelajah di kedalaman
              </h1>
              <p className="text-white/80 text-lg mb-8 max-w-md leading-relaxed">
                Temukan perlengkapan freediving yang Anda butuhkan.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/freediving"
                  className="border border-white/50 text-white px-8 py-4 text-sm uppercase tracking-wider hover:bg-white/10 transition-colors"
                >
                  Lihat Koleksi
                </Link>
              </div>
            </div>
            <div className="hidden lg:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {/* <section className="py-12 border-b border-neutral-200"> */}
      {/*   <div className="max-w-[1440px] mx-auto px-6 lg:px-12"> */}
      {/*     <div className="flex justify-center gap-4 lg:gap-8 overflow-x-auto pb-2"> */}
      {/*       {categories.map((category) => ( */}
      {/*         <Link */}
      {/*           key={category.name} */}
      {/*           href={category.href} */}
      {/*           className="flex flex-col items-center gap-3 flex-shrink-0 group" */}
      {/*         > */}
      {/*           <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors"> */}
      {/*             <Icon icon={category.icon} className="w-6 h-6 lg:w-7 lg:h-7 text-neutral-600" /> */}
      {/*           </div> */}
      {/*           <span className="text-sm font-medium text-neutral-700 whitespace-nowrap">{category.name}</span> */}
      {/*         </Link> */}
      {/*       ))} */}
      {/*     </div> */}
      {/*   </div> */}
      {/* </section> */}

      {/* Latest Products */}
      <section className="py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-end mb-10">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Latest Products</span>
              <h2 className="text-2xl lg:text-4xl font-bold tracking-tighter mb-2">Produk Terbaru</h2>
              <p className="text-neutral-500 text-sm lg:text-base max-w-md">Peralatan diving berkualitas untuk petualangan bawah laut.</p>
            </div>
            <AnimatedButton asChild variant="outline" className="hidden sm:flex text-sm font-medium px-6 py-3">
              <Link 
                href="/freediving"
                className="inline-flex items-center gap-2.5"
              >
                Lihat Semua
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </Link>
            </AnimatedButton>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 lg:gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-10 sm:hidden">
            <AnimatedButton asChild variant="outline" className="text-sm font-medium px-6 py-3">
              <Link href="/freediving" className="inline-flex items-center gap-2.5">
                Lihat Semua
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </Link>
            </AnimatedButton>
          </div>
        </div>
      </section>

      {/* Split Banner */}
      <section className="grid md:grid-cols-2 my-20">
        <div className="relative min-h-[550px] lg:min-h-[650px] bg-neutral-200 flex items-end p-8 lg:p-12">
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-widest text-neutral-500 mb-2 block">Freediving</span>
            <h3 className="text-2xl lg:text-3xl font-semibold mb-4">Koleksi Freediving</h3>
            <Link 
              href="/freediving" 
              className="inline-flex items-center gap-2 bg-white px-6 py-3 text-sm uppercase tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Lihat Koleksi
              <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="relative min-h-[550px] lg:min-h-[650px] bg-neutral-300 flex items-end p-8 lg:p-12">
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-widest text-neutral-600 mb-2 block">Scuba</span>
            <h3 className="text-2xl lg:text-3xl font-semibold mb-4">Koleksi Scuba</h3>
            <Link 
              href="/scuba" 
              className="inline-flex items-center gap-2 bg-white px-6 py-3 text-sm uppercase tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Lihat Koleksi
              <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Sale */}
      <section className="py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-end mb-10">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Sale</span>
              <h2 className="text-2xl lg:text-4xl font-bold tracking-tighter mb-2">Promo Spesial</h2>
              <p className="text-neutral-500 text-sm lg:text-base max-w-md">Masker dan kacamata renang untuk visibilitas optimal.</p>
            </div>
            <AnimatedButton asChild variant="outline" className="hidden sm:flex text-sm font-medium px-6 py-3">
              <Link 
                href="/sale"
                className="inline-flex items-center gap-2.5"
              >
                Lihat Semua
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </Link>
            </AnimatedButton>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 lg:gap-6">
            {featuredProducts.filter(p => p.badge === 'Sale').map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-10 sm:hidden">
            <AnimatedButton asChild variant="outline" className="text-sm font-medium px-6 py-3">
              <Link href="/sale" className="inline-flex items-center gap-2.5">
                Lihat Semua
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </Link>
            </AnimatedButton>
          </div>
        </div>
      </section>

      {/* All Products */}
      <section className="py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
          <div className="flex justify-between items-end mb-10">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Semua Produk</span>
              <h2 className="text-2xl lg:text-4xl font-bold tracking-tighter mb-2">Eksplor <em is="highlighted-text" className="highlighted-text not-italic relative inline-block animated" data-style="scribble"><span className="relative z-10">Lainnya</span><svg className="icon icon-squiggle-underline absolute -bottom-1 lg:-bottom-3 left-0 w-full" viewBox="-347 -30.1947 694 96.19" stroke="#93c5fd" fill="none" role="presentation" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeWidth={24} pathLength={1} d="M-335,35 C-280,35 -250,70 -200,25 C-150,-20 -120,60 -60,30 C0,0 50,55 120,35 C190,15 250,45 335,20"></path>
    </svg></em></h2>
              <p className="text-neutral-500 text-sm lg:text-base max-w-md">Temukan perlengkapan diving untuk kebutuhan Anda.</p>
            </div>
            <AnimatedButton asChild variant="outline" className="hidden sm:flex text-sm font-medium px-6 py-3">
              <Link 
                href="/freediving"
                className="inline-flex items-center gap-2.5"
              >
                Lihat Semua
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </Link>
            </AnimatedButton>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-10 sm:hidden">
            <AnimatedButton asChild variant="outline" className="text-sm font-medium px-6 py-3">
              <Link href="/freediving" className="inline-flex items-center gap-2.5">
                Lihat Semua
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </Link>
            </AnimatedButton>
          </div>
        </div>
      </section>

      {/* Community - Instagram Feed */}
      <section className="py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col justify-between items-end mb-8">
            <div className="flex flex-col w-full items-center justify-center max-w-3xl mx-auto text-center">
              
              <span className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Passion, Freedom, Performance</span>
      <h2 className="text-2xl lg:text-6xl tracking-tighter font-bold mb-3">Visit Our Feed</h2>
              <p className="text-lg font-semibold tracking-tight mb-6">Flowers & Saints is an Australian streetwear brand built on purpose, not trends.</p>
            <p className="text-lg tracking-tight">Inspired by real moments and real people, these looks reflect modern Australian apparel — understated, confident, and designed to last.</p>
            </div>
            <a
              href="https://www.instagram.com/arnesh.official"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 text-sm hover:text-neutral-600 transition-colors hidden sm:flex items-center gap-1"
            >
              @arnesh.official
              <Icon icon="solar:arrow-right-up-linear" className="w-4 h-4" />
            </a>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { image: '/instagram-1.jpg', url: 'https://www.instagram.com/p/DZhCEvySGyy/' },
              { image: '/instagram-2.jpg', url: 'https://www.instagram.com/p/DZ48gW2EhBO/' },
              { image: '/instagram-3.jpg', url: 'https://www.instagram.com/p/DaMfDOxyy6v/' },
              { image: '/instagram-4.jpg', url: 'https://www.instagram.com/p/DZ_3EsyS7CZ/' },
            ].map((post, index) => (
              <a
                key={index}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-[4/6] bg-neutral-100 rounded-lg overflow-hidden group relative"
              >
                <img
                  src={post.image}
                  alt="Instagram post"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <Icon icon="mdi:instagram" className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-neutral-100 py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {valueProps.map((prop) => (
              <div key={prop.title} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Icon icon={prop.icon} className="w-8 h-8 text-neutral-700" />
                </div>
                <h4 className="font-semibold text-sm mb-1">{prop.title}</h4>
                <p className="text-xs text-neutral-500">{prop.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

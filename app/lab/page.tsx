import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { getProducts } from '@/lib/queries/products';
import { computeProductPriceDisplay } from '@/lib/utils/product-pricing';
import { productImageUrl } from '@/lib/utils/product-image';
import { LabHeader } from './_components/lab-header';
import { Marquee } from './_components/marquee';
import { EditorialProductCard } from './_components/editorial-product-card';
import { CapsuleCarousel } from './_components/capsule-carousel';
import type { LabProduct } from './_components/types';

type ProductRow = Awaited<ReturnType<typeof getProducts>>[number];

function toLabProduct(p: ProductRow): LabProduct {
  const priceInfo = computeProductPriceDisplay({
    priceCents: p.priceCents,
    compareAtPriceCents: p.compareAtPriceCents ?? null,
    variants: (p.variants ?? []).map((v) => ({
      isActive: v.isActive,
      priceCents: v.priceCents,
    })),
  });

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand?.name,
    price: priceInfo.priceDisplay,
    compareAtPrice: priceInfo.compareAtPriceDisplay,
    image: productImageUrl(p.images?.[0], 'medium'),
    badge: p.isOnSale ? 'Promo' : p.isNewArrival ? 'Baru' : undefined,
  };
}

function ProductRail({
  kicker,
  title,
  note,
  href,
  products,
}: {
  kicker: string;
  title: string;
  note: string;
  href: string;
  products: LabProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="px-5 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="mb-2 text-[9.5px] font-semibold uppercase tracking-[0.32em] text-[#111110]/40">
              {kicker}
            </p>
            <h2 className="text-[clamp(1.9rem,4.5vw,3.5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.03em]">
              {title}
              <span className="ml-3 font-editorial text-[0.5em] font-normal normal-case italic tracking-normal text-[#111110]/50">
                — {note}
              </span>
            </h2>
          </div>
          <Link
            href={href}
            className="text-[11px] font-semibold uppercase tracking-[0.22em] underline-offset-4 hover:underline"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {products.map((product) => (
            <EditorialProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function LabHomePage() {
  const [newArrivalsRaw, onSaleRaw, latestRaw] = await Promise.all([
    getProducts({ isActive: true, isNewArrival: true, limit: 8 }),
    getProducts({ isActive: true, isOnSale: true, limit: 4 }),
    getProducts({ isActive: true, limit: 12 }),
  ]);

  const newArrivals = newArrivalsRaw.map(toLabProduct);
  const onSale = onSaleRaw.map(toLabProduct);
  const latest = latestRaw.map(toLabProduct);

  const carouselProducts = (newArrivals.length >= 3 ? newArrivals : latest).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[100svh] overflow-hidden bg-[#0C1116] text-[#F5F4F0]">
        <LabHeader />

        <Image
          src="/lab/hero-freediver.jpg"
          alt=""
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[60%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,10,14,0.72)_0%,rgba(6,10,14,0.35)_45%,rgba(6,10,14,0.05)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#060A0E]/70 to-transparent" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-center px-5 pb-24 pt-40 sm:px-10 lg:px-16">
          <span className="mb-7 text-[10.5px] font-semibold uppercase tracking-[0.34em] text-[#F5F4F0]/65">
            Freediving · Spearfishing · Scuba
          </span>

          <h1 className="max-w-[16ch] font-extrabold uppercase leading-[0.86] tracking-[-0.035em] text-[clamp(3rem,10vw,9rem)]">
            Selam lebih dalam,{' '}
            <span className="relative inline-block">
              lebih bebas
              <span className="absolute -right-4 -top-8 rotate-[-7deg] font-script text-[#FFD23F] text-[clamp(1.6rem,4.5vw,3rem)] sm:-right-20 sm:top-1">
                koleksi baru
              </span>
            </span>
          </h1>

          <div className="mt-12 flex flex-wrap items-center gap-6">
            <Link
              href="/produk"
              className="rounded-full bg-[#F5F4F0] px-9 py-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#111110] transition-colors hover:bg-white"
            >
              Belanja Sekarang
            </Link>
            <Link href="/lab" className="flex items-center gap-3 text-[13px] font-medium">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F5F4F0]/45">
                <Icon icon="solar:play-bold" className="h-4 w-4" />
              </span>
              <span className="leading-tight">
                Lihat
                <br />
                cerita kami
              </span>
            </Link>
          </div>
        </div>
      </section>

      <Marquee
        items={[
          'Dibuat untuk kedalaman',
          'Baru saja rilis',
          'Musim 2026',
          'Kurasi lokal',
          'Teruji di laut',
        ]}
      />

      {/* Statement */}
      <section className="px-5 py-28 sm:px-10 lg:px-16">
        <h2 className="max-w-[22ch] font-extrabold uppercase leading-[0.92] tracking-[-0.03em] text-[clamp(2.25rem,6.5vw,6rem)]">
          Perlengkapan pilihan untuk setiap penyelaman.{' '}
          <Link
            href="/lab"
            className="font-editorial text-[0.52em] font-normal normal-case italic tracking-normal underline decoration-1 underline-offset-[0.15em]"
          >
            Baca cerita kami
          </Link>{' '}
          <span className="font-editorial text-[0.46em] font-normal normal-case not-italic tracking-normal text-[#111110]/45">
            dan
          </span>{' '}
          <Link
            href="/produk"
            className="font-editorial text-[0.52em] font-normal normal-case italic tracking-normal underline decoration-1 underline-offset-[0.15em]"
          >
            kenali kurasinya
          </Link>
        </h2>
      </section>

      {/* Editorial split */}
      <section className="grid gap-1 sm:grid-cols-2">
        {[
          {
            label: 'Freediving',
            copy: 'Tenang di bawah, bebas di dalam.',
            href: '/produk?divingType=freediving',
            image: '/lab/reef.jpg',
          },
          {
            label: 'Scuba',
            copy: 'Lebih dalam, lebih lama bertahan.',
            href: '/produk?divingType=scuba',
            image: '/lab/scuba.jpg',
          },
        ].map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="group relative flex min-h-[78vh] items-end overflow-hidden bg-[#0C1116] p-8 text-[#F5F4F0] sm:p-14"
          >
            <Image
              src={tile.image}
              alt={tile.label}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(6,10,14,0.82)_0%,rgba(6,10,14,0.15)_45%,transparent_75%)]" />
            <div className="relative">
              <h3 className="font-extrabold uppercase leading-[0.85] tracking-[-0.03em] text-[clamp(2.5rem,6vw,4.5rem)]">
                {tile.label}
              </h3>
              <p className="mt-3 font-editorial text-lg italic text-[#F5F4F0]/80">{tile.copy}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
                Lihat Koleksi
                <Icon icon="solar:arrow-right-linear" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <ProductRail
        kicker="New Arrivals"
        title="Produk Terbaru"
        note="ekstra hemat di keranjang"
        href="/produk?newArrival=true"
        products={newArrivals}
      />

      {carouselProducts.length >= 2 && <CapsuleCarousel products={carouselProducts} />}

      {/* Full-bleed break */}
      <section className="relative flex min-h-[62vh] items-center justify-center overflow-hidden bg-[#0C1116] text-center text-[#F5F4F0]">
        <Image
          src="/lab/wave-dusk.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-[#060A0E]/35" />
        <p className="relative max-w-[20ch] px-6 font-editorial text-[clamp(1.75rem,4vw,3.25rem)] italic leading-tight">
          Setiap penyelaman adalah cerita baru.
        </p>
      </section>

      <ProductRail
        kicker="Sale"
        title="Sedang Promo"
        note="selagi masih ada"
        href="/produk?onSale=true"
        products={onSale}
      />

      <Marquee
        theme="ink"
        separator="✳"
        items={['Didesain untuk bergerak', 'Dibuat untuk bertahan', 'Teruji di kedalaman']}
      />

      {/* Seasonal drop grid */}
      <section className="px-5 py-24 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-[1600px] gap-1 sm:grid-cols-3">
          <div className="flex min-h-[440px] flex-col justify-between bg-[#E9E7E0] p-9">
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.32em] text-[#111110]/40">
                Seasonal Drop
              </p>
              <h3 className="mt-4 font-editorial text-[44px] italic leading-[0.95]">
                Musim
                <br />
                Kering
              </h3>
              <p className="mt-4 max-w-[24ch] text-[13px] leading-relaxed text-[#111110]/60">
                Wetsuit tipis, fin panjang, dan perlengkapan permukaan untuk air hangat.
              </p>
            </div>
            <Link
              href="/produk"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#111110] px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F5F4F0]"
            >
              Belanja Sekarang
            </Link>
          </div>

          {[
            { src: '/lab/surf-barrel.jpg', label: 'Surfing' },
            { src: '/lab/shark.jpg', label: 'Spearfishing' },
          ].map((tile) => (
            <Link
              key={tile.src}
              href="/produk"
              className="group relative min-h-[440px] overflow-hidden bg-[#0C1116]"
            >
              <Image
                src={tile.src}
                alt={tile.label}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(6,10,14,0.6),transparent_55%)]" />
              <span className="absolute bottom-7 left-7 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#F5F4F0]">
                {tile.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <ProductRail
        kicker="Semua Produk"
        title="Eksplor Lainnya"
        note="untuk setiap kebutuhan"
        href="/produk"
        products={latest.slice(0, 8)}
      />

      {/* Footer */}
      <footer className="border-t border-[#111110]/12 px-5 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold uppercase tracking-[-0.02em]">Arnesh</span>
              <span className="font-editorial text-3xl italic text-[#111110]/70">dive</span>
            </div>
            <p className="mt-3 max-w-xs font-editorial text-lg italic text-[#111110]/55">
              Perlengkapan menyelam untuk penyelam Indonesia.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
            <Link href="/produk" className="hover:underline">Katalog</Link>
            <Link href="/produk?onSale=true" className="hover:underline">Promo</Link>
            <Link href="/kontak" className="hover:underline">Kontak</Link>
            <Link href="/faq" className="hover:underline">Bantuan</Link>
            <Link href="/" className="hover:underline">Situs utama</Link>
          </div>
        </div>
        <p className="mx-auto mt-14 max-w-[1600px] text-[10px] uppercase tracking-[0.24em] text-[#111110]/35">
          Eksperimen desain · bukan halaman produksi
        </p>
      </footer>
    </>
  );
}

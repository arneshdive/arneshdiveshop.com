import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link, getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductCard } from '@/components/product/product-card';
import { ProductInfo } from '@/components/product/product-info';
import { USPSection } from '@/components/layout/usp-section';
import { TrackProductView } from '@/components/product/track-product-view';
import { RecentlyViewed } from '@/components/product/recently-viewed';
import { JsonLd } from '@/components/seo/json-ld';
import { getProductBySlug, getRelatedProducts } from '@/lib/queries/products';
import { computeProductPriceDisplay } from '@/lib/utils/product-pricing';
import { siteConfig } from '@/config/site';

export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const product = await getProductBySlug(slug);
  const t = await getTranslations({ locale, namespace: 'produk' });

  if (!product) {
    return { title: t('pdp.notFound') };
  }

  // Many DB descriptions are short one-liners — pad them with category/brand
  // context instead of just truncating, so the meta description clears the
  // ~70-char floor SEO tools flag as "too short" rather than shipping raw.
  const rawDescription = product.description?.trim();
  const description =
    rawDescription && rawDescription.length >= 70
      ? rawDescription.slice(0, 160)
      : `${rawDescription ? `${rawDescription} — ` : ''}${t('pdp.metaDescriptionPadding', {
          name: product.name,
          category: product.category ? ` (${product.category.name})` : '',
        })}`.slice(0, 160);
  const image = product.images?.[0];
  const canonical = `${siteConfig.url}${getPathname({ href: `/produk/${slug}`, locale })}`;
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${siteConfig.url}${getPathname({ href: `/produk/${slug}`, locale: loc })}`;
  }
  languages['x-default'] = `${siteConfig.url}/produk/${slug}`;

  return {
    title: product.name,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: product.name,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type: 'website',
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
  const t = await getTranslations('produk');
  const locale = await getLocale();

  // Fetch product by slug
  const product = await getProductBySlug(slug);

  // If no product found, show error
  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">{t('pdp.notFound')}</h1>
          <Link href="/produk" className="text-neutral-600 hover:text-neutral-900">
            {t('pdp.backToCatalog')}
          </Link>
        </div>
      </div>
    );
  }
  
  // Prepare variants for the client component
  const variants = (product.variants || []).map((v: any) => ({
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

  // Admin-controlled display order for variant dimensions and values
  const variantOptions = (product.variantOptions ?? []).map((o: any) => ({
    name: o.name,
    values: o.values,
  }));
  
  // Fetch related products
  const relatedProducts = await getRelatedProducts(
    product.id, 
    product.categoryId, 
    product.brandId
  );
  
  // Format related products for ProductCard
  const formattedRelatedProducts = relatedProducts.map((p: any) => {
    const priceInfo = computeProductPriceDisplay({
      priceCents: p.priceCents,
      compareAtPriceCents: p.compareAtPriceCents ?? null,
      variants: (p.variants || []).map((v: any) => ({
        isActive: v.isActive,
        priceCents: v.priceCents,
      })),
    });

    return {
      id: p.id,
      handle: p.slug,
      title: p.name,
      vendor: p.brand?.name,
      price: priceInfo.priceDisplay,
      compareAtPrice: priceInfo.compareAtPriceDisplay,
      badge: p.isOnSale ? t('pdp.badgeSale') : p.isNewArrival ? t('pdp.badgeNew') : undefined,
      image: (p.images as string[] | undefined)?.[0],
      secondaryImage: (p.images as string[] | undefined)?.[1],
      variantId: (p.variants || []).find((v: any) => v.isActive)?.id,
    };
  });

  const productUrl = `${siteConfig.url}${getPathname({ href: `/produk/${product.slug}`, locale })}`;
  const priceInfo = computeProductPriceDisplay({
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents ?? null,
    variants: variants.map((v: any) => ({ isActive: v.isActive, priceCents: v.priceCents })),
  });
  const availability = product.isActive
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';
  // Variant pricing means there's no single price — use an AggregateOffer
  // over the min/max instead of a single (and potentially wrong) Offer.
  const offers =
    priceInfo.priceRangeMin !== undefined && priceInfo.priceRangeMin !== priceInfo.priceRangeMax
      ? {
          '@type': 'AggregateOffer',
          url: productUrl,
          priceCurrency: 'IDR',
          lowPrice: (priceInfo.priceRangeMin / 100).toFixed(2),
          highPrice: (priceInfo.priceRangeMax! / 100).toFixed(2),
          offerCount: variants.length,
          availability,
        }
      : {
          '@type': 'Offer',
          url: productUrl,
          priceCurrency: 'IDR',
          price: ((priceInfo.priceRangeMin ?? product.priceCents) / 100).toFixed(2),
          availability,
        };
  const breadcrumbItems = [
    { name: t('breadcrumb.home'), url: `${siteConfig.url}${getPathname({ href: '/', locale })}` },
    { name: t('pdp.breadcrumbProduk'), url: `${siteConfig.url}${getPathname({ href: '/produk', locale })}` },
    ...(product.category
      ? [{
          name: product.category.name,
          url: `${siteConfig.url}${getPathname({ href: { pathname: '/produk', query: { category: product.category.slug } }, locale })}`,
        }]
      : []),
    { name: product.name, url: productUrl },
  ];

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description ?? undefined,
          image: product.images ?? undefined,
          sku: product.sku ?? undefined,
          brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
          url: productUrl,
          offers,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbItems.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        }}
      />

      {/* Breadcrumbs */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-4">
        <nav className="text-xs text-neutral-600">
          <Link href="/" className="hover:text-neutral-900 transition-colors">{t('breadcrumb.home')}</Link>
          <span className="mx-2">/</span>
          <Link href="/produk" className="hover:text-neutral-900 transition-colors">{t('pdp.breadcrumbProduk')}</Link>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/produk?category=${product.category.slug}`} className="hover:text-neutral-900 transition-colors">
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
            <ProductInfo key={product.id} product={productData} variants={variants} variantOptions={variantOptions} />
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
              {t('pdp.relatedProductsLabel')}
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tighter">
              {t('pdp.relatedProductsTitle')}
            </h2>
          </div>

          {formattedRelatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {formattedRelatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          ) : (
            <p className="text-neutral-500">{t('pdp.relatedProductsEmpty')}</p>
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

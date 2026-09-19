'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@iconify/react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { useCartStore } from '@/lib/store/cart';
import { ProductBadge, type BadgeType } from '@/components/ui/product-badge';
import { productImageUrl } from '@/lib/utils/product-image';
import { track } from '@/lib/analytics/track';

interface ProductCardProps {
  product: {
    id: string;
    handle: string;
    title: string;
    vendor?: string;
    price: string;
    priceRangeMin?: number;
    priceRangeMax?: number;
    compareAtPrice?: string;
    badges?: string[];
    image?: string;
    secondaryImage?: string;
    swatches?: { name: string; handle: string; image: string }[];
    // First active variant's id, when the product has variants (mirrors the
    // PDP's own default-selection behavior). Variant-priced products store
    // priceCents=0 on the base product, so omitting this would silently add
    // a Rp 0 item.
    variantId?: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations('product');
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  /**
   * Both slides live in the DOM at once, so lazy loading never deferred the
   * hover image: every visible card fetched two 800px files. This holds the
   * second one back until the pointer reaches the card.
   *
   * It is deliberately sticky and deliberately triggered on the whole card,
   * not just the image link: the slide itself is driven by `group-hover` on
   * the card root, so anything narrower would leave the panel empty while the
   * animation ran. Once revealed the image stays mounted, so only the very
   * first hover can race the 500ms transition.
   */
  const [secondaryRevealed, setSecondaryRevealed] = useState(false);
  const revealSecondary = () => setSecondaryRevealed(true);

  // Keyed by URL so a failure on one slide leaves the other alone, and
  // functional because both slides can fail within the same tick.
  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]));
  };

  const primarySource = product.image;
  const primary = primarySource && !failedImages.has(primarySource)
    ? productImageUrl(primarySource, 'medium')
    : undefined;

  const secondarySource = product.secondaryImage || product.image;
  const secondary = secondarySource && !failedImages.has(secondarySource)
    ? productImageUrl(secondarySource, 'medium')
    : undefined;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setAdded(true);

    // Use product ID (+ resolved variant, if any) - the cart store will handle API call for logged-in users
    const result = await addItem(product.id, product.variantId);

    if (result.success) {
      track('add_to_cart', { productId: product.id, title: product.title });
      toast.success(t('addedToast'), {
        action: {
          label: t('viewCartAction'),
          onClick: () => window.location.href = '/cart',
        },
      });
      setTimeout(() => setAdded(false), 2000);
    } else {
      setAdded(false);
      toast.error(t('addToCartErrorToast'), {
        description: result.error || t('addToCartErrorDescription'),
      });
    }
  };

  return (
    <div
      className="product-card flex flex-col leading-none relative group bg-neutral-50 rounded-lg"
      onMouseEnter={revealSecondary}
      onFocus={revealSecondary}
    >
      {/* Media Section */}
      <div className="product-card__media relative rounded-t-lg overflow-hidden">
        {/* Badge */}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
            {product.badges.map((badge) => {
              const normalized = badge.toLowerCase();
              const badgeType: BadgeType = normalized === 'sale' ? 'sale' : 'new';
              // 'new'/'sale' are the stable keys this app writes (see
              // track-product-view.tsx); anything else is already-localized
              // text from elsewhere (e.g. the query layer) and passes through.
              const label =
                normalized === 'sale' ? t('badgeSale') : normalized === 'new' ? t('badgeNew') : badge;
              return (
                <ProductBadge key={badge} type={badgeType} context="card">
                  {label}
                </ProductBadge>
              );
            })}
          </div>
        )}

        {/* Product Image Link */}
        <Link
          href={`/produk/${product.handle}`}
          className="block relative aspect-square overflow-hidden"
          aria-label={product.title}
        >
          {/* Image Slider Container */}
          <div className="flex w-[200%] h-full transition-transform duration-500 ease-out group-hover:-translate-x-1/2">
            {/* Primary Image */}
            <div className="w-1/2 h-full relative flex-shrink-0">
              {primary ? (
                <Image
                  src={primary}
                  alt={product.title}
                  fill
                  className="object-cover mix-blend-multiply"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  onError={() => handleImageError(primarySource!)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                  <Icon icon="solar:box-linear" className="w-8 h-8 text-neutral-300" />
                </div>
              )}
            </div>

            {/* Secondary Image */}
            <div className="w-1/2 h-full relative flex-shrink-0">
              {secondary ? (
                secondaryRevealed && (
                  <Image
                    src={secondary}
                    alt={t('alternateViewAlt', { title: product.title })}
                    fill
                    className="object-cover mix-blend-multiply"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    onError={() => handleImageError(secondarySource!)}
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                  <Icon icon="solar:box-linear" className="w-8 h-8 text-neutral-300" />
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Quick Add Button - Always visible on mobile, hover on desktop */}
        <div className="quick-add flex justify-center absolute bottom-0 left-0 right-0 z-10 pointer-events-none px-3 pb-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={added}
            className={`pointer-events-auto text-sm lg:text-base w-fit px-4 lg:px-6 py-2 font-medium rounded-md transition-all duration-300 flex items-center gap-1.5 ${
              added
                ? 'bg-green-500 text-white'
                : 'bg-neutral-900 text-white hover:bg-neutral-800 translate-y-[180%] group-hover:translate-y-[-8px] sm:translate-y-[180%] sm:group-hover:translate-y-[-8px] translate-y-0 sm:translate-y-[180%]'
            }`}
          >
            {added ? (
              <>
                <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                {t('added')}
              </>
            ) : (
              t('addShort')
            )}
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="product-card__content grow flex flex-col justify-start text-center w-full px-4 py-6">
        {/* Brand */}
        {product.vendor && (
          <Link
            href={`/produk?brand=${product.vendor.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-neutral-700 transition-colors leading-none mb-2"
          >
            {product.vendor}
          </Link>
        )}

        {/* Product details link */}
        <Link href={`/produk/${product.handle}`} className="block">
          <p className="text-base lg:text-lg font-medium tracking-tight leading-tight text-neutral-900 line-clamp-2 mb-2">
            {product.title}
          </p>

          <div className="flex flex-col items-center gap-0.5">
            {/* Show "Mulai dari" for products with variants (different min/max prices) */}
            {product.priceRangeMin !== undefined &&
             product.priceRangeMax !== undefined &&
             product.priceRangeMin !== product.priceRangeMax && (
              <span className="text-[10px] text-neutral-500 uppercase tracking-wide">{t('startingFrom')}</span>
            )}
            <div className="flex justify-center gap-2">
              {product.compareAtPrice ? (
                <p className="text-sm whitespace-nowrap">
                  <span className="text-red-500">{product.price}</span>{' '}
                  <s className="text-neutral-400">{product.compareAtPrice}</s>
                </p>
              ) : (
                <span className="text-sm text-neutral-700 whitespace-nowrap">{product.price}</span>
              )}
            </div>
          </div>
        </Link>

        {/* Color Swatches */}
        {product.swatches && product.swatches.length > 0 && (
          <div className="product-card__bottom flex items-center justify-center gap-2 mt-3">
            <ul className="inline-flex items-start gap-2">
              {product.swatches.map((swatch) => (
                <li key={swatch.handle}>
                  <Link
                    href={`/produk/${swatch.handle}`}
                    className="color-swatch block relative w-6 h-6 rounded-full overflow-hidden ring-1 ring-neutral-200 hover:ring-neutral-400 transition-all"
                    title={swatch.name}
                    aria-label={swatch.name}
                    style={{
                      // A CSS background gets no lazy loading, so at 24px this
                      // has to resolve to the thumbnail rather than the 2000px
                      // main file.
                      backgroundImage: swatch.image
                        ? `url(${productImageUrl(swatch.image, 'thumb')})`
                        : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

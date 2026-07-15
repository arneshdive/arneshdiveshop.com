'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useCartStore } from '@/lib/store/cart';
import { ProductBadge, type BadgeType } from '@/components/ui/product-badge';

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
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setAdded(true);

    // Use product ID (+ resolved variant, if any) - the cart store will handle API call for logged-in users
    const result = await addItem(product.id, product.variantId);

    if (result.success) {
      toast.success('Ditambahkan', {
        action: {
          label: 'Lihat',
          onClick: () => window.location.href = '/cart',
        },
      });
      setTimeout(() => setAdded(false), 2000);
    } else {
      setAdded(false);
      toast.error('Gagal menambahkan item', {
        description: result.error || 'Terjadi kesalahan, silakan coba lagi.',
      });
    }
  };

  return (
    <div className="product-card flex flex-col leading-none relative group bg-neutral-50 rounded-lg">
      {/* Media Section */}
      <div className="product-card__media relative rounded-t-lg overflow-hidden">
        {/* Badge */}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
            {product.badges.map((badge) => {
              const badgeType: BadgeType = badge.toLowerCase() === 'sale' ? 'sale' : 'new';
              return (
                <ProductBadge key={badge} type={badgeType} context="card">
                  {badge}
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
              <Image
                src={product.image || '/placeholder-product.jpg'}
                alt={product.title}
                fill
                className="object-cover mix-blend-multiply"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            
            {/* Secondary Image */}
            <div className="w-1/2 h-full relative flex-shrink-0">
              <Image
                src={product.secondaryImage || product.image || '/placeholder-product.jpg'}
                alt={`${product.title} - alternate view`}
                fill
                className="object-cover mix-blend-multiply"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
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
                Ditambahkan
              </>
            ) : (
              'Tambahkan'
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

        {/* Product Name */}
        <p className="text-base lg:text-lg font-medium tracking-tight leading-tight text-neutral-900 line-clamp-2 mb-2">
          {product.title}
        </p>

        {/* Price */}
        <div className="flex flex-col items-center gap-0.5">
          {/* Show "Mulai dari" for products with variants (different min/max prices) */}
          {product.priceRangeMin !== undefined && 
           product.priceRangeMax !== undefined && 
           product.priceRangeMin !== product.priceRangeMax && (
            <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Mulai dari</span>
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
                      backgroundImage: `url(${swatch.image})`,
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

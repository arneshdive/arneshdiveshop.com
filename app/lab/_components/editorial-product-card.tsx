import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import type { LabProduct } from './types';

export function EditorialProductCard({ product }: { product: LabProduct }) {
  return (
    <Link href={`/produk/${product.slug}`} className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#E9E7E0]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 24vw"
            className="object-cover mix-blend-multiply transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon icon="solar:box-linear" className="h-7 w-7 text-[#111110]/20" />
          </div>
        )}

        {product.badge && (
          <span className="absolute left-0 top-4 bg-[#111110] px-3 py-1 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-[#F5F4F0]">
            {product.badge}
          </span>
        )}
      </div>

      <div className="mt-3.5 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          {product.brand && (
            <p className="text-[9.5px] uppercase tracking-[0.24em] text-[#111110]/45">
              {product.brand}
            </p>
          )}
          <p className="mt-1 truncate text-[13.5px] tracking-tight">{product.name}</p>
        </div>
        <p className="shrink-0 whitespace-nowrap text-[12.5px] font-semibold tabular-nums">
          {product.compareAtPrice ? (
            <>
              <span>{product.price}</span>{' '}
              <s className="font-normal text-[#111110]/35">{product.compareAtPrice}</s>
            </>
          ) : (
            product.price
          )}
        </p>
      </div>
    </Link>
  );
}

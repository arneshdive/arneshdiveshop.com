import { Icon } from '@iconify/react';
import type { VariantOption } from '@/lib/hooks/use-product-form';
import { formatCurrencyInput } from '@/lib/utils/format';

interface ProductPreviewProps {
  name: string;
  price: string;
  salePrice: string;
  category: string;
  brand: string;
  description: string;
  isActive: boolean;
  stockStatus: 'in_stock' | 'out_of_stock';
  images: string[];
  variantOptions: VariantOption[];
}

export function ProductPreview({
  name,
  price,
  salePrice,
  brand,
  description,
  isActive,
  stockStatus,
  variantOptions,
}: ProductPreviewProps) {
  const formatPrice = (val: string) => (val ? `Rp ${formatCurrencyInput(val)}` : 'Rp 0');

  const hasVariants = variantOptions.length > 0 && variantOptions.some(opt => opt.name && opt.values.some(v => v));

  return (
    <div>
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Preview</h3>
        </div>

        <div className="p-4">
          {/* Image Gallery */}
          <div className="aspect-square bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-900 relative overflow-hidden mb-3">
            <Icon icon="solar:gallery-minimalistic-linear" className="w-10 h-10" />
            {!isActive && (
              <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] uppercase tracking-wider bg-neutral-200 text-neutral-600 rounded">
                Nonaktif
              </span>
            )}
            {salePrice && (
              <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] uppercase tracking-wider bg-red-500 text-white rounded">
                Sale
              </span>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded flex-shrink-0 flex items-center justify-center text-neutral-900 text-[10px] ${
                  i === 1 ? 'border border-neutral-900' : 'border border-neutral-200'
                }`}
              >
                {i}
              </div>
            ))}
          </div>

          {/* Vendor */}
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">
            {brand || 'Merek'}
          </p>

          {/* Title */}
          <h1 className="text-lg font-bold tracking-tight text-neutral-900 mb-2">
            {name || 'Nama Produk'}
          </h1>

          {/* Price */}
          <p className="text-base font-semibold tracking-tight mb-4">
            {salePrice ? (
              <>
                <span className="text-red-500">{formatPrice(price)}</span>{' '}
                <s className="text-neutral-400 font-normal text-sm">{formatPrice(salePrice)}</s>
              </>
            ) : (
              formatPrice(price)
            )}
          </p>

          {/* Variant Selection */}
          {hasVariants && (
            <div className="mb-4">
              {variantOptions.map((option) => (
                option.name && option.values.some(v => v) && (
                  <div key={option.id}>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-medium mb-2">
                      {option.name}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {option.values.filter(v => v).map((value, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="min-w-[40px] h-10 px-3 rounded-md border border-neutral-300 text-xs font-medium hover:border-neutral-900 transition-colors"
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Stock Status */}
          <p className={`text-xs flex items-center gap-1.5 mb-4 ${stockStatus === 'in_stock' ? 'text-green-600' : 'text-red-500'}`}>
            <Icon icon={stockStatus === 'in_stock' ? 'solar:check-circle-linear' : 'solar:close-circle-linear'} className="w-4 h-4" />
            {stockStatus === 'in_stock' ? 'Stok tersedia' : 'Stok habis'}
          </p>

          {/* Description Accordion */}
          <div className="border-t border-neutral-200">
            <details open className="border-b border-neutral-200">
              <summary className="py-3 cursor-pointer text-xs font-medium flex justify-between items-center">
                Deskripsi
                <Icon icon="solar:alt-arrow-up-linear" className="w-4 h-4" />
              </summary>
              <p className="pb-3 text-neutral-600 text-xs leading-relaxed line-clamp-3">
                {description || 'Deskripsi produk akan muncul di sini...'}
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

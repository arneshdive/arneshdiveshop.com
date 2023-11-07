import { X } from 'lucide-react';
import type { VariantOption, Variant } from '@/lib/hooks/use-product-form';

interface VariantsSectionProps {
  hasVariants: boolean;
  setHasVariants: (value: boolean) => void;
  variantOptions: VariantOption[];
  generatedVariants: Variant[];
  addVariantOption: () => void;
  removeVariantOption: (index: number) => void;
  updateVariantOption: (index: number, field: 'name' | 'values', value: string | string[]) => void;
  addVariantValue: (optionIndex: number) => void;
  removeVariantValue: (optionIndex: number, valueIndex: number) => void;
}

export function VariantsSection({
  hasVariants,
  setHasVariants,
  variantOptions,
  generatedVariants,
  addVariantOption,
  removeVariantOption,
  updateVariantOption,
  addVariantValue,
  removeVariantValue,
}: VariantsSectionProps) {
  return (
    <div className="bg-white rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium tracking-tight text-neutral-900">Varian Produk</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasVariants}
            onChange={(e) => setHasVariants(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
          />
          <span className="text-sm text-neutral-700">Produk punya varian</span>
        </label>
      </div>

      {hasVariants && (
        <div className="space-y-6">
          <VariantOptions
            variantOptions={variantOptions}
            addVariantOption={addVariantOption}
            removeVariantOption={removeVariantOption}
            updateVariantOption={updateVariantOption}
            addVariantValue={addVariantValue}
            removeVariantValue={removeVariantValue}
          />

          {generatedVariants.length > 0 && (
            <VariantGrid variants={generatedVariants} />
          )}
        </div>
      )}
    </div>
  );
}

function VariantOptions({
  variantOptions,
  addVariantOption,
  removeVariantOption,
  updateVariantOption,
  addVariantValue,
  removeVariantValue,
}: Omit<VariantsSectionProps, 'hasVariants' | 'setHasVariants' | 'generatedVariants' | 'sku'>) {
  return (
    <div className="space-y-4">
      {variantOptions.map((option, optionIndex) => (
        <div key={option.id} className="p-4 bg-neutral-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              placeholder="Nama opsi (contoh: Warna, Ukuran)"
              value={option.name}
              onChange={(e) => updateVariantOption(optionIndex, 'name', e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900 transition-all"
            />
            <button
              type="button"
              onClick={() => removeVariantOption(optionIndex)}
              className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value, valueIndex) => (
              <div key={valueIndex} className="flex items-center">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    const values = [...option.values];
                    values[valueIndex] = e.target.value;
                    updateVariantOption(optionIndex, 'values', values);
                  }}
                  className="px-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-l-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900 transition-all w-20"
                />
                <button
                  type="button"
                  onClick={() => removeVariantValue(optionIndex, valueIndex)}
                  className="h-9 px-2 border border-l-0 border-neutral-200 text-neutral-400 hover:text-red-600 hover:border-red-300 rounded-r-lg transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addVariantValue(optionIndex)}
              className="h-9 px-3 text-sm border border-dashed border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 rounded-lg transition-colors"
            >
              + Tambah
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addVariantOption}
        className="w-full p-3 text-sm border border-dashed border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 rounded-lg transition-colors"
      >
        + Tambah Opsi Varian (Warna, Ukuran, dll)
      </button>
    </div>
  );
}

function VariantGrid({ variants }: { variants: Variant[] }) {
  return (
    <div>
      <label className="block text-xs text-neutral-500 mb-2">
        Harga & ketersediaan per varian
      </label>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="text-left p-3 font-medium">Varian</th>
              <th className="text-left p-3 font-medium">SKU</th>
              <th className="text-left p-3 font-medium">Harga (Rp) *</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {variants.map((variant) => (
              <tr key={variant.id}>
                <td className="p-3 text-neutral-900">{variant.name}</td>
                <td className="p-3">
                  <input
                    type="text"
                    defaultValue={variant.sku}
                    className="px-3 py-1.5 border border-neutral-200 rounded w-24 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900 transition-all"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    placeholder="850000"
                    className="px-3 py-1.5 border border-neutral-200 rounded w-28 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900 transition-all"
                    required
                  />
                </td>
                <td className="p-3">
                  <select
                    defaultValue={variant.stockStatus}
                    className="px-3 py-1.5 border border-neutral-200 rounded bg-white focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900 transition-all"
                  >
                    <option value="in_stock">Tersedia</option>
                    <option value="out_of_stock">Habis</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

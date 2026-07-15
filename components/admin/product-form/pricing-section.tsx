import { Input, CurrencyInput } from '@/components/admin/input';
import type { ProductFormData } from '@/lib/hooks/use-product-form';

interface PricingSectionProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  isOnSale: boolean;
}

export function PricingSection({ formData, setFormData, isOnSale }: PricingSectionProps) {
  return (
    <div className="bg-white rounded-xl p-6 space-y-4">
      <h2 className="text-base font-medium tracking-tight text-neutral-900">Harga & SKU</h2>

      <div className={`grid gap-4 ${isOnSale ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <Input
          label="SKU"
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          placeholder="MFP-001"
        />
        <CurrencyInput
          label="Harga *"
          value={formData.price}
          onChange={(val) => setFormData({ ...formData, price: val })}
          placeholder="850.000"
          required
        />
        {isOnSale && (
          <CurrencyInput
            label="Harga coret *"
            value={formData.compareAtPrice}
            onChange={(val) => setFormData({ ...formData, compareAtPrice: val })}
            placeholder="Harga sebelum diskon"
            required
          />
        )}
      </div>

      <p className="text-xs text-neutral-500">SKU wajib diisi untuk produk tanpa varian</p>
      {isOnSale && (
        <p className="text-xs text-neutral-500">
          &quot;Harga coret&quot; adalah harga asli sebelum diskon — akan ditampilkan tercoret di samping Harga. Harus lebih besar dari Harga.
        </p>
      )}
    </div>
  );
}

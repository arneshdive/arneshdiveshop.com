import { Input, CurrencyInput } from '@/components/admin/input';
import type { ProductFormData } from '@/lib/hooks/use-product-form';

interface PricingSectionProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

export function PricingSection({ formData, setFormData }: PricingSectionProps) {
  return (
    <div className="bg-white rounded-xl p-6 space-y-4">
      <h2 className="text-base font-medium tracking-tight text-neutral-900">Harga & SKU</h2>

      <div className="grid sm:grid-cols-3 gap-4">
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
        <CurrencyInput
          label="Harga sale"
          value={formData.salePrice}
          onChange={(val) => setFormData({ ...formData, salePrice: val })}
          placeholder="Kosongkan jika tidak ada"
        />
      </div>
      <p className="text-xs text-neutral-500">SKU wajib diisi untuk produk tanpa varian</p>
    </div>
  );
}

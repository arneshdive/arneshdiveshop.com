'use client';

import { Input, Textarea, NumberInput } from '@/components/admin/input';
import type { ProductFormData } from '@/lib/hooks/use-product-form';

interface BasicInfoSectionProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

export function BasicInfoSection({ formData, setFormData }: BasicInfoSectionProps) {
  return (
    <div className="bg-white rounded-xl p-6 space-y-4">
      <h2 className="text-base font-medium tracking-tight text-neutral-900">Informasi Dasar</h2>

      <Input
        label="Nama produk *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="contoh: Masker Freediving Pro"
        required
      />

      <Textarea
        label="Deskripsi"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Deskripsi produk..."
        rows={8}
      />

      {/* Status & Berat */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Status
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span className="text-sm text-neutral-700">Aktif</span>
          </label>
          <p className="text-xs text-neutral-500 mt-1">Status mengontrol visibilitas produk di toko</p>
        </div>
        <NumberInput
          label="Berat (gram)"
          value={formData.weightGrams}
          onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
          placeholder="500"
          min={1}
        />
      </div>
    </div>
  );
}

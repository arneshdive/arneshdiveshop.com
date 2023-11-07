import { Input, Textarea, Select, NumberInput } from '@/components/admin/input';
import { categories, brands, diveTypes } from '@/lib/constants/product-options';
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
        rows={3}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Kategori *"
          options={categories}
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
        />

        <Select
          label="Merek"
          options={brands}
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
        />

        <Select
          label="Tipe diving"
          options={diveTypes}
          value={formData.diveType}
          onChange={(e) => setFormData({ ...formData, diveType: e.target.value })}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <NumberInput
          label="Berat (gram)"
          value={formData.weight}
          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
          placeholder="500"
        />
        <Select
          label="Status"
          value={formData.isActive ? 'active' : 'inactive'}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
        >
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </Select>
      </div>
    </div>
  );
}

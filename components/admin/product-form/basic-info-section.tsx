'use client';

import { useState, useEffect } from 'react';
import { Input, Textarea, Select } from '@/components/admin/input';
import type { ProductFormData } from '@/lib/hooks/use-product-form';
import type { DivingType } from '@/lib/db/schema';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Brand = {
  id: string;
  name: string;
};

interface BasicInfoSectionProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

export function BasicInfoSection({ formData, setFormData }: BasicInfoSectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/brands'),
        ]);

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.categories || []);
        }

        if (brandsRes.ok) {
          const data = await brandsRes.json();
          setBrands(data.brands || []);
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Kategori *"
          options={categories}
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder={loading ? 'Memuat...' : 'Pilih kategori'}
          disabled={loading}
          required
        />

        <Select
          label="Merek"
          options={brands}
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          placeholder={loading ? 'Memuat...' : 'Pilih merek'}
          disabled={loading}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Select
          label="Status"
          value={formData.isActive ? 'active' : 'inactive'}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
        >
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </Select>
        <div className="flex items-end">
          <p className="text-xs text-neutral-500">Status mengontrol visibilitas produk di toko</p>
        </div>
      </div>

      {/* Diving Types */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Tipe Diving *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.divingTypes.includes('freediving')}
              onChange={(e) => {
                const types: DivingType[] = e.target.checked
                  ? [...formData.divingTypes.filter(t => t !== 'freediving'), 'freediving']
                  : formData.divingTypes.filter(t => t !== 'freediving');
                setFormData({ ...formData, divingTypes: types });
              }}
              className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span className="text-sm text-neutral-700">Freediving</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.divingTypes.includes('scuba')}
              onChange={(e) => {
                const types: DivingType[] = e.target.checked
                  ? [...formData.divingTypes.filter(t => t !== 'scuba'), 'scuba']
                  : formData.divingTypes.filter(t => t !== 'scuba');
                setFormData({ ...formData, divingTypes: types });
              }}
              className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span className="text-sm text-neutral-700">Scuba</span>
          </label>
        </div>
        {formData.divingTypes.length === 0 && (
          <p className="text-xs text-red-500 mt-1">Pilih minimal satu tipe diving</p>
        )}
      </div>

      {/* Product Flags */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Tampilan Homepage
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isNewArrival}
              onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span className="text-sm text-neutral-700">New Arrival</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isOnSale}
              onChange={(e) => setFormData({ ...formData, isOnSale: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span className="text-sm text-neutral-700">On Sale</span>
          </label>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Mengontrol badge &quot;Sale&quot; di toko — independen dari harga coret di bagian Harga &amp; SKU.
        </p>
      </div>
    </div>
  );
}

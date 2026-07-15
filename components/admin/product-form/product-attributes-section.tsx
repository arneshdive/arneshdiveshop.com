'use client';

import { useState, useEffect } from 'react';
import type { ProductFormData } from '@/lib/hooks/use-product-form';
import type { DivingType } from '@/lib/db/schema';
import { DIVING_TYPE_OPTIONS } from '@/lib/constants/diving-types';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Brand = {
  id: string;
  name: string;
};

interface ProductAttributesSectionProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

export function ProductAttributesSection({ formData, setFormData }: ProductAttributesSectionProps) {
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
      <h2 className="text-base font-medium tracking-tight text-neutral-900">Atribut Produk</h2>

      {/* Kategori */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Kategori<span className="text-red-500"> *</span>
        </label>
        {loading ? (
          <p className="text-sm text-neutral-500">Memuat...</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={formData.category === category.id}
                  onChange={() => setFormData({ ...formData, category: category.id })}
                  className="w-4 h-4 border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span className="text-sm text-neutral-700">{category.name}</span>
              </label>
            ))}
          </div>
        )}
        {categories.length === 0 && !loading && (
          <p className="text-xs text-red-500 mt-1">Tidak ada kategori tersedia</p>
        )}
      </div>

      {/* Merk */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Merek<span className="text-red-500"> *</span>
        </label>
        {loading ? (
          <p className="text-sm text-neutral-500">Memuat...</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {brands.map((brand) => (
              <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="brand"
                  checked={formData.brand === brand.id}
                  onChange={() => setFormData({ ...formData, brand: brand.id })}
                  className="w-4 h-4 border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span className="text-sm text-neutral-700">{brand.name}</span>
              </label>
            ))}
          </div>
        )}
        {brands.length === 0 && !loading && (
          <p className="text-xs text-red-500 mt-1">Tidak ada merek tersedia</p>
        )}
      </div>

      {/* Tipe Diving */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Tipe Diving<span className="text-red-500"> *</span>
        </label>
        <div className="flex flex-wrap gap-4">
          {DIVING_TYPE_OPTIONS.map((option) => (
            <label key={option.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.divingTypes.includes(option.id as DivingType)}
                onChange={(e) => {
                  const types: DivingType[] = e.target.checked
                    ? [...formData.divingTypes.filter(t => t !== option.id), option.id as DivingType]
                    : formData.divingTypes.filter(t => t !== option.id);
                  setFormData({ ...formData, divingTypes: types });
                }}
                className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              />
              <span className="text-sm text-neutral-700">{option.name}</span>
            </label>
          ))}
        </div>
        {formData.divingTypes.length === 0 && (
          <p className="text-xs text-red-500 mt-1">Pilih minimal satu tipe diving</p>
        )}
      </div>

      {/* Tampilan Homepage */}
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
          Mengontrol badge di homepage
        </p>
      </div>
    </div>
  );
}

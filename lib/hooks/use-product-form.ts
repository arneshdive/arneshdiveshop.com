'use client';

import { useState, useMemo, useCallback } from 'react';

export interface VariantOption {
  id: string;
  name: string;
  values: string[];
}

export interface Variant {
  id: string;
  name: string;
  sku: string;
  price: string;
  stockStatus: 'in_stock' | 'out_of_stock';
}

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  brand: string;
  diveType: string;
  price: string;
  salePrice: string;
  sku: string;
  weight: string;
  stockStatus: 'in_stock' | 'out_of_stock';
  isActive: boolean;
}

export function useProductForm() {
  const [images, setImages] = useState<string[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    brand: '',
    diveType: '',
    price: '',
    salePrice: '',
    sku: '',
    weight: '',
    stockStatus: 'in_stock',
    isActive: true,
  });

  const generatedVariants = useMemo(() => {
    if (!hasVariants || variantOptions.length === 0) return [];

    const getCombinations = (options: VariantOption[], index: number): string[][] => {
      if (index === options.length) return [[]];
      const currentValues = options[index]!.values.filter(v => v.trim());
      const restCombinations = getCombinations(options, index + 1);
      return currentValues.flatMap((value) =>
        restCombinations.map((rest) => [value, ...rest])
      );
    };

    const combinations = getCombinations(variantOptions, 0);
    return combinations.map((combo) => ({
      id: combo.join('-').toLowerCase().replace(/\s+/g, '-'),
      name: combo.join(' / '),
      sku: `${formData.sku || 'SKU'}-${combo.map(v => v.charAt(0).toUpperCase()).join('')}`,
      price: '',
      stockStatus: 'in_stock' as const,
    }));
  }, [hasVariants, variantOptions, formData.sku]);

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      // Upload each file to Vercel Blob
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Upload failed:', error);
          continue;
        }

        const { url } = await response.json();
        setImages((prev) => [...prev, url]);
      }
    } finally {
      setIsUploading(false);
    }
  }, []);

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addVariantOption = () => {
    setVariantOptions([...variantOptions, { id: crypto.randomUUID(), name: '', values: [''] }]);
  };

  const removeVariantOption = (index: number) => {
    setVariantOptions(variantOptions.filter((_, i) => i !== index));
  };

  const updateVariantOption = (index: number, field: 'name' | 'values', value: string | string[]) => {
    const updated = [...variantOptions];
    if (field === 'name') {
      updated[index]!.name = value as string;
    } else {
      updated[index]!.values = value as string[];
    }
    setVariantOptions(updated);
  };

  const addVariantValue = (optionIndex: number) => {
    const updated = [...variantOptions];
    updated[optionIndex]!.values = [...updated[optionIndex]!.values, ''];
    setVariantOptions(updated);
  };

  const removeVariantValue = (optionIndex: number, valueIndex: number) => {
    const updated = [...variantOptions];
    updated[optionIndex]!.values = updated[optionIndex]!.values.filter((_, i) => i !== valueIndex);
    setVariantOptions(updated);
  };

  return {
    formData,
    setFormData,
    images,
    setImages,
    hasVariants,
    setHasVariants,
    variantOptions,
    generatedVariants,
    handleImageUpload,
    removeImage,
    addVariantOption,
    removeVariantOption,
    updateVariantOption,
    addVariantValue,
    removeVariantValue,
    isUploading,
  };
}

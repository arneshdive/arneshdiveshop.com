'use client';

import { useState, useMemo, useCallback } from 'react';

export interface VariantOption {
  id: string;
  name: string;
  values: string[];
}

export interface EditableVariant {
  id: string;
  name: string;
  sku: string;
  price: string;
  isActive: boolean;
  isNew: boolean; // Track if this is a newly generated variant (not from DB)
}

export interface SavedVariant {
  id: string;
  productId: string;
  sku: string | null;
  name: string;
  options: Record<string, string>;
  priceCents: number | null;
  isActive: boolean;
  createdAt: Date;
}

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  brand: string;
  price: string;
  compareAtPrice: string;
  sku: string;
  weightGrams: string;
  isActive: boolean;
  divingTypes: ('freediving' | 'scuba')[];
  isNewArrival: boolean;
  isOnSale: boolean;
}

export function useProductForm() {
  const [images, setImages] = useState<string[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [editableVariants, setEditableVariants] = useState<EditableVariant[]>([]);
  const [savedVariants, setSavedVariants] = useState<SavedVariant[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    compareAtPrice: '',
    sku: '',
    weightGrams: '500',
    isActive: true,
    divingTypes: [],
    isNewArrival: false,
    isOnSale: false,
  });

  // Generate variants from options (with memoization)
  const generatedVariants = useMemo(() => {
    if (!hasVariants || variantOptions.length === 0) return [];

    const getCombinations = (options: VariantOption[], index: number): string[][] => {
      if (index === options.length) return [[]];
      const currentValues = options[index]!.values.filter(v => v.trim());
      if (currentValues.length === 0) return [[]];
      const restCombinations = getCombinations(options, index + 1);
      return currentValues.flatMap((value) =>
        restCombinations.map((rest) => [value, ...rest])
      );
    };

    const combinations = getCombinations(variantOptions, 0);
    return combinations.map((combo) => {
      const name = combo.join(' / ');
      const id = name.toLowerCase().replace(/\s+/g, '-');
      // Check if we already have a saved variant for this name
      const savedVariant = savedVariants.find(v => v.name === name);
      return {
        id: savedVariant?.id || `new-${id}`,
        name,
        sku: savedVariant?.sku || `${formData.sku || 'SKU'}-${combo.map(v => v.charAt(0).toUpperCase()).join('')}`,
        price: savedVariant?.priceCents ? (savedVariant.priceCents / 100).toString() : '',
        isActive: savedVariant?.isActive ?? true,
        isNew: !savedVariant,
      };
    });
  }, [hasVariants, variantOptions, formData.sku, savedVariants]);

  // Sync editableVariants when generatedVariants changes - but preserve existing edits
  useMemo(() => {
    if (generatedVariants.length > 0) {
      setEditableVariants(prev => {
        // If no previous variants, use generated
        if (prev.length === 0) return generatedVariants;
        
        // Merge: keep existing values for matching variants, add new ones, remove old ones
        return generatedVariants.map(gen => {
          const existing = prev.find(v => v.name === gen.name);
          return existing ? { ...gen, sku: existing.sku, price: existing.price, isActive: existing.isActive } : gen;
        });
      });
    }
  }, [generatedVariants]);

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

  // Update an editable variant's field
  const updateEditableVariant = (id: string, field: 'sku' | 'price' | 'isActive', value: string | boolean) => {
    setEditableVariants(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, [field]: value };
      }
      return v;
    }));
  };

  // Load saved variants from product data
  const loadSavedVariants = useCallback((variants: SavedVariant[]) => {
    setSavedVariants(variants);
    if (variants.length > 0) {
      setHasVariants(true);
      // Reconstruct variantOptions from saved variants
      const optionsMap = new Map<string, string[]>();
      variants.forEach(v => {
        Object.entries(v.options).forEach(([key, value]) => {
          if (!optionsMap.has(key)) {
            optionsMap.set(key, []);
          }
          const values = optionsMap.get(key)!;
          if (!values.includes(value)) {
            values.push(value);
          }
        });
      });
      const reconstructedOptions = Array.from(optionsMap.entries()).map(([name, values]) => ({
        id: crypto.randomUUID(),
        name,
        values,
      }));
      setVariantOptions(reconstructedOptions);
      // Also set editable variants
      setEditableVariants(variants.map(v => ({
        id: v.id,
        name: v.name,
        sku: v.sku || '',
        price: v.priceCents ? (v.priceCents / 100).toString() : '',
        isActive: v.isActive,
        isNew: false,
      })));
    }
  }, []);

  return {
    formData,
    setFormData,
    images,
    setImages,
    hasVariants,
    setHasVariants,
    variantOptions,
    addVariantOption,
    removeVariantOption,
    updateVariantOption,
    addVariantValue,
    removeVariantValue,
    updateEditableVariant,
    editableVariants,
    savedVariants,
    loadSavedVariants,
  };
}

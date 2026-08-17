'use client';

import { useState, useMemo, useCallback } from 'react';
import type { DivingType } from '@/lib/db/schema';

export interface VariantValue {
  id: string;
  value: string;
}

export interface VariantOption {
  id: string;
  name: string;
  values: VariantValue[];
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
  divingTypes: DivingType[];
  isNewArrival: boolean;
  isOnSale: boolean;
}

// Manual overrides the admin applies to the editable grid (sku / price / active),
// keyed by variant id. Kept separate from the generated variants so the grid can
// be a pure derivation of (generatedVariants + overrides) with no setState-in-render.
type VariantOverrides = Record<string, { sku?: string; price?: string; isActive?: boolean }>;

export function useProductForm() {
  const [images, setImages] = useState<string[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [savedVariants, setSavedVariants] = useState<SavedVariant[]>([]);
  const [variantOverrides, setVariantOverrides] = useState<VariantOverrides>({});
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
  const generatedVariants = useMemo<EditableVariant[]>(() => {
    if (!hasVariants || variantOptions.length === 0) return [];

    const getCombinations = (options: VariantOption[], index: number): string[][] => {
      if (index === options.length) return [[]];
      const currentValues = options[index]!.values
        .map(v => v.value)
        .filter(v => v.trim());
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

  // Derived grid: generated variants + admin's manual overrides.
  const editableVariants = useMemo<EditableVariant[]>(() => {
    return generatedVariants.map(gen => {
      const override = variantOverrides[gen.id];
      if (!override) return gen;
      return {
        ...gen,
        ...(override.sku !== undefined ? { sku: override.sku } : {}),
        ...(override.price !== undefined ? { price: override.price } : {}),
        ...(override.isActive !== undefined ? { isActive: override.isActive } : {}),
      };
    });
  }, [generatedVariants, variantOverrides]);

  // Saved (DB-backed) variants whose combination no longer exists in the current
  // option/value editor, or that should disappear because "hasVariants" was
  // turned off entirely. These are never hard-deleted (order/cart rows may
  // reference them) - the caller should PATCH them to isActive: false instead.
  const removedVariantIds = useMemo(() => {
    if (savedVariants.length === 0) return [];

    if (!hasVariants) {
      return savedVariants.filter(v => v.isActive).map(v => v.id);
    }

    const currentNames = new Set(generatedVariants.map(g => g.name));
    return savedVariants
      .filter(v => v.isActive && !currentNames.has(v.name))
      .map(v => v.id);
  }, [savedVariants, generatedVariants, hasVariants]);

  const addVariantOption = () => {
    setVariantOptions([...variantOptions, {
      id: crypto.randomUUID(),
      name: '',
      values: [{ id: crypto.randomUUID(), value: '' }],
    }]);
  };

  const removeVariantOption = (index: number) => {
    setVariantOptions(variantOptions.filter((_, i) => i !== index));
  };

  const updateVariantOption = (index: number, field: 'name' | 'values', value: string | VariantValue[]) => {
    const updated = [...variantOptions];
    if (field === 'name') {
      updated[index]!.name = value as string;
    } else {
      updated[index]!.values = value as VariantValue[];
    }
    setVariantOptions(updated);
  };

  const addVariantValue = (optionIndex: number) => {
    const updated = [...variantOptions];
    updated[optionIndex]!.values = [...updated[optionIndex]!.values, { id: crypto.randomUUID(), value: '' }];
    setVariantOptions(updated);
  };

  const removeVariantValue = (optionIndex: number, valueIndex: number) => {
    const updated = [...variantOptions];
    updated[optionIndex]!.values = updated[optionIndex]!.values.filter((_, i) => i !== valueIndex);
    setVariantOptions(updated);
  };

  // Reorder variant option dimensions (framer-motion supplies the new array)
  const reorderVariantOption = (next: VariantOption[]) => {
    setVariantOptions(next);
  };

  // Reorder values within a dimension (framer-motion supplies the new array)
  const reorderVariantValue = (optionIndex: number, next: VariantValue[]) => {
    setVariantOptions(prev => {
      const option = prev[optionIndex];
      if (!option) return prev;
      const updated = [...prev];
      updated[optionIndex] = { ...option, values: next };
      return updated;
    });
  };

  // Update an editable variant's field (stored as an override keyed by variant id)
  const updateEditableVariant = (id: string, field: 'sku' | 'price' | 'isActive', value: string | boolean) => {
    setVariantOverrides(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  // Load saved variants from product data.
  // `orderedOptions` (the product's persisted variantOptions) supplies the
  // admin-set display order when present; otherwise we fall back to
  // first-appearance order reconstructed from the variant rows.
  const loadSavedVariants = useCallback((variants: SavedVariant[], orderedOptions?: { name: string; values: string[] }[]) => {
    setSavedVariants(variants);
    setVariantOverrides({});
    if (variants.length > 0) {
      setHasVariants(true);

      let reconstructedOptions: VariantOption[];

      if (orderedOptions && orderedOptions.length > 0) {
        // Use persisted order, but only keep dimensions/values that actually
        // exist on the saved variants.
        const available = new Map<string, Set<string>>();
        variants.forEach(v => {
          Object.entries(v.options).forEach(([key, value]) => {
            if (!available.has(key)) available.set(key, new Set());
            available.get(key)!.add(value);
          });
        });

        reconstructedOptions = orderedOptions
          .filter(opt => available.has(opt.name))
          .map(opt => ({
            id: crypto.randomUUID(),
            name: opt.name,
            values: opt.values
              .filter(value => available.get(opt.name)!.has(value))
              .map(value => ({ id: crypto.randomUUID(), value })),
          }));

        // Append any active dimensions not listed in orderedOptions.
        for (const [key, values] of available) {
          if (!reconstructedOptions.some(o => o.name === key)) {
            reconstructedOptions.push({
              id: crypto.randomUUID(),
              name: key,
              values: Array.from(values).map(value => ({ id: crypto.randomUUID(), value })),
            });
          }
        }
      } else {
        // Fallback: reconstruct from saved variant rows in first-appearance order.
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
        reconstructedOptions = Array.from(optionsMap.entries()).map(([name, values]) => ({
          id: crypto.randomUUID(),
          name,
          values: values.map(value => ({ id: crypto.randomUUID(), value })),
        }));
      }

      setVariantOptions(reconstructedOptions);
    }
  }, []);

  // Reset pricing fields when hasVariants is toggled
  const resetPricingFields = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      price: '',
      compareAtPrice: '',
      sku: '',
    }));
  }, []);

  return {
    formData,
    setFormData,
    images,
    setImages,
    hasVariants,
    setHasVariants,
    variantOptions,
    setVariantOptions,
    addVariantOption,
    removeVariantOption,
    updateVariantOption,
    addVariantValue,
    removeVariantValue,
    reorderVariantOption,
    reorderVariantValue,
    updateEditableVariant,
    editableVariants,
    savedVariants,
    removedVariantIds,
    loadSavedVariants,
    resetPricingFields,
  };
}

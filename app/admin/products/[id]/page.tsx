'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatedButton } from '@/components/ui/animated-button';
import { BasicInfoSection } from '@/components/admin/product-form/basic-info-section';
import { PricingSection } from '@/components/admin/product-form/pricing-section';
import { VariantsSection } from '@/components/admin/product-form/variants-section';
import { ImagesSection } from '@/components/admin/product-form/images-section';
import { ProductPreview } from '@/components/admin/product-form/product-preview';
import { useProductForm, type SavedVariant } from '@/lib/hooks/use-product-form';

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  categoryId: string;
  brandId: string | null;
  divingTypes: string[];
  images: string[];
  isActive: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  variants: SavedVariant[];
};

// Fetch single product
async function fetchProduct(id: string): Promise<{ product: Product }> {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) throw new Error('Failed to fetch product');
  return response.json();
}

// Update product
async function updateProduct(id: string, data: Record<string, unknown>): Promise<{ product: Product }> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update product');
  }
  return response.json();
}

// Helper to extract error message from API response
async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.error || data.message || 'Terjadi kesalahan';
  } catch {
    return 'Terjadi kesalahan';
  }
}

export const dynamic = 'force-dynamic';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    formData,
    setFormData,
    images,
    setImages,
    hasVariants,
    setHasVariants,
    variantOptions,
    editableVariants,
    addVariantOption,
    removeVariantOption,
    updateVariantOption,
    addVariantValue,
    removeVariantValue,
    updateEditableVariant,
    loadSavedVariants,
  } = useProductForm();

  // Fetch product data
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });

  // Populate form when product data loads
  useEffect(() => {
    if (data?.product) {
      const product = data.product;
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.categoryId,
        brand: product.brandId || '',
        price: (product.priceCents / 100).toString(),
        salePrice: product.compareAtPriceCents ? (product.compareAtPriceCents / 100).toString() : '',
        sku: product.sku || '',
        isActive: product.isActive,
        divingTypes: product.divingTypes as ('freediving' | 'scuba')[] || [],
        isNewArrival: product.isNewArrival,
        isOnSale: product.isOnSale,
      });
      setImages(product.images);
      // Load existing variants
      if (product.variants && product.variants.length > 0) {
        loadSavedVariants(product.variants);
      }
    }
  }, [data, setFormData, setImages, loadSavedVariants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Convert price strings to cents
    const priceCents = formData.price 
      ? Math.round(parseFloat(formData.price.replace(/[^\d.]/g, '')) * 100)
      : 0;
    const compareAtPriceCents = formData.salePrice
      ? Math.round(parseFloat(formData.salePrice.replace(/[^\d.]/g, '')) * 100)
      : null;

    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      sku: formData.sku || undefined,
      priceCents,
      compareAtPriceCents,
      categoryId: formData.category,
      brandId: formData.brand || null,
      divingTypes: formData.divingTypes,
      images,
      isActive: formData.isActive,
      isNewArrival: formData.isNewArrival,
      isOnSale: formData.isOnSale,
    };

    try {
      // Update product
      await updateMutation.mutateAsync(payload);
      
      // Handle variants if enabled
      if (hasVariants && editableVariants.length > 0 && variantOptions.length > 0) {
        const variantErrors: string[] = [];
        
        // Build options map for each variant
        const variantPromises = editableVariants.map(async (variant) => {
          // Build options object from variantOptions
          const options: Record<string, string> = {};
          const nameParts = variant.name.split(' / ');
          variantOptions.forEach((opt, idx) => {
            if (nameParts[idx]) {
              options[opt.name] = nameParts[idx]!;
            }
          });
          
          const variantData = {
            name: variant.name,
            sku: variant.sku || null,
            options,
            priceCents: variant.price ? Math.round(parseFloat(variant.price) * 100) : null,
            isActive: variant.isActive,
          };
          
          if (variant.isNew || variant.id.startsWith('new-')) {
            // Create new variant
            const response = await fetch(`/api/products/${productId}/variants`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(variantData),
            });
            if (!response.ok) {
              const errorMsg = await getErrorMessage(response);
              variantErrors.push(`${variant.name}: ${errorMsg}`);
            }
          } else {
            // Update existing variant
            const response = await fetch(`/api/products/${productId}/variants/${variant.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(variantData),
            });
            if (!response.ok) {
              const errorMsg = await getErrorMessage(response);
              variantErrors.push(`${variant.name}: ${errorMsg}`);
            }
          }
        });
        
        await Promise.all(variantPromises);
        
        if (variantErrors.length > 0) {
          alert(`Produk berhasil diupdate, tapi beberapa varian gagal:\n${variantErrors.join('\n')}`);
        }
      }
      
      router.push('/admin/products');
    } catch (error) {
      console.error('Submit error:', error);
      alert('Terjadi kesalahan saat menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="text-center py-16">
          <p className="text-neutral-500">Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.product) {
    return (
      <div>
        <div className="text-center py-16">
          <p className="text-red-600 mb-4">Produk tidak ditemukan</p>
          <AnimatedButton onClick={() => router.push('/admin/products')} variant="outline" size="xs">
            Kembali ke Daftar Produk
          </AnimatedButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Edit Produk</h1>
        <p className="text-sm text-neutral-500 mt-1">Ubah informasi produk</p>
      </div>

      <div className="flex gap-8">
        {/* Form */}
        <div className="flex-1">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            <BasicInfoSection formData={formData} setFormData={setFormData} />

            {!hasVariants && <PricingSection formData={formData} setFormData={setFormData} />}

            <VariantsSection
              hasVariants={hasVariants}
              setHasVariants={setHasVariants}
              variantOptions={variantOptions}
              editableVariants={editableVariants}
              addVariantOption={addVariantOption}
              removeVariantOption={removeVariantOption}
              updateVariantOption={updateVariantOption}
              addVariantValue={addVariantValue}
              removeVariantValue={removeVariantValue}
              updateEditableVariant={updateEditableVariant}
              isLocked={true}
            />

            <ImagesSection
              images={images}
              setImages={setImages}
            />

            <button type="submit" className="hidden" />
          </form>
        </div>

        {/* Preview & Actions */}
        <div className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            {/* Actions */}
            <div className="flex gap-3">
              <AnimatedButton onClick={() => router.push('/admin/products')} variant="outline" size="xs" className="flex-1">
                Batal
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                form="product-form"
                size="xs"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </AnimatedButton>
            </div>

            {/* Preview */}
            <ProductPreview
              name={formData.name}
              price={formData.price}
              salePrice={formData.salePrice}
              category={formData.category}
              brand={formData.brand}
              description={formData.description}
              isActive={formData.isActive}
              images={images}
              variantOptions={variantOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

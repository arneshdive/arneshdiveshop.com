'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatedButton } from '@/components/ui/animated-button';
import { BasicInfoSection } from '@/components/admin/product-form/basic-info-section';
import { PricingSection } from '@/components/admin/product-form/pricing-section';
import { VariantsSection } from '@/components/admin/product-form/variants-section';
import { ImagesSection } from '@/components/admin/product-form/images-section';
import { ProductPreview } from '@/components/admin/product-form/product-preview';
import { useProductForm } from '@/lib/hooks/use-product-form';

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
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
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
    generatedVariants,
    handleImageUpload,
    removeImage,
    addVariantOption,
    removeVariantOption,
    updateVariantOption,
    addVariantValue,
    removeVariantValue,
    isUploading,
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
      router.push('/admin/products');
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
        diveType: '',
        price: (product.priceCents / 100).toString(),
        salePrice: product.compareAtPriceCents ? (product.compareAtPriceCents / 100).toString() : '',
        sku: product.sku || '',
        weight: '',
        stockStatus: 'in_stock',
        isActive: product.isActive,
      });
      setImages(product.images);
    }
  }, [data, setFormData, setImages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isUploading) return;
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
      images,
      isActive: formData.isActive,
    };

    try {
      await updateMutation.mutateAsync(payload);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Terjadi kesalahan saat menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl">
        <div className="text-center py-16">
          <p className="text-neutral-500">Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.product) {
    return (
      <div className="max-w-7xl">
        <div className="text-center py-16">
          <p className="text-red-600 mb-4">Produk tidak ditemukan</p>
          <AnimatedButton asChild variant="outline">
            <Link href="/admin/products">Kembali ke Daftar Produk</Link>
          </AnimatedButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Edit Produk</h1>
        <p className="text-sm text-neutral-500 mt-1">Ubah informasi produk</p>
      </div>

      <div className="flex gap-8">
        {/* Form */}
        <div className="flex-1 max-w-4xl">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            <BasicInfoSection formData={formData} setFormData={setFormData} />

            {!hasVariants && <PricingSection formData={formData} setFormData={setFormData} />}

            <VariantsSection
              hasVariants={hasVariants}
              setHasVariants={setHasVariants}
              variantOptions={variantOptions}
              generatedVariants={generatedVariants}
              addVariantOption={addVariantOption}
              removeVariantOption={removeVariantOption}
              updateVariantOption={updateVariantOption}
              addVariantValue={addVariantValue}
              removeVariantValue={removeVariantValue}
            />

            <ImagesSection
              images={images}
              handleImageUpload={handleImageUpload}
              removeImage={removeImage}
            />

            <button type="submit" className="hidden" />
          </form>
        </div>

        {/* Preview & Actions */}
        <div className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            {/* Actions */}
            <div className="flex gap-3">
              <AnimatedButton asChild variant="outline" className="flex-1 !px-0 !h-12">
                <Link href="/admin/products">
                  <span className="text-sm font-medium tracking-wide">Batal</span>
                </Link>
              </AnimatedButton>
              <AnimatedButton asChild className="flex-1 !px-0 !h-12">
                <button type="submit" form="product-form" disabled={isSubmitting || isUploading}>
                  <span className="text-sm font-medium tracking-wide">{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
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
              stockStatus={formData.stockStatus}
              images={images}
              variantOptions={variantOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

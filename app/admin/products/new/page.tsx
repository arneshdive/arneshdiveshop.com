'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AnimatedButton } from '@/components/ui/animated-button';
import { BasicInfoSection } from '@/components/admin/product-form/basic-info-section';
import { PricingSection } from '@/components/admin/product-form/pricing-section';
import { VariantsSection } from '@/components/admin/product-form/variants-section';
import { ImagesSection } from '@/components/admin/product-form/images-section';
import { ProductPreview } from '@/components/admin/product-form/product-preview';
import { useProductForm } from '@/lib/hooks/use-product-form';

export default function NewProductPage() {
  const router = useRouter();
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
  } = useProductForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validation
    const errors: string[] = [];
    
    if (!images || images.length === 0) {
      errors.push('Minimal 1 gambar wajib diupload');
    }
    
    if (formData.divingTypes.length === 0) {
      errors.push('Pilih minimal satu tipe diving');
    }
    
    if (!formData.category) {
      errors.push('Kategori wajib dipilih');
    }
    
    // Validate price - required when no variants
    if (!hasVariants) {
      if (!formData.price || parseFloat(formData.price.replace(/[^\d.]/g, '')) === 0) {
        errors.push('Harga produk wajib diisi');
      }
    } else {
      // Validate variants - each active variant needs a price
      const activeVariantsWithoutPrice = editableVariants.filter(v => v.isActive && !v.price);
      if (activeVariantsWithoutPrice.length > 0) {
        errors.push('Semua varian aktif harus memiliki harga');
      }
      
      // Check if variant options are properly defined
      const emptyOptions = variantOptions.filter(opt => !opt.name.trim() || opt.values.filter(v => v.trim()).length === 0);
      if (emptyOptions.length > 0) {
        errors.push('Lengkapi semua opsi varian (nama dan nilai)');
      }
    }
    
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }
    
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
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details 
          ? Object.values(data.details).join(', ')
          : (data.error || 'Terjadi kesalahan');
        console.error('Failed to create product:', errorMsg);
        toast.error(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const product = data.product;

      // Create variants if enabled
      if (hasVariants && editableVariants.length > 0 && variantOptions.length > 0) {
        let variantErrors: string[] = [];
        
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
          
          const variantResponse = await fetch(`/api/products/${product.id}/variants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(variantData),
          });
          
          if (!variantResponse.ok) {
            const data = await variantResponse.json();
            variantErrors.push(`${variant.name}: ${data.error || 'Gagal membuat varian'}`);
          }
        });
        
        await Promise.all(variantPromises);
        
        if (variantErrors.length > 0) {
          variantErrors.forEach(err => toast.error(err));
          toast.warning('Produk berhasil dibuat, tapi beberapa varian gagal');
        }
      }

      toast.success('Produk berhasil dibuat');
      router.push('/admin/products');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Terjadi kesalahan saat menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Tambah Produk</h1>
        <p className="text-sm text-neutral-500 mt-1">Buat produk baru untuk katalog toko</p>
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

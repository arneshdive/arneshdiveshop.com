'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatedButton } from '@/components/ui/animated-button';
import { BasicInfoSection } from '@/components/admin/product-form/basic-info-section';
import { PricingSection } from '@/components/admin/product-form/pricing-section';
import { VariantsSection } from '@/components/admin/product-form/variants-section';
import { ImagesSection } from '@/components/admin/product-form/images-section';
import { ProductPreview } from '@/components/admin/product-form/product-preview';
import { useProductForm } from '@/lib/hooks/use-product-form';

export default function NewProductPage() {
  const router = useRouter();
  const {
    formData,
    setFormData,
    images,
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
  } = useProductForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', { ...formData, images, hasVariants, variantOptions, variants: generatedVariants });
    router.push('/admin/products');
  };

  return (
    <div className="max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Tambah Produk</h1>
        <p className="text-sm text-neutral-500 mt-1">Buat produk baru untuk katalog toko</p>
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
              <button type="submit" form="product-form">
                <span className="text-sm font-medium tracking-wide">Simpan</span>
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

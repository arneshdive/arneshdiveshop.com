'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils/cn';
import { productImageUrl } from '@/lib/utils/product-image';

interface ProductGalleryProps {
  images: string[];
  productTitle: string;
}

export function ProductGallery({ images, productTitle }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Keyed by URL so one dead file only costs its own tile, and functional
  // because the main image and its thumbnail can fail in the same tick.
  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]));
  };

  const currentImage = images[selectedIndex];
  // `main` on purpose: the box is ~646px, so 800px `medium` would be a retina
  // regression and there is no 1200px variant to step down to.
  const mainImage = currentImage && !failedImages.has(currentImage)
    ? productImageUrl(currentImage, 'main')
    : undefined;

  return (
    <div className="lg:sticky lg:top-24">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Image */}
        <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden flex-1">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={`${productTitle} - Image ${selectedIndex + 1}`}
              fill
              className="object-cover mix-blend-multiply"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              onError={() => handleImageError(currentImage!)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <Icon icon="solar:box-linear" className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Thumbnail Strip - Right side on desktop, bottom on mobile */}
        {images.length > 1 && (
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[calc(100vh-150px)] py-1 px-1 lg:px-1 lg:py-1 scrollbar-hide">
            {images.map((image, index) => {
              const thumbnail = failedImages.has(image)
                ? undefined
                : productImageUrl(image, 'thumb');

              return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'relative w-36 h-36 flex-shrink-0 rounded-md overflow-hidden transition-all bg-neutral-100 flex items-center justify-center',
                  selectedIndex === index
                    ? 'ring-2 ring-neutral-900'
                    : 'ring-1 ring-neutral-200 hover:ring-neutral-400'
                )}
              >
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt={`${productTitle} thumbnail ${index + 1}`}
                    fill
                    className="object-cover mix-blend-multiply"
                    sizes="144px"
                    onError={() => handleImageError(image)}
                  />
                ) : (
                  <Icon icon="solar:box-linear" className="w-8 h-8 text-neutral-300" />
                )}
              </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

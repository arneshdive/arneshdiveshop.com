'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface ProductGalleryProps {
  images: string[];
  productTitle: string;
}

export function ProductGallery({ images, productTitle }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fallback if no images
  const displayImages = images.length > 0 ? images : ['/placeholder-product.jpg'];
  const currentImage = displayImages[selectedIndex] ?? '/placeholder-product.jpg';

  return (
    <div className="lg:sticky lg:top-24">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Image */}
        <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden flex-1">
          <Image
            src={currentImage}
            alt={`${productTitle} - Image ${selectedIndex + 1}`}
            fill
            className="object-cover mix-blend-multiply"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
          />
        </div>

        {/* Thumbnail Strip - Right side on desktop, bottom on mobile */}
        {displayImages.length > 1 && (
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[calc(100vh-150px)] py-1 px-1 lg:px-1 lg:py-1 scrollbar-hide">
            {displayImages.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'relative w-36 h-36 flex-shrink-0 rounded-md overflow-hidden transition-all bg-neutral-100',
                  selectedIndex === index
                    ? 'ring-2 ring-neutral-900'
                    : 'ring-1 ring-neutral-200 hover:ring-neutral-400'
                )}
              >
                <Image
                  src={image}
                  alt={`${productTitle} thumbnail ${index + 1}`}
                  fill
                  className="object-cover mix-blend-multiply"
                  sizes="144px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

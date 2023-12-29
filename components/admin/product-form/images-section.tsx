'use client';

import { ImageUploader } from './image-uploader';

interface ImagesSectionProps {
  images: string[];
  setImages: (images: string[]) => void;
}

export function ImagesSection({ images, setImages }: ImagesSectionProps) {
  return (
    <div className="bg-white rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium tracking-tight text-neutral-900">Gambar</h2>
        <span className="text-xs text-neutral-500">Minimal 1 gambar</span>
      </div>
      <ImageUploader images={images} onImagesChange={setImages} maxFiles={10} />
    </div>
  );
}

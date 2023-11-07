import { Icon } from '@iconify/react';
import { Plus, X } from 'lucide-react';

interface ImagesSectionProps {
  images: string[];
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
}

export function ImagesSection({ images, handleImageUpload, removeImage }: ImagesSectionProps) {
  return (
    <div className="bg-white rounded-xl p-6 space-y-4">
      <h2 className="text-base font-medium tracking-tight text-neutral-900">Gambar</h2>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {images.map((_, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg bg-neutral-100 overflow-hidden group"
          >
            <div className="absolute inset-0 flex items-center justify-center text-neutral-900">
              <Icon icon="solar:gallery-minimalistic-linear" className="w-6 h-6" />
            </div>
            {index === 0 && (
              <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[8px] uppercase tracking-wider bg-neutral-900 text-white rounded">
                Utama
              </span>
            )}
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-neutral-600 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        <label className="aspect-square rounded-lg border-2 border-dashed border-neutral-200 hover:border-neutral-400 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
          <Plus className="w-5 h-5 text-neutral-400" />
          <span className="text-xs text-neutral-500">Tambah</span>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        </label>
      </div>
    </div>
  );
}

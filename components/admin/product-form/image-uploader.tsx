'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { X, Upload, Image as ImageIcon, Loader, AlertCircle, Check } from 'lucide-react';
import Image from 'next/image';

// Must match server-side config
const IMAGE_CONFIG = {
  maxFileSize: 20 * 1024 * 1024, // 20MB
  minDimensions: 500,
  maxDimensions: 5000,
} as const;

interface UploadingImage {
  id: string;
  blobUrl: string;
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  finalUrl?: string;
}

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxFiles?: number;
}

export function ImageUploader({ images, onImagesChange, maxFiles = 10 }: ImageUploaderProps) {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Ref to track latest images to avoid stale closure in async callbacks
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      uploadingImages.forEach(img => {
        if (img.blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.blobUrl);
        }
      });
    };
  }, []);

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload gagal');
    }

    const { url, warning: uploadWarning } = await response.json();
    if (uploadWarning) {
      setWarning(uploadWarning);
      setTimeout(() => setWarning(null), 5000);
    }
    return url;
  };

  const handleDropError = (rejections: FileRejection[]) => {
    const firstRejection = rejections[0];
    if (!firstRejection) return;

    const errorCode = firstRejection.errors[0]?.code;
    const fileName = firstRejection.file.name;

    if (errorCode === 'file-too-large') {
      setError(`${fileName}: File terlalu besar (maksimal 20MB)`);
    } else if (errorCode === 'file-invalid-type') {
      setError(`${fileName}: Format tidak didukung (gunakan JPEG, PNG, WebP, atau HEIC)`);
    } else if (errorCode === 'too-many-files') {
      setError(`Maksimal ${maxFiles} gambar per produk`);
    } else {
      setError(`Gagal mengupload ${fileName}`);
    }
    setTimeout(() => setError(null), 5000);
  };

  const onDrop = useCallback(async (acceptedFiles: File[], rejections: FileRejection[]) => {
    // Handle rejections
    if (rejections.length > 0) {
      handleDropError(rejections);
    }

    const currentUploading = uploadingImages.length;
    const remainingSlots = maxFiles - images.length - currentUploading;
    const filesToUpload = acceptedFiles.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      if (images.length + currentUploading >= maxFiles) {
        setError(`Maksimal ${maxFiles} gambar per produk`);
        setTimeout(() => setError(null), 5000);
      }
      return;
    }

    // Create blob previews immediately for instant display
    const newUploadingImages: UploadingImage[] = filesToUpload.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      blobUrl: URL.createObjectURL(file),
      fileName: file.name,
      status: 'uploading' as const,
    }));

    setUploadingImages(prev => [...prev, ...newUploadingImages]);

    // Upload each file in the background
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]!;
      const uploadingImage = newUploadingImages[i]!;

      try {
        const url = await uploadFile(file);
        
        // Mark as success and store final URL
        setUploadingImages(prev =>
          prev.map(img =>
            img.id === uploadingImage.id
              ? { ...img, status: 'success', finalUrl: url }
              : img
          )
        );

        // Add to images after short delay to show success state
        setTimeout(() => {
          onImagesChange([...imagesRef.current, url]);
          // Remove from uploading list
          setUploadingImages(prev => prev.filter(img => img.id !== uploadingImage.id));
        }, 500);

      } catch (err) {
        console.error('Upload error:', err);
        const message = err instanceof Error ? err.message : 'Upload gagal';
        
        // Mark as error
        setUploadingImages(prev =>
          prev.map(img =>
            img.id === uploadingImage.id
              ? { ...img, status: 'error', error: message }
              : img
          )
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, maxFiles, onImagesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
    },
    maxSize: IMAGE_CONFIG.maxFileSize,
    maxFiles,
    disabled: images.length + uploadingImages.length >= maxFiles,
  });

  const removeUploadingImage = (id: string) => {
    setUploadingImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(img.blobUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const newImages = [...images];
    const [removed] = newImages.splice(from, 1);
    newImages.splice(to, 0, removed!);
    onImagesChange(newImages);
  };

  const isUploading = uploadingImages.some(img => img.status === 'uploading');
  const totalCount = images.length + uploadingImages.length;

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Warning Message */}
      {warning && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      {/* Images Grid (uploaded + uploading) */}
      {totalCount > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {/* Uploading images (shown first with blob preview) */}
          {uploadingImages.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.blobUrl}
                alt={img.fileName}
                className="w-full h-full object-cover"
              />
              {/* Status overlay */}
              <div className={`absolute inset-0 flex items-center justify-center ${
                img.status === 'uploading' ? 'bg-black/30' : 
                img.status === 'success' ? 'bg-green-500/30' :
                'bg-red-500/30'
              }`}>
                {img.status === 'uploading' && (
                  <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                    <Loader className="w-5 h-5 text-neutral-600 animate-spin" style={{ animationDuration: '800ms' }} />
                  </div>
                )}
                {img.status === 'success' && (
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
                {img.status === 'error' && (
                  <div className="text-center px-1">
                    <AlertCircle className="w-5 h-5 text-white mx-auto" />
                    <p className="text-[8px] text-white mt-1 line-clamp-2">{img.error}</p>
                  </div>
                )}
              </div>
              {/* Remove button for error state */}
              {img.status === 'error' && (
                <button
                  type="button"
                  onClick={() => removeUploadingImage(img.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-neutral-600 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {/* Successfully uploaded images */}
          {images.map((url, index) => (
            <div
              key={url}
              className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 group"
            >
              <Image
                src={url}
                alt={`Product image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
              />
              {index === 0 && uploadingImages.length === 0 && !isUploading && (
                <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[8px] uppercase tracking-wider bg-neutral-900 text-white rounded">
                  Utama
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors"
                    title="Jadikan utama"
                  >
                    <span className="text-xs">←</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-neutral-600 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {totalCount < maxFiles && (
        <div
          {...getRootProps()}
          className={`
            relative rounded-lg border-2 border-dashed transition-colors cursor-pointer
            ${isDragActive 
              ? 'border-neutral-900 bg-neutral-50' 
              : 'border-neutral-200 hover:border-neutral-400'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            {isDragActive ? (
              <>
                <ImageIcon className="w-8 h-8 text-neutral-900" />
                <p className="text-sm text-neutral-900 font-medium">Letakkan gambar di sini</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-neutral-400" />
                <div className="text-center">
                  <p className="text-sm text-neutral-600">
                    <span className="font-medium text-neutral-900">Klik untuk upload</span> atau seret gambar ke sini
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    JPEG, PNG, WebP, HEIC. Maks 20MB. {totalCount}/{maxFiles} gambar.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

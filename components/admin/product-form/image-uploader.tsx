'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { X, Upload, Image as ImageIcon, Loader, AlertCircle, Check } from 'lucide-react';
import Image from 'next/image';
import { IMAGE_CONFIG } from '@/lib/utils/image-config';
import { createVariants, canResizeInBrowser } from '@/lib/utils/image-resize';
import { productImageUrl } from '@/lib/utils/product-image';

const MAX_INPUT_MB = Math.round(IMAGE_CONFIG.maxInputFileSize / (1024 * 1024));
const MAX_UPLOAD_MB = Math.round(IMAGE_CONFIG.maxUploadSize / (1024 * 1024));

interface UploadingImage {
  id: string;
  blobUrl: string;
  fileName: string;
  status: 'processing' | 'uploading' | 'success' | 'error';
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

  // Ref to track latest images to avoid stale closure in async callbacks
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  /**
   * `uploadingImages` also lives in a ref, and every write goes through
   * `updateUploading` so the two never diverge.
   *
   * This is not belt-and-braces: `onDrop` has to know how many slots are left
   * *before* React re-renders. Reading the state variable made two quick drops
   * both size themselves against the same count, so together they could exceed
   * `maxFiles` — and every file over the cap is a blob written to storage that
   * can never be deleted. The ref is the synchronous truth; the state exists
   * only to render.
   */
  const uploadingRef = useRef<UploadingImage[]>([]);
  const updateUploading = useCallback(
    (updater: (prev: UploadingImage[]) => UploadingImage[]) => {
      const next = updater(uploadingRef.current);
      uploadingRef.current = next;
      setUploadingImages(next);
    },
    [],
  );

  /**
   * Object URLs to release once their tile is actually gone from the DOM.
   * Revoking during the state update would pull the URL out from under an
   * <img> that React has not unmounted yet, so it is deferred to the effect
   * below, which runs after the commit.
   */
  const pendingRevokeRef = useRef<string[]>([]);
  useEffect(() => {
    if (pendingRevokeRef.current.length === 0) return;

    const stillRendered = new Set(uploadingImages.map(img => img.blobUrl));
    const stillPending: string[] = [];

    for (const url of pendingRevokeRef.current) {
      if (stillRendered.has(url)) stillPending.push(url);
      else URL.revokeObjectURL(url);
    }

    pendingRevokeRef.current = stillPending;
  }, [uploadingImages]);

  // Cleanup blob URLs on unmount. Reads the ref, not the state variable: with
  // a `[]` dep array the state would be captured at first render and this
  // would revoke nothing at all.
  useEffect(() => {
    return () => {
      for (const img of uploadingRef.current) {
        if (img.blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.blobUrl);
        }
      }
      for (const url of pendingRevokeRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  /**
   * Not every failure comes from the route. Vercel rejects oversized bodies at
   * the edge and Next serves HTML for an unhandled error, both as non-JSON —
   * parsing those blindly surfaced things like `Unexpected token 'R'` on top of
   * the thumbnail instead of telling anyone what went wrong.
   */
  const describeFailure = async (response: Response): Promise<string> => {
    if (response.status === 413) {
      return `File terlalu besar (maksimal ${MAX_UPLOAD_MB}MB setelah dikompres)`;
    }

    const body = await response.text();

    try {
      const parsed = JSON.parse(body);
      if (parsed?.error) return parsed.error;
    } catch {
      // Not JSON — fall through to a generic message below.
    }

    return `Upload gagal (${response.status})`;
  };

  /**
   * Build the request body. Normally that is the three downscaled variants,
   * which come to a few hundred KB whatever was selected. If this browser
   * cannot do the work, send the original instead — but only when it would
   * actually fit, since anything larger is refused by the platform before the
   * route sees it.
   */
  const buildUploadBody = async (file: File): Promise<FormData> => {
    const formData = new FormData();

    if (canResizeInBrowser()) {
      try {
        for (const { variant, blob } of await createVariants(file)) {
          formData.append(variant, blob, `${variant}.webp`);
        }
        return formData;
      } catch (processingError) {
        console.error('Client-side resize failed, sending original:', processingError);
      }
    }

    if (file.size > IMAGE_CONFIG.maxUploadSize) {
      throw new Error(
        `Gambar tidak bisa diproses di browser ini dan ukurannya melebihi ${MAX_UPLOAD_MB}MB. Perkecil dulu, lalu unggah kembali.`,
      );
    }

    formData.append('file', file);
    return formData;
  };

  const uploadFile = async (file: File, onUploading: () => void): Promise<string> => {
    // Decoding and re-encoding a 25MB photo is noticeable, so the two phases
    // are reported separately rather than showing one long spinner.
    const body = await buildUploadBody(file);
    onUploading();

    const response = await fetch('/api/upload', { method: 'POST', body });

    if (!response.ok) {
      throw new Error(await describeFailure(response));
    }

    const { url } = await response.json();
    return url;
  };

  // Browsers report HEIC inconsistently — Safari sets the MIME type, Chrome
  // often sends an empty one — so fall back to the extension.
  const isHeic = (file: File) =>
    /^image\/hei[cf]$/.test(file.type) || /\.hei[cf]$/i.test(file.name);

  const handleDropError = (rejections: FileRejection[]) => {
    const firstRejection = rejections[0];
    if (!firstRejection) return;

    const errorCode = firstRejection.errors[0]?.code;
    const fileName = firstRejection.file.name;

    if (errorCode === 'file-too-large') {
      setError(`${fileName}: File terlalu besar (maksimal ${MAX_INPUT_MB}MB)`);
    } else if (errorCode === 'file-invalid-type') {
      // Photos straight off an iPhone are the common case here, so say what to
      // do rather than just listing the formats that would have worked.
      setError(
        isHeic(firstRejection.file)
          ? `${fileName}: Format HEIC belum didukung. Ubah dulu ke JPG, lalu unggah kembali.`
          : `${fileName}: Format tidak didukung (gunakan JPEG, PNG, atau WebP)`
      );
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

    // Slot accounting reads the refs, so a second drop that lands before React
    // has re-rendered still sees the files the first one claimed. Clamped at
    // zero because slice() with a negative end counts back from the end of the
    // array and would happily upload past the cap.
    const remainingSlots = Math.max(
      0,
      maxFiles - imagesRef.current.length - uploadingRef.current.length,
    );
    const filesToUpload = acceptedFiles.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      // Only when files were actually offered and turned away — otherwise this
      // would overwrite the specific message handleDropError just set.
      if (acceptedFiles.length > 0 && remainingSlots === 0) {
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
      status: 'processing' as const,
    }));

    updateUploading(prev => [...prev, ...newUploadingImages]);

    // Upload each file in the background
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]!;
      const uploadingImage = newUploadingImages[i]!;

      try {
        const url = await uploadFile(file, () =>
          updateUploading(prev =>
            prev.map(img =>
              img.id === uploadingImage.id ? { ...img, status: 'uploading' } : img
            )
          )
        );

        // Mark as success and store final URL
        updateUploading(prev =>
          prev.map(img =>
            img.id === uploadingImage.id
              ? { ...img, status: 'success', finalUrl: url }
              : img
          )
        );

        // Hand the URL to the form, keeping imagesRef in step by hand: the
        // effect that syncs it only runs after the parent re-renders, and the
        // next iteration must not append to a list missing this URL.
        const nextImages = [...imagesRef.current, url];
        imagesRef.current = nextImages;
        onImagesChange(nextImages);

        // Drop the placeholder tile; its object URL is released by the effect
        // above once the tile is off the DOM.
        if (uploadingImage.blobUrl.startsWith('blob:')) {
          pendingRevokeRef.current.push(uploadingImage.blobUrl);
        }
        updateUploading(prev => prev.filter(img => img.id !== uploadingImage.id));

      } catch (err) {
        console.error('Upload error:', err);
        const message = err instanceof Error ? err.message : 'Upload gagal';

        // Mark as error. The tile stays, so its object URL stays valid until
        // the admin dismisses it or the component unmounts.
        updateUploading(prev =>
          prev.map(img =>
            img.id === uploadingImage.id
              ? { ...img, status: 'error', error: message }
              : img
          )
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxFiles, onImagesChange, updateUploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: IMAGE_CONFIG.maxInputFileSize,
    maxFiles,
    disabled: images.length + uploadingImages.length >= maxFiles,
  });

  const removeUploadingImage = (id: string) => {
    const img = uploadingRef.current.find(i => i.id === id);
    if (img?.blobUrl.startsWith('blob:')) {
      pendingRevokeRef.current.push(img.blobUrl);
    }
    updateUploading(prev => prev.filter(i => i.id !== id));
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

  const isUploading = uploadingImages.some(
    img => img.status === 'processing' || img.status === 'uploading'
  );
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
                img.status === 'processing' || img.status === 'uploading' ? 'bg-black/30' :
                img.status === 'success' ? 'bg-green-500/30' :
                'bg-red-500/30'
              }`}>
                {(img.status === 'processing' || img.status === 'uploading') && (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                      <Loader className="w-5 h-5 text-neutral-600 animate-spin" style={{ animationDuration: '800ms' }} />
                    </div>
                    <span className="text-[9px] text-white font-medium">
                      {img.status === 'processing' ? 'Memproses' : 'Mengunggah'}
                    </span>
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
                src={productImageUrl(url, 'thumb') || url}
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
                    JPEG, PNG, WebP. Maks {MAX_INPUT_MB}MB. {totalCount}/{maxFiles} gambar.
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

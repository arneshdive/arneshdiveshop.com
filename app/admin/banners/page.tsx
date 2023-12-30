'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatedButton } from '@/components/ui/animated-button';

// Types
type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  position: 'hero' | 'sidebar' | 'footer';
  sortOrder: number;
  isActive: boolean;
  eyebrow: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  createdAt: string;
  updatedAt: string;
};

type BannerFormData = {
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  position: 'hero' | 'sidebar' | 'footer';
  sortOrder: number;
  isActive: boolean;
  eyebrow: string;
  ctaText: string;
  ctaLink: string;
};

const defaultFormData: BannerFormData = {
  title: '',
  subtitle: '',
  imageUrl: '',
  link: '',
  position: 'hero',
  sortOrder: 0,
  isActive: true,
  eyebrow: '',
  ctaText: '',
  ctaLink: '',
};

// Fetch banners from API
async function fetchBanners(): Promise<{ banners: Banner[] }> {
  const response = await fetch('/api/admin/banners');
  if (!response.ok) throw new Error('Failed to fetch banners');
  return response.json();
}

// Create banner
async function createBanner(data: BannerFormData): Promise<{ banner: Banner }> {
  const response = await fetch('/api/admin/banners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create banner');
  }
  return response.json();
}

// Update banner
async function updateBanner(id: string, data: Partial<BannerFormData>): Promise<{ banner: Banner }> {
  const response = await fetch(`/api/admin/banners/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update banner');
  }
  return response.json();
}

// Delete banner
async function deleteBanner(id: string): Promise<void> {
  const response = await fetch(`/api/admin/banners/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete banner');
}

// Reorder banners
async function reorderBanners(orders: { id: string; sortOrder: number }[]): Promise<void> {
  const response = await fetch('/api/admin/banners/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders }),
  });
  if (!response.ok) throw new Error('Failed to reorder banners');
}

const positionLabels: Record<string, string> = {
  hero: 'Hero',
  sidebar: 'Sidebar',
  footer: 'Footer',
};

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch banners
  const { data, isLoading, error } = useQuery({
    queryKey: ['banners'],
    queryFn: fetchBanners,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      closeModal();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BannerFormData> }) =>
      updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      closeModal();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: reorderBanners,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });

  const banners = data?.banners ?? [];

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl,
      link: banner.link || '',
      position: banner.position,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      eyebrow: banner.eyebrow || '',
      ctaText: banner.ctaText || '',
      ctaLink: banner.ctaLink || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setFormData(defaultFormData);
    setFormErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const errors: Record<string, string> = {};
    if (!formData.imageUrl) {
      errors.imageUrl = 'URL gambar wajib diisi';
    }
    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      errors.imageUrl = 'URL gambar tidak valid';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus banner ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (banner: Banner) => {
    updateMutation.mutate({
      id: banner.id,
      data: { isActive: !banner.isActive },
    });
  };

  const handleMoveUp = (_banner: Banner, index: number) => {
    if (index === 0) return;
    const newOrders = banners.map((b, i) => ({
      id: b.id,
      sortOrder: i === index ? index - 1 : i === index - 1 ? index : i,
    }));
    reorderMutation.mutate(newOrders);
  };

  const handleMoveDown = (_banner: Banner, index: number) => {
    if (index === banners.length - 1) return;
    const newOrders = banners.map((b, i) => ({
      id: b.id,
      sortOrder: i === index ? index + 1 : i === index + 1 ? index : i,
    }));
    reorderMutation.mutate(newOrders);
  };

  const isLoadingMutation = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Banner</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola banner yang tampil di halaman utama toko</p>
        </div>
        <AnimatedButton onClick={openCreateModal} size="xs">
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Tambah Banner</span>
          </span>
        </AnimatedButton>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Icon icon="solar:gallery-wide-linear" className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500">Memuat banner...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <p className="text-red-600">Gagal memuat banner. Silakan coba lagi.</p>
        </div>
      )}

      {/* Banner List */}
      {!isLoading && !error && (
        <>
          {banners.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Icon icon="solar:gallery-wide-linear" className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-600 font-medium tracking-tight mb-1">Belum ada banner</p>
              <p className="text-sm text-neutral-500 mb-6">
                Mulai tambahkan banner untuk halaman utama toko Anda
              </p>
              <AnimatedButton onClick={openCreateModal} size="xs">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
                  <span className="text-sm font-medium tracking-wide">Tambah Banner</span>
                </span>
              </AnimatedButton>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className="bg-white rounded-2xl border border-neutral-200 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Preview */}
                    <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-neutral-100">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title || 'Banner'}
                        className="w-full h-full object-cover"
                      />
                      {!banner.isActive && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="px-3 py-1 text-xs font-medium bg-neutral-900 text-white rounded-full">
                            Nonaktif
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-neutral-100 text-neutral-600 rounded-full">
                              {positionLabels[banner.position]}
                            </span>
                            <span className="text-xs text-neutral-400">Urutan: {banner.sortOrder}</span>
                          </div>
                          <h3 className="text-base font-medium tracking-tight text-neutral-900 truncate mb-1">
                            {banner.title || 'Tanpa Judul'}
                          </h3>
                          {banner.subtitle && (
                            <p className="text-sm text-neutral-500 truncate mb-2">{banner.subtitle}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
                            {banner.eyebrow && (
                              <span className="flex items-center gap-1">
                                <Icon icon="solar:text-linear" className="w-3 h-3" />
                                {banner.eyebrow}
                              </span>
                            )}
                            {banner.ctaText && (
                              <span className="flex items-center gap-1">
                                <Icon icon="solar:link-linear" className="w-3 h-3" />
                                {banner.ctaText}
                              </span>
                            )}
                            {banner.link && (
                              <span className="flex items-center gap-1 truncate max-w-[150px]">
                                <Icon icon="solar:arrow-right-linear" className="w-3 h-3" />
                                <span className="truncate">{banner.link}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {/* Reorder buttons */}
                          <div className="hidden sm:flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveUp(banner, index)}
                              disabled={index === 0}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Pindah ke atas"
                            >
                              <Icon icon="solar:alt-arrow-up-linear" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(banner, index)}
                              disabled={index === banners.length - 1}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Pindah ke bawah"
                            >
                              <Icon icon="solar:alt-arrow-down-linear" className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleToggleActive(banner)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              banner.isActive
                                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                            }`}
                          >
                            {banner.isActive ? 'Aktif' : 'Nonaktif'}
                          </button>
                          <button
                            onClick={() => openEditModal(banner)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                            aria-label="Edit banner"
                          >
                            <Icon icon="solar:pen-linear" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(banner.id)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            aria-label="Hapus banner"
                          >
                            <Icon icon="solar:trash-bin-minimalistic-linear" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {editingBanner ? 'Edit Banner' : 'Tambah Banner Baru'}
                  </h3>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  >
                    <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      URL Gambar <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                    {formErrors.imageUrl && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.imageUrl}</p>
                    )}
                    {formData.imageUrl && isValidUrl(formData.imageUrl) && (
                      <div className="mt-2 w-full h-24 rounded-lg overflow-hidden bg-neutral-100">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Judul
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                      placeholder="Judul banner"
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Subtitle
                    </label>
                    <textarea
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                      placeholder="Deskripsi singkat"
                    />
                  </div>

                  {/* Position & Sort Order */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Posisi
                      </label>
                      <select
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value as 'hero' | 'sidebar' | 'footer' })}
                        className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                      >
                        <option value="hero">Hero</option>
                        <option value="sidebar">Sidebar</option>
                        <option value="footer">Footer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Urutan
                      </label>
                      <input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Eyebrow */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Eyebrow (Label Kecil)
                    </label>
                    <input
                      type="text"
                      value={formData.eyebrow}
                      onChange={(e) => setFormData({ ...formData, eyebrow: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                      placeholder="Freediving & Scuba"
                    />
                  </div>

                  {/* CTA */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Teks CTA
                      </label>
                      <input
                        type="text"
                        value={formData.ctaText}
                        onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                        placeholder="Lihat Koleksi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Link CTA
                      </label>
                      <input
                        type="text"
                        value={formData.ctaLink}
                        onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                        placeholder="/freediving"
                      />
                    </div>
                  </div>

                  {/* Link */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Link Banner
                    </label>
                    <input
                      type="text"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                      placeholder="/products"
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`w-12 h-7 rounded-full transition-colors ${
                        formData.isActive ? 'bg-green-500' : 'bg-neutral-200'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          formData.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-neutral-700">
                      {formData.isActive ? 'Banner aktif' : 'Banner nonaktif'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoadingMutation}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoadingMutation
                    ? 'Menyimpan...'
                    : editingBanner
                    ? 'Simpan Perubahan'
                    : 'Tambah Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

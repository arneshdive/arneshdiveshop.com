'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Plus, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedButton } from '@/components/ui/animated-button';
import { useBrands } from '@/lib/hooks/use-brands';
import type { Brand } from '@/lib/db/schema';

interface BrandFormData {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
}

const emptyForm: BrandFormData = {
  name: '',
  slug: '',
  description: '',
  logoUrl: '',
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function BrandsPage() {
  const { brands, isLoading, createBrand, updateBrand, deleteBrand, isCreating, isUpdating } = useBrands();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingBrand(null);
    setForm(emptyForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logoUrl: brand.logoUrl || '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingBrand ? prev.slug : generateSlug(name),
    }));
    setErrors((prev) => {
      const { name: _, slug: __, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (editingBrand) {
      updateBrand(
        {
          id: editingBrand.id,
          data: {
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            logoUrl: form.logoUrl || null,
          },
        },
        {
          onSuccess: () => {
            toast.success('Merek berhasil diperbarui');
            closeModal();
          },
          onError: (error) => {
            toast.error(error.message || 'Gagal memperbarui merek');
            setErrors({ general: error.message });
          },
        }
      );
    } else {
      createBrand(
        {
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          logoUrl: form.logoUrl || null,
        },
        {
          onSuccess: () => {
            toast.success('Merek berhasil ditambahkan');
            closeModal();
          },
          onError: (error) => {
            toast.error(error.message || 'Gagal menambahkan merek');
            setErrors({ general: error.message });
          },
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    deleteBrand(id, {
      onSuccess: () => {
        toast.success('Merek berhasil dihapus');
        setDeleteConfirm(null);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal menghapus merek');
      },
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Merek</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola merek produk toko Anda</p>
        </div>
        {brands.length > 0 && (
          <AnimatedButton onClick={openCreateModal} size="xs">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Tambah Merek</span>
          </AnimatedButton>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-8 h-8 text-neutral-400 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && brands.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
            <Icon icon="solar:tag-linear" className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium tracking-tight mb-1">Belum ada merek</p>
          <p className="text-sm text-neutral-500 mb-6">
            Mulai tambahkan merek untuk produk Anda
          </p>
          <AnimatedButton onClick={openCreateModal} size="xs">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Tambah Merek</span>
          </AnimatedButton>
        </div>
      )}

      {/* Brand List */}
      {!isLoading && brands.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Merek
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden md:table-cell">
                  Deskripsi
                </th>
                <th className="text-right px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                          <Icon icon="solar:tag-linear" className="w-5 h-5 text-neutral-400" />
                        </div>
                      )}
                      <span className="font-medium text-neutral-900">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-neutral-600 bg-neutral-50 px-2 py-1 rounded">
                      {brand.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-neutral-500 line-clamp-1">
                      {brand.description || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(brand)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        aria-label="Edit merek"
                      >
                        <Icon icon="solar:pen-linear" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(brand.id)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Hapus merek"
                      >
                        <Icon icon="solar:trash-bin-minimalistic-linear" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                {editingBrand ? 'Edit Merek' : 'Tambah Merek'}
              </h3>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Nama Merek <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Nama merek"
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  disabled
                  className="w-full px-4 py-2.5 text-sm bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 font-mono cursor-not-allowed"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Slug dibuat otomatis dari nama merek
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Deskripsi
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi singkat merek (opsional)"
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  URL Logo
                </label>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  URL gambar logo merek (opsional)
                </p>
              </div>

              {errors.general && (
                <p className="text-sm text-red-500">{errors.general}</p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isCreating || isUpdating ? 'Menyimpan...' : editingBrand ? 'Simpan Perubahan' : 'Tambah Merek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Icon icon="solar:trash-bin-minimalistic-linear" className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Hapus Merek?
              </h3>
              <p className="text-sm text-neutral-500 mb-6">
                Tindakan ini tidak dapat dibatalkan. Merek yang memiliki produk terkait tidak dapat dihapus.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Plus, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedButton } from '@/components/ui/animated-button';
import { useCategories } from '@/lib/hooks/use-categories';
import type { Category } from '@/lib/db/schema';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
}

const emptyForm: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CategoriesPage() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory, isCreating, isUpdating } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name),
    }));
    setErrors((prev) => {
      const { name: _, slug: __, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (editingCategory) {
      updateCategory(
        {
          id: editingCategory.id,
          data: {
            name: form.name,
            slug: form.slug,
            description: form.description || null,
          },
        },
        {
          onSuccess: () => {
            toast.success('Kategori berhasil diperbarui');
            closeModal();
          },
          onError: (error) => {
            toast.error(error.message || 'Gagal memperbarui kategori');
            setErrors({ general: error.message });
          },
        }
      );
    } else {
      createCategory(
        {
          name: form.name,
          slug: form.slug,
          description: form.description || null,
        },
        {
          onSuccess: () => {
            toast.success('Kategori berhasil ditambahkan');
            closeModal();
          },
          onError: (error) => {
            toast.error(error.message || 'Gagal menambahkan kategori');
            setErrors({ general: error.message });
          },
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    deleteCategory(id, {
      onSuccess: () => {
        toast.success('Kategori berhasil dihapus');
        setDeleteConfirm(null);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal menghapus kategori');
      },
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Kategori</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola kategori produk toko Anda</p>
        </div>
        {categories.length > 0 && (
          <AnimatedButton onClick={openCreateModal} size="xs">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Tambah Kategori</span>
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
      {!isLoading && categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
            <Icon icon="solar:folder-linear" className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium tracking-tight mb-1">Belum ada kategori</p>
          <p className="text-sm text-neutral-500 mb-6">
            Mulai tambahkan kategori untuk produk Anda
          </p>
          <AnimatedButton onClick={openCreateModal} size="xs">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Tambah Kategori</span>
          </AnimatedButton>
        </div>
      )}

      {/* Category List */}
      {!isLoading && categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Kategori
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
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-neutral-900">{category.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-neutral-600 bg-neutral-50 px-2 py-1 rounded">
                      {category.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-neutral-500 line-clamp-1">
                      {category.description || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(category)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        aria-label="Edit kategori"
                      >
                        <Icon icon="solar:pen-linear" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(category.id)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Hapus kategori"
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
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
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
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Nama kategori"
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
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
                  Slug dibuat otomatis dari nama kategori
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Deskripsi
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi singkat (opsional)"
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                />
              </div>

              {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}

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
                  {isCreating || isUpdating ? 'Menyimpan...' : editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Icon icon="solar:trash-bin-minimalistic-linear" className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Hapus Kategori?</h3>
              <p className="text-sm text-neutral-500 mb-6">
                Tindakan ini tidak dapat dibatalkan. Kategori dengan produk terkait tidak dapat dihapus.
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

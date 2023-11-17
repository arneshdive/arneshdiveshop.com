'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Plus } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import type { Category } from '@/lib/db/schema';

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: number;
}

const emptyForm: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  parentId: '',
  sortOrder: 0,
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tree, setTree] = useState<CategoryWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.flat || []);
        setTree(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openCreateModal = (parentId?: string) => {
    setEditingCategory(null);
    setForm({ ...emptyForm, parentId: parentId || '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId || '',
      sortOrder: category.sortOrder ?? 0,
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
    setIsSaving(true);

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          parentId: form.parentId || null,
          sortOrder: form.sortOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors({ general: data.error || 'Terjadi kesalahan' });
        }
        return;
      }

      await fetchCategories();
      closeModal();
    } catch (error) {
      console.error('Error saving category:', error);
      setErrors({ general: 'Terjadi kesalahan pada server' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Gagal menghapus kategori');
        return;
      }

      await fetchCategories();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Terjadi kesalahan pada server');
    }
  };

  const getCategoryPath = (parentId: string | null, path: string[] = []): string[] => {
    if (!parentId) return path;
    const parent = categories.find((c) => c.id === parentId);
    if (!parent) return path;
    return getCategoryPath(parent.parentId, [parent.name, ...path]);
  };

  // Recursive tree renderer
  const renderCategory = (category: CategoryWithChildren, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);

    return (
      <div key={category.id}>
        <div
          className={`flex items-center gap-2 px-4 py-3 hover:bg-neutral-50 transition-colors ${depth > 0 ? 'ml-8' : ''}`}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(category.id)}
              className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-neutral-600"
            >
              <Icon
                icon={isExpanded ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-right-linear'}
                className="w-4 h-4"
              />
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-900">{category.name}</span>
              <code className="text-xs text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                {category.slug}
              </code>
            </div>
            {category.description && (
              <p className="text-sm text-neutral-500 truncate mt-0.5">{category.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openCreateModal(category.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              title="Tambah subkategori"
            >
              <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
            </button>
            <button
              onClick={() => openEditModal(category)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              title="Edit"
            >
              <Icon icon="solar:pen-linear" className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteConfirm(category.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Hapus"
            >
              <Icon icon="solar:trash-bin-minimalistic-linear" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-neutral-100 ml-7">
            {category.children.map((child) => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Kategori</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola kategori produk dengan struktur hierarki</p>
        </div>
        <AnimatedButton onClick={() => openCreateModal()} className="px-6 py-3">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium tracking-wide">Tambah Kategori</span>
        </AnimatedButton>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Icon icon="solar:spinner-linear" className="w-8 h-8 text-neutral-400 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && categories.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <Icon icon="solar:folder-linear" className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium tracking-tight mb-1">Belum ada kategori</p>
          <p className="text-sm text-neutral-500 mb-6">
            Mulai tambahkan kategori untuk produk Anda
          </p>
          <AnimatedButton onClick={() => openCreateModal()} className="px-6 py-3">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Tambah Kategori</span>
          </AnimatedButton>
        </div>
      )}

      {/* Category Tree */}
      {!isLoading && tree.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
            <div className="w-6" />
            <span className="flex-1">Nama Kategori</span>
            <span>Aksi</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {tree.map((category) => renderCategory(category))}
          </div>
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
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, slug: e.target.value }));
                    setErrors((prev) => {
                      const { slug: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  placeholder="nama-kategori"
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent font-mono"
                />
                {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Kategori Induk
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                >
                  <option value="">Tidak ada (kategori utama)</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => {
                      const path = getCategoryPath(c.parentId);
                      const label = path.length > 0 ? `${path.join(' > ')} > ${c.name}` : c.name;
                      return (
                        <option key={c.id} value={c.id}>
                          {label}
                        </option>
                      );
                    })}
                </select>
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

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Urutan
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
                <p className="text-xs text-neutral-500 mt-1">Urutan tampil, angka lebih rendah ditampilkan lebih dulu</p>
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
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
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
                Tindakan ini tidak dapat dibatalkan. Kategori dengan subkategori atau produk tidak dapat dihapus.
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

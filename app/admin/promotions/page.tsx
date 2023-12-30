'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatedButton } from '@/components/ui/animated-button';

// Types
type PromotionType = 'percentage' | 'fixed_cents';

type Promotion = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: PromotionType;
  valueCents: number;
  minOrderCents: number | null;
  maxUses: number | null;
  usesCount: number;
  maxUsesPerCustomer: number | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PromotionFormData = {
  code: string;
  name: string;
  description: string;
  type: PromotionType;
  valueCents: string;
  minOrderCents: string;
  maxUses: string;
  maxUsesPerCustomer: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

const defaultFormData: PromotionFormData = {
  code: '',
  name: '',
  description: '',
  type: 'percentage',
  valueCents: '',
  minOrderCents: '',
  maxUses: '',
  maxUsesPerCustomer: '',
  isActive: true,
  startsAt: '',
  endsAt: '',
};

// Fetch promotions from API
async function fetchPromotions(): Promise<{ promotions: Promotion[] }> {
  const response = await fetch('/api/admin/promotions');
  if (!response.ok) throw new Error('Failed to fetch promotions');
  return response.json();
}

// Create promotion
async function createPromotion(data: PromotionFormData): Promise<{ promotion: Promotion }> {
  // For fixed_cents type, convert Rupiah to cents. For percentage, value is basis points (no conversion).
  const valueCents = data.type === 'fixed_cents' 
    ? (parseInt(data.valueCents) || 0) * 100 
    : (parseInt(data.valueCents) || 0);
  
  const response = await fetch('/api/admin/promotions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      valueCents,
      minOrderCents: data.minOrderCents ? parseInt(data.minOrderCents) * 100 : null,
      maxUses: data.maxUses ? parseInt(data.maxUses) : null,
      maxUsesPerCustomer: data.maxUsesPerCustomer ? parseInt(data.maxUsesPerCustomer) : null,
      startsAt: data.startsAt || null,
      endsAt: data.endsAt || null,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create promotion');
  }
  return response.json();
}

// Update promotion
async function updatePromotion(id: string, data: Partial<PromotionFormData>): Promise<{ promotion: Promotion }> {
  const response = await fetch(`/api/admin/promotions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update promotion');
  }
  return response.json();
}

// Delete promotion
async function deletePromotion(id: string): Promise<void> {
  const response = await fetch(`/api/admin/promotions/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete promotion');
}

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch promotions
  const { data, isLoading, error } = useQuery({
    queryKey: ['promotions'],
    queryFn: fetchPromotions,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createPromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      closeModal();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromotionFormData> }) =>
      updatePromotion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      closeModal();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deletePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });

  const promotions = data?.promotions ?? [];

  const openCreateModal = () => {
    setEditingPromotion(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    // For fixed_cents type, convert cents to Rupiah for display. For percentage, value is basis points.
    const valueForDisplay = promotion.type === 'fixed_cents'
      ? (promotion.valueCents / 100).toString()
      : promotion.valueCents.toString();
    setFormData({
      code: promotion.code,
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type,
      valueCents: valueForDisplay,
      minOrderCents: promotion.minOrderCents ? (promotion.minOrderCents / 100).toString() : '',
      maxUses: promotion.maxUses?.toString() || '',
      maxUsesPerCustomer: promotion.maxUsesPerCustomer?.toString() || '',
      isActive: promotion.isActive,
      startsAt: promotion.startsAt ? promotion.startsAt.slice(0, 16) : '',
      endsAt: promotion.endsAt ? promotion.endsAt.slice(0, 16) : '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPromotion(null);
    setFormData(defaultFormData);
    setFormErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const errors: Record<string, string> = {};
    if (!formData.code.trim()) errors.code = 'Kode promo wajib diisi';
    if (!formData.name.trim()) errors.name = 'Nama promo wajib diisi';
    if (!formData.valueCents || parseInt(formData.valueCents) <= 0) {
      errors.valueCents = 'Nilai promo harus lebih dari 0';
    }
    if (formData.type === 'percentage' && parseInt(formData.valueCents) > 10000) {
      errors.valueCents = 'Persentase maksimal 100% (10000)';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus promo ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (promotion: Promotion) => {
    updateMutation.mutate({
      id: promotion.id,
      data: { isActive: !promotion.isActive },
    });
  };

  const isLoadingMutation = createMutation.isPending || updateMutation.isPending;

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatValue = (promotion: Promotion) => {
    if (promotion.type === 'percentage') {
      return `${(promotion.valueCents / 100).toFixed(0)}%`;
    }
    // fixed_cents: valueCents is in cents, convert to Rupiah for display
    return `Rp ${(promotion.valueCents / 100).toLocaleString('id-ID')}`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Promo</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola kode promo dan diskon</p>
        </div>
        <AnimatedButton onClick={openCreateModal} size="xs">
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Tambah Promo</span>
          </span>
        </AnimatedButton>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Icon icon="solar:tag-price-linear" className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500">Memuat promo...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <p className="text-red-600">Gagal memuat promo. Silakan coba lagi.</p>
        </div>
      )}

      {/* Promotion List */}
      {!isLoading && !error && (
        <>
          {promotions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Icon icon="solar:tag-price-linear" className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-600 font-medium tracking-tight mb-1">Belum ada promo</p>
              <p className="text-sm text-neutral-500 mb-6">
                Buat kode promo untuk memberikan diskon kepada pelanggan
              </p>
              <AnimatedButton onClick={openCreateModal} size="xs">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
                  <span className="text-sm font-medium tracking-wide">Tambah Promo</span>
                </span>
              </AnimatedButton>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-100">
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Kode</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Nama</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Tipe</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Nilai</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Min. Order</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Penggunaan</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Periode</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {promotions.map((promotion) => (
                      <tr key={promotion.id} className="hover:bg-neutral-50/50">
                        <td className="px-5 py-4">
                          <span className="font-mono text-sm font-medium text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                            {promotion.code}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-neutral-900">{promotion.name}</span>
                          {promotion.description && (
                            <p className="text-xs text-neutral-500 mt-0.5 truncate max-w-[200px]">{promotion.description}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            promotion.type === 'percentage' 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'bg-purple-50 text-purple-600'
                          }`}>
                            {promotion.type === 'percentage' ? 'Persentase' : 'Nominal'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-neutral-900">{formatValue(promotion)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-neutral-600">
                            {promotion.minOrderCents 
                              ? `Rp ${(promotion.minOrderCents / 100).toLocaleString('id-ID')}`
                              : '-'
                            }
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-neutral-600">
                            {promotion.usesCount}
                            {promotion.maxUses && ` / ${promotion.maxUses}`}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs text-neutral-500">
                            <div>Mulai: {formatDate(promotion.startsAt)}</div>
                            <div>Akhir: {formatDate(promotion.endsAt)}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleToggleActive(promotion)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                              promotion.isActive
                                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                            }`}
                          >
                            {promotion.isActive ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(promotion)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                              aria-label="Edit promo"
                            >
                              <Icon icon="solar:pen-linear" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(promotion.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              aria-label="Hapus promo"
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
                    {editingPromotion ? 'Edit Promo' : 'Tambah Promo Baru'}
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
                  {/* Code */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Kode Promo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent font-mono uppercase"
                      placeholder="SUMMER2024"
                    />
                    {formErrors.code && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Nama Promo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                      placeholder="Promo Musim Panas 2024"
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Deskripsi
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                      placeholder="Diskon khusus untuk pelanggan setia"
                    />
                  </div>

                  {/* Type & Value */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Tipe Promo
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as PromotionType })}
                        className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                      >
                        <option value="percentage">Persentase</option>
                        <option value="fixed_cents">Nominal (Rp)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Nilai <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.valueCents}
                        onChange={(e) => setFormData({ ...formData, valueCents: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                        placeholder={formData.type === 'percentage' ? '10' : '50000'}
                        min="1"
                      />
                      {formErrors.valueCents && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.valueCents}</p>
                      )}
                      {formData.type === 'percentage' && (
                        <p className="text-xs text-neutral-400 mt-1">Untuk persentase, masukkan angka 1-100</p>
                      )}
                    </div>
                  </div>

                  {/* Min Order & Max Uses */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Min. Pembelian (Rp)
                      </label>
                      <input
                        type="number"
                        value={formData.minOrderCents}
                        onChange={(e) => setFormData({ ...formData, minOrderCents: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                        placeholder="100000"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Maks. Penggunaan
                      </label>
                      <input
                        type="number"
                        value={formData.maxUses}
                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                        placeholder="100"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Valid Period */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Mulai Berlaku
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startsAt}
                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Berakhir
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endsAt}
                        onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                      />
                    </div>
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
                      {formData.isActive ? 'Promo aktif' : 'Promo nonaktif'}
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
                    : editingPromotion
                    ? 'Simpan Perubahan'
                    : 'Tambah Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

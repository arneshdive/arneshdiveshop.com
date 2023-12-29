'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Brand } from '@/lib/db/schema';

// Fetch all brands
async function fetchBrands(): Promise<{ brands: Brand[] }> {
  const response = await fetch('/api/brands');
  if (!response.ok) throw new Error('Failed to fetch brands');
  return response.json();
}

// Create brand
async function createBrand(data: { name: string; slug: string; description?: string | null; logoUrl?: string | null }): Promise<{ brand: Brand }> {
  const response = await fetch('/api/brands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create brand');
  }
  return response.json();
}

// Update brand
async function updateBrand(id: string, data: { name: string; slug: string; description?: string | null; logoUrl?: string | null }): Promise<{ brand: Brand }> {
  const response = await fetch(`/api/brands/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update brand');
  }
  return response.json();
}

// Delete brand
async function deleteBrand(id: string): Promise<void> {
  const response = await fetch(`/api/brands/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete brand');
  }
}

export function useBrands() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });

  const createMutation = useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; slug: string; description?: string | null; logoUrl?: string | null } }) =>
      updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });

  return {
    brands: query.data?.brands ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createBrand: createMutation.mutate,
    updateBrand: updateMutation.mutate,
    deleteBrand: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}

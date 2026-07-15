'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Brand } from '@/lib/db/schema';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Fetch brands with pagination
async function fetchBrands(page: number = 1): Promise<{ brands: Brand[]; pagination: PaginationInfo }> {
  const response = await fetch(`/api/brands?page=${page}`);
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

export function useBrands(page: number = 1) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['brands', page],
    queryFn: () => fetchBrands(page),
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
    pagination: query.data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
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

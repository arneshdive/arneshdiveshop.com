'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Category } from '@/lib/db/schema';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Fetch categories with pagination
async function fetchCategories(page: number = 1): Promise<{ categories: Category[]; pagination: PaginationInfo }> {
  const response = await fetch(`/api/categories?page=${page}`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

// Create category
async function createCategory(data: { name: string; slug: string; description?: string | null }): Promise<{ category: Category }> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create category');
  }
  return response.json();
}

// Update category
async function updateCategory(id: string, data: { name: string; slug: string; description?: string | null }): Promise<{ category: Category }> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update category');
  }
  return response.json();
}

// Delete category
async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete category');
  }
}

export function useCategories(page: number = 1) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['categories', page],
    queryFn: () => fetchCategories(page),
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; slug: string; description?: string | null } }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return {
    categories: query.data?.categories ?? [],
    pagination: query.data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
    isLoading: query.isLoading,
    error: query.error,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User, Customer, Address, Order } from '@/lib/db/schema';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// User with customer profile for list view
export interface UserWithCustomer extends User {
  customer: Customer | null;
}

// User with full details for detail view
export interface UserWithDetails extends User {
  customer: (Customer & {
    addresses: Address[];
    orders: Order[];
  }) | null;
}

// Fetch users with pagination and optional role filter
async function fetchUsers(
  page: number = 1,
  role?: 'customer' | 'admin'
): Promise<{ users: UserWithCustomer[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  if (role) params.set('role', role);
  const response = await fetch(`/api/users?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

// Fetch single user by ID
async function fetchUser(id: string): Promise<{ user: UserWithDetails }> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

// Block/unblock user
async function blockUser(id: string, blocked: boolean): Promise<{ user: User }> {
  const response = await fetch(`/api/users/${id}/block`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocked }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update user');
  }
  return response.json();
}

// Invite admin
async function inviteAdmin(email: string, role: 'admin' | 'super_admin'): Promise<{ user: User; message?: string }> {
  const response = await fetch('/api/users/invite-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to invite admin');
  }
  return response.json();
}

// Resend invitation
async function resendInvitation(userId: string): Promise<{ success: boolean; message?: string }> {
  const response = await fetch('/api/invitations/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to resend invitation');
  }
  return response.json();
}

export function useUsers(page: number = 1, role?: 'customer' | 'admin') {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['users', page, role],
    queryFn: () => fetchUsers(page, role),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => blockUser(id, blocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: 'admin' | 'super_admin' }) =>
      inviteAdmin(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const resendMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => resendInvitation(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    users: query.data?.users ?? [],
    pagination: query.data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
    isLoading: query.isLoading,
    error: query.error,
    blockUser: blockMutation.mutate,
    inviteAdmin: inviteMutation.mutate,
    resendInvitation: resendMutation.mutate,
    isBlocking: blockMutation.isPending,
    isInviting: inviteMutation.isPending,
    isResending: resendMutation.isPending,
    blockError: blockMutation.error,
    inviteError: inviteMutation.error,
    resendError: resendMutation.error,
  };
}

export function useUser(id: string | null) {
  const query = useQuery({
    queryKey: ['users', id],
    queryFn: () => fetchUser(id!),
    enabled: !!id,
  });

  return {
    user: query.data?.user ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

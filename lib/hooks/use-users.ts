'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User, Customer, Address, Order } from '@/lib/db/schema';

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

// Fetch all users
async function fetchUsers(): Promise<{ users: UserWithCustomer[] }> {
  const response = await fetch('/api/users');
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

export function useUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
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

  return {
    users: query.data?.users ?? [],
    isLoading: query.isLoading,
    error: query.error,
    blockUser: blockMutation.mutate,
    inviteAdmin: inviteMutation.mutate,
    isBlocking: blockMutation.isPending,
    isInviting: inviteMutation.isPending,
    blockError: blockMutation.error,
    inviteError: inviteMutation.error,
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

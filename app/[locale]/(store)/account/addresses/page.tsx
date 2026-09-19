'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@iconify/react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { AnimatedButton } from '@/components/ui/animated-button';
import { EmptyState } from '@/components/ui/empty-state';
import { AddressCard } from '@/components/account/address-card';
import { AddressForm } from '@/components/account/address-form';
import { toast } from 'sonner';

// Types matching API response
interface Address {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address1: string;
  address2: string | null;
  rajaongkirCityId: string;
  rajaongkirCityName: string | null;
  rajaongkirProvince: string | null;
  rajaongkirCity: string | null;
  rajaongkirDistrict: string | null;
  rajaongkirSubdistrict: string | null;
  rajaongkirPostalCode: string | null;
  isDefault: boolean;
}

// Fetch addresses from API
// NOTE: fallback error codes below (UNAUTHORIZED/FETCH_FAILED/etc.) are stable
// strings mapped to translated copy at display time in the component; server
// -provided `error.error` messages (when present) are passed through as-is.
async function fetchAddresses(): Promise<{ addresses: Address[] }> {
  const response = await fetch('/api/addresses');
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error('FETCH_FAILED');
  }
  return response.json();
}

// Create address mutation
async function createAddress(data: Partial<Address>): Promise<{ address: Address }> {
  const response = await fetch('/api/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'CREATE_FAILED');
  }
  return response.json();
}

// Update address mutation
async function updateAddress(id: string, data: Partial<Address>): Promise<{ address: Address }> {
  const response = await fetch(`/api/addresses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'UPDATE_FAILED');
  }
  return response.json();
}

// Delete address mutation
async function deleteAddress(id: string): Promise<void> {
  const response = await fetch(`/api/addresses/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'DELETE_FAILED');
  }
}

// Map a stable error code to its translated copy; pass through anything else
// (a message the server sent) unchanged.
function translateAddressError(t: ReturnType<typeof useTranslations>, message: string): string {
  const codes: Record<string, string> = {
    UNAUTHORIZED: t('addresses.errors.unauthorized'),
    FETCH_FAILED: t('addresses.errors.loadFailed'),
    CREATE_FAILED: t('addresses.errors.createFailed'),
    UPDATE_FAILED: t('addresses.errors.updateFailed'),
    DELETE_FAILED: t('addresses.errors.deleteFailed'),
  };
  return codes[message] ?? message;
}

export default function AddressesPage() {
  const t = useTranslations('account');
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Fetch addresses
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  });

  const addresses = data?.addresses ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsAdding(false);
      toast.success(t('addresses.toast.created'));
    },
    onError: (error: Error) => {
      toast.error(translateAddressError(t, error.message));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Address> }) =>
      updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setEditingAddress(null);
      toast.success(t('addresses.toast.updated'));
    },
    onError: (error: Error) => {
      toast.error(translateAddressError(t, error.message));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success(t('addresses.toast.deleted'));
    },
    onError: (error: Error) => {
      toast.error(translateAddressError(t, error.message));
    },
  });

  const handleSetDefault = (id: string) => {
    updateMutation.mutate({ id, data: { isDefault: true } });
  };

  const handleDelete = (id: string) => {
    if (confirm(t('addresses.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleSaveAddress = (addressData: Partial<Address>) => {
    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, data: addressData });
    } else {
      createMutation.mutate(addressData);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">{t('addresses.title')}</h1>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-500">{t('addresses.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - not logged in
  if (error?.message === 'UNAUTHORIZED') {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">{t('addresses.title')}</h1>
        <EmptyState
          icon="solar:lock-linear"
          title={t('addresses.loginRequired.title')}
          description={t('addresses.loginRequired.description')}
          ctaLabel={t('addresses.loginRequired.cta')}
          ctaHref="/auth"
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">{t('addresses.title')}</h1>
        <EmptyState
          icon="solar:danger-triangle-linear"
          title={t('addresses.errors.loadFailedTitle')}
          description={translateAddressError(t, error.message)}
          ctaLabel={t('addresses.errors.retry')}
          onClick={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{t('addresses.title')}</h1>
        <AnimatedButton
          onClick={() => setIsAdding(true)}
          disabled={isAdding || !!editingAddress}
          className="px-5 py-2.5 text-sm"
        >
          <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
          {t('addresses.addNew')}
        </AnimatedButton>
      </div>

      {isAdding || editingAddress ? (
        <AddressForm
          initialData={editingAddress}
          onSave={handleSaveAddress}
          onCancel={() => {
            setIsAdding(false);
            setEditingAddress(null);
          }}
        />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon="solar:map-point-linear"
          title={t('addresses.empty.title')}
          description={t('addresses.empty.description')}
          ctaLabel={t('addresses.addNew')}
          onClick={() => setIsAdding(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={{
                ...address,
                phone: address.phone || '',
              }}
              onSetDefault={handleSetDefault}
              onEdit={() => setEditingAddress(address)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

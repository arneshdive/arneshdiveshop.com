'use client';

import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils/cn';
import { useCheckoutStore } from '@/lib/store/checkout';
import { AddressForm } from '@/components/account/address-form';
import { mapAddressToCheckoutFields } from '@/lib/checkout/map-address-to-checkout-fields';

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

export function SavedAddressSelector() {
  const { setData } = useCheckoutStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectAddress = useCallback((address: Address) => {
    setSelectedId(address.id);
    setData(mapAddressToCheckoutFields(address));
  }, [setData]);

  // Load saved addresses on mount
  useEffect(() => {
    let isCancelled = false;

    async function loadAddresses() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/addresses');
        if (!response.ok) throw new Error('Gagal memuat alamat tersimpan');

        const result = await response.json();
        const fetchedAddresses: Address[] = result.addresses || [];

        if (isCancelled) return;

        setAddresses(fetchedAddresses);

        if (fetchedAddresses.length === 0) {
          setIsAddingNew(true);
        } else {
          const defaultAddress = fetchedAddresses.find((a) => a.isDefault) ?? fetchedAddresses[0]!;
          selectAddress(defaultAddress);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat alamat tersimpan');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadAddresses();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveNewAddress = async (addressData: Partial<Address>) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Gagal menyimpan alamat');
      }

      const result = await response.json();
      const newAddress: Address = result.address;

      setAddresses((prev) => [newAddress, ...prev]);
      selectAddress(newAddress);
      setIsAddingNew(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan alamat');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pb-8 mb-8 border-b border-neutral-200">
        <h2 className="text-lg font-semibold tracking-tight mb-6">Alamat Pengiriman</h2>
        <div className="flex items-center gap-2 text-neutral-500 text-sm py-4">
          <Icon icon="solar:spinner-linear" className="w-5 h-5 animate-spin" />
          Memuat alamat tersimpan...
        </div>
      </div>
    );
  }

  if (isAddingNew) {
    return (
      <div className="pb-8 mb-8 border-b border-neutral-200">
        <h2 className="text-lg font-semibold tracking-tight mb-6">Alamat Pengiriman</h2>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        <AddressForm
          onSave={handleSaveNewAddress}
          onCancel={() => setIsAddingNew(false)}
        />
        {isSaving && <p className="text-sm text-neutral-500 mt-3">Menyimpan alamat...</p>}
      </div>
    );
  }

  return (
    <div className="pb-8 mb-8 border-b border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Alamat Pengiriman</h2>
        <button
          type="button"
          onClick={() => setIsAddingNew(true)}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors inline-flex items-center gap-1.5"
        >
          <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
          Tambah Alamat Baru
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="space-y-3">
        {addresses.map((address) => {
          const isSelected = selectedId === address.id;
          const locationParts = [
            address.rajaongkirSubdistrict,
            address.rajaongkirDistrict,
            address.rajaongkirCity,
          ].filter(Boolean);
          const location = locationParts.length > 0
            ? locationParts.join(', ')
            : address.rajaongkirCityName || '';

          return (
            <label
              key={address.id}
              className={cn(
                'flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors',
                isSelected ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'
              )}
            >
              <input
                type="radio"
                name="savedAddress"
                checked={isSelected}
                onChange={() => selectAddress(address)}
                className="sr-only"
              />
              <div
                className={cn(
                  'mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                  isSelected ? 'border-neutral-900' : 'border-neutral-300'
                )}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-neutral-900" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    {address.name}
                  </span>
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                      <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
                      Utama
                    </span>
                  )}
                </div>
                <p className="font-medium text-sm">{address.firstName} {address.lastName}</p>
                <p className="text-sm text-neutral-500">{address.phone}</p>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {address.address1}
                  {address.address2 && <>, {address.address2}</>}
                  <br />
                  {location}
                  {address.rajaongkirPostalCode && <> {address.rajaongkirPostalCode}</>}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

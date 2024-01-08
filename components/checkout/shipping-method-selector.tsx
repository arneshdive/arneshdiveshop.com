'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCheckoutStore } from '@/lib/store/checkout';
import { useCartSync } from '@/lib/store/cart';
import { formatCurrency } from '@/lib/utils/format';
import { Icon } from '@iconify/react';
import type { ShippingRate } from '@/lib/rajaongkir/types';

interface ShippingMethodSelectorProps {
  // checkoutSessionId is no longer required for rate calculation
  checkoutSessionId?: string | null;
}

export function ShippingMethodSelector({ checkoutSessionId }: ShippingMethodSelectorProps) {
  // Ensure cart is synced
  useCartSync();

  const { data, setField } = useCheckoutStore();

  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch shipping rates when destination changes (don't require checkout session)
  useEffect(() => {
    if (!data.rajaongkirCityId) {
      setRates([]);
      return;
    }

    const fetchRates = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cityId: data.rajaongkirCityId,
            weight: undefined, // Will be calculated server-side from cart
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch shipping rates');
        }

        const result = await response.json();
        setRates(result.rates || []);

        // Set first rate as default if none selected
        if (result.rates?.length > 0 && !data.shippingMethod) {
          const firstRate = result.rates[0];
          setField('shippingMethod', `${firstRate.courier}-${firstRate.service}`.toLowerCase() as typeof data.shippingMethod);
        }
      } catch (err) {
        console.error('Error fetching shipping rates:', err);
        setError(err instanceof Error ? err.message : 'Gagal mengambil ongkos kirim');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, [checkoutSessionId, data.rajaongkirCityId, data.shippingMethod, setField]);

  // Generate a unique ID for a rate
  const getRateId = (rate: ShippingRate) => `${rate.courier}-${rate.service}`.toLowerCase();

  return (
    <div className="pb-8">
      <h2 className="text-lg font-semibold tracking-tight mb-6">
        Metode Pengiriman
      </h2>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 text-neutral-500">
          <Icon icon="solar:spinner-linear" className="w-5 h-5 animate-spin mr-2" />
          Menghitung ongkos kirim...
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-linear" className="w-4 h-4" />
            {error}
          </div>
          <p className="mt-1 text-amber-700">Silakan verifikasi alamat pengiriman Anda.</p>
        </div>
      )}

      {/* No destination selected */}
      {!data.rajaongkirCityId && !isLoading && (
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-600 text-sm">
          Pilih kelurahan/kecamatan tujuan untuk melihat pilihan kurir.
        </div>
      )}

      {/* No rates found */}
      {data.rajaongkirCityId && !isLoading && !error && rates.length === 0 && (
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-600 text-sm">
          Tidak ada kurir tersedia untuk alamat ini.
        </div>
      )}

      {/* Rates list */}
      {!isLoading && !error && rates.length > 0 && (
        <div className="space-y-3">
          {rates.map((rate) => {
            const rateId = getRateId(rate);
            const isSelected = data.shippingMethod === rateId;

            return (
              <label
                key={rateId}
                className={`flex items-center justify-between p-5 border-2 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={isSelected}
                    onChange={() => setField('shippingMethod', rateId as typeof data.shippingMethod)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-neutral-900'
                        : 'border-neutral-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{rate.name}</div>
                    <div className="text-sm text-neutral-500">
                      {rate.description} • {rate.etd}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{formatCurrency(rate.costCents)}</span>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

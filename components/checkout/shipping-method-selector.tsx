'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCheckoutStore } from '@/lib/store/checkout';
import { useCartSync } from '@/lib/store/cart';
import { formatCurrency } from '@/lib/utils/format';
import { Icon } from '@iconify/react';
import type { ShippingRate } from '@/lib/rajaongkir/types';

// Courier display names
const COURIER_NAMES: Record<string, string> = {
  jne: 'JNE',
  jnt: 'J&T Express',
  sicepat: 'SiCepat',
  idexpress: 'ID Express',
  anteraja: 'AnterAja',
  pos: 'POS Indonesia',
  tiki: 'TIKI',
};

// Category badges
const CATEGORY_BADGES: Record<string, { label: string; color: string }> = {
  same_day: { label: 'Same Day', color: 'bg-emerald-100 text-emerald-700' },
  next_day: { label: 'Next Day', color: 'bg-blue-100 text-blue-700' },
  regular: { label: 'Reguler', color: 'bg-neutral-100 text-neutral-600' },
  economy: { label: 'Hemat', color: 'bg-amber-100 text-amber-700' },
  cargo: { label: 'Cargo', color: 'bg-purple-100 text-purple-700' },
};

interface ShippingMethodSelectorProps {
  checkoutSessionId?: string | null;
}

export function ShippingMethodSelector({ checkoutSessionId: _checkoutSessionId }: ShippingMethodSelectorProps) {
  useCartSync();

  const { data, setField } = useCheckoutStore();

  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCouriers, setExpandedCouriers] = useState<Set<string>>(new Set());

  // Group rates by courier
  const groupedRates = useMemo(() => {
    const groups: Record<string, ShippingRate[]> = {};
    
    for (const rate of rates) {
      if (!groups[rate.courier]) {
        groups[rate.courier] = [];
      }
      groups[rate.courier]!.push(rate);
    }
    
    // Sort groups by cheapest option in each group
    const sortedEntries = Object.entries(groups).sort((a, b) => {
      const minA = Math.min(...a[1].map(r => r.costCents));
      const minB = Math.min(...b[1].map(r => r.costCents));
      return minA - minB;
    });
    
    const result = Object.fromEntries(sortedEntries);
    
    // Sort services within each group by category, then price
    for (const courier of Object.keys(result)) {
      result[courier]!.sort((a, b) => {
        // Same day first, then next day, etc.
        const categoryOrder = ['same_day', 'next_day', 'regular', 'economy', 'cargo'];
        const catA = categoryOrder.indexOf(a.category);
        const catB = categoryOrder.indexOf(b.category);
        
        if (catA !== catB) return catA - catB;
        return a.costCents - b.costCents;
      });
    }
    
    return result;
  }, [rates]);

  // Fetch shipping rates when destination changes
  useEffect(() => {
    if (!data.rajaongkirCityId) {
      setRates([]);
      return;
    }

    let isCancelled = false;

    const fetchRates = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cityId: data.rajaongkirCityId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch shipping rates');
        }

        const result = await response.json();
        
        if (!isCancelled) {
          setRates(result.rates || []);

          // Set first rate as default if none selected
          if (result.rates?.length > 0 && !data.shippingMethod) {
            const firstRate = result.rates[0];
            setField('shippingMethod', `${firstRate.courier}-${firstRate.service}`.toLowerCase() as typeof data.shippingMethod);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error fetching shipping rates:', err);
          setError(err instanceof Error ? err.message : 'Gagal mengambil ongkos kirim');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchRates();

    return () => {
      isCancelled = true;
    };
  }, [data.rajaongkirCityId]);

  // Expand courier that has selected rate
  useEffect(() => {
    if (data.shippingMethod) {
      const [courier] = data.shippingMethod.split('-');
      if (courier && !expandedCouriers.has(courier)) {
        setExpandedCouriers(new Set([courier]));
      }
    }
  }, [data.shippingMethod]);

  const getRateId = (rate: ShippingRate) => `${rate.courier}-${rate.service}`.toLowerCase();

  const toggleCourier = (courier: string) => {
    setExpandedCouriers(prev => {
      const next = new Set(prev);
      if (next.has(courier)) {
        next.delete(courier);
      } else {
        next.add(courier);
      }
      return next;
    });
  };

  const getCheapestRate = (courierRates: ShippingRate[]): ShippingRate | undefined => {
    if (courierRates.length === 0) return undefined;
    return courierRates.reduce((min, r) => r.costCents < min.costCents ? r : min, courierRates[0]!);
  };

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

      {/* Grouped rates */}
      {!isLoading && !error && Object.keys(groupedRates).length > 0 && (
        <div className="space-y-3">
          {Object.entries(groupedRates).map(([courier, courierRates]) => {
            const isExpanded = expandedCouriers.has(courier);
            const cheapest = getCheapestRate(courierRates);
            const hasSelection = courierRates.some(r => data.shippingMethod === getRateId(r));

            // Skip if no rates (shouldn't happen but satisfies TypeScript)
            if (!cheapest) return null;
            
            return (
              <div
                key={courier}
                className={`border-2 rounded-xl overflow-hidden transition-all ${
                  hasSelection ? 'border-neutral-900' : 'border-neutral-200'
                }`}
              >
                {/* Courier header - clickable to expand/collapse */}
                <button
                  type="button"
                  onClick={() => toggleCourier(courier)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      icon={isExpanded ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-right-linear'}
                      className="w-5 h-5 text-neutral-400"
                    />
                    <div>
                      <div className="font-medium">
                        {COURIER_NAMES[courier] || courier.toUpperCase()}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {courierRates.length} layanan • Mulai dari {formatCurrency(cheapest.costCents)}
                      </div>
                    </div>
                  </div>
                  {hasSelection && (
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-neutral-900" />
                      Terpilih
                    </div>
                  )}
                </button>

                {/* Expanded services */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 divide-y divide-neutral-100 rounded-b-xl overflow-hidden">
                    {courierRates.map((rate) => {
                      const rateId = getRateId(rate);
                      const isSelected = data.shippingMethod === rateId;

                      return (
                        <label
                          key={rateId}
                          className={`flex items-center justify-between p-4 pl-12 cursor-pointer transition-colors ${
                            isSelected ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              checked={isSelected}
                              onChange={() => setField('shippingMethod', rateId as typeof data.shippingMethod)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'border-neutral-900'
                                  : 'border-neutral-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-neutral-900" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{rate.name}</span>
                                {rate.category && CATEGORY_BADGES[rate.category] && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_BADGES[rate.category]!.color}`}>
                                    {CATEGORY_BADGES[rate.category]!.label}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {rate.description} • {rate.etd}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold">
                            {formatCurrency(rate.costCents)}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// lib/shipping/calculator.ts

import { rajaongkirClient } from '@/lib/rajaongkir/client';
import { getShopOriginCityId } from '@/lib/rajaongkir/city-matcher';
import type { ShippingRate } from '@/lib/rajaongkir/types';

const DEFAULT_PRODUCT_WEIGHT_GRAMS = 500;

interface CartItemForShipping {
  quantity: number;
  product?: {
    weightGrams?: number | null;
  } | null;
}

/**
 * Calculate total package weight in grams
 * Uses product weight if set, otherwise defaults to 500g
 */
export function calculateTotalWeight(items: CartItemForShipping[]): number {
  return items.reduce((total, item) => {
    const weight = item.product?.weightGrams ?? DEFAULT_PRODUCT_WEIGHT_GRAMS;
    return total + (weight * item.quantity);
  }, 0);
}

/**
 * Convert Rupiah to cents
 */
function rupiahToCents(rupiah: number): number {
  return rupiah; // 1 Rupiah = 1 cent in our system
}

/**
 * Format ETD string
 */
function formatEtd(etd: string): string {
  if (!etd) return 'N/A';
  return `${etd} hari`;
}

/**
 * Calculate shipping rates from RajaOngkir
 */
export async function calculateShippingRates(
  destinationCityId: string,
  items: CartItemForShipping[]
): Promise<{ rates: ShippingRate[]; weight: number; error?: string }> {
  const weight = calculateTotalWeight(items);

  // Minimum weight for RajaOngkir is 1 gram
  const weightForApi = Math.max(weight, 1);

  // Get shop origin
  const originCityId = await getShopOriginCityId();

  if (!originCityId) {
    return {
      rates: [],
      weight,
      error: 'Alamat toko belum dikonfigurasi. Silakan hubungi admin.',
    };
  }

  try {
    const results = await rajaongkirClient.calculateAllCouriers(
      originCityId,
      destinationCityId,
      weightForApi
    );

    const rates: ShippingRate[] = [];

    for (const result of results) {
      for (const cost of result.costs) {
        const costValue = cost.cost[0];
        if (costValue) {
          rates.push({
            courier: result.code,
            service: cost.service,
            name: `${result.name} ${cost.service}`,
            description: cost.description,
            costCents: rupiahToCents(costValue.value),
            etd: formatEtd(costValue.etd),
          });
        }
      }
    }

    // Sort by cost (cheapest first)
    rates.sort((a, b) => a.costCents - b.costCents);

    if (rates.length === 0) {
      return {
        rates: [],
        weight,
        error: 'Tidak ada kurir tersedia untuk alamat ini.',
      };
    }

    return { rates, weight };
  } catch (error) {
    console.error('Failed to calculate shipping rates:', error);
    return {
      rates: [],
      weight,
      error: error instanceof Error ? error.message : 'Gagal menghitung ongkos kirim.',
    };
  }
}

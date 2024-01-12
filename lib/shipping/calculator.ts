// lib/shipping/calculator.ts

import { rajaongkirClient } from '@/lib/rajaongkir/client';
import { getShopOriginCityId } from '@/lib/rajaongkir/city-matcher';
import { getActiveCouriers } from '@/lib/queries/settings';
import { getServiceInfo } from '@/lib/rajaongkir/service-names';
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
 * RajaOngkir returns costs in Rupiah, we need to convert to cents
 * 1 Rupiah = 100 cents in our convention
 */
function rupiahToCents(rupiah: number): number {
  return rupiah * 100;
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
    // Get active couriers from settings
    const activeCouriers = await getActiveCouriers();

    const results = await rajaongkirClient.calculateAllCouriers(
      originCityId,
      destinationCityId,
      weightForApi,
      activeCouriers
    );

    const rates: ShippingRate[] = [];

    for (const result of results) {
      for (const cost of result.costs) {
        const costValue = cost.cost[0];
        if (costValue) {
          const serviceInfo = getServiceInfo(result.code, cost.service, cost.description);
          
          // Skip cargo services (not relevant for regular e-commerce)
          if (serviceInfo.category === 'cargo') {
            continue;
          }
          
          rates.push({
            courier: result.code,
            service: cost.service,
            name: serviceInfo.name,
            description: serviceInfo.description,
            category: serviceInfo.category,
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

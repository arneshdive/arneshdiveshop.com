// lib/rajaongkir/client.ts

import type {
  RajaongkirProvince,
  RajaongkirCity,
  RajaongkirCostQuery,
  RajaongkirCostResult,
  RajaongkirApiResponse,
} from './types';

const RAJAONGKIR_BASE_URL = process.env.RAJAONGKIR_BASE_URL || 'https://api.rajaongkir.com/starter';
const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;

if (!RAJAONGKIR_API_KEY) {
  console.warn('RAJAONGKIR_API_KEY is not set. Shipping calculation will use fallback rates.');
}

/**
 * RajaOngkir API Client (Starter tier)
 * Supports: JNE, POS, TIKI
 */
export const rajaongkirClient = {
  /**
   * Get all provinces
   * Endpoint: /province
   */
  async getProvinces(): Promise<RajaongkirProvince[]> {
    if (!RAJAONGKIR_API_KEY) {
      throw new Error('RAJAONGKIR_API_KEY is not configured');
    }

    const response = await fetch(`${RAJAONGKIR_BASE_URL}/province`, {
      headers: {
        key: RAJAONGKIR_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`RajaOngkir API error: ${response.status}`);
    }

    const data: RajaongkirApiResponse<RajaongkirProvince[]> = await response.json();
    
    if (data.rajaongkir.status.code !== 200) {
      throw new Error(`RajaOngkir error: ${data.rajaongkir.status.description}`);
    }

    return data.rajaongkir.results;
  },

  /**
   * Get all cities (optionally filtered by province)
   * Endpoint: /city
   */
  async getCities(provinceId?: string): Promise<RajaongkirCity[]> {
    if (!RAJAONGKIR_API_KEY) {
      throw new Error('RAJAONGKIR_API_KEY is not configured');
    }

    const url = provinceId 
      ? `${RAJAONGKIR_BASE_URL}/city?province=${provinceId}`
      : `${RAJAONGKIR_BASE_URL}/city`;

    const response = await fetch(url, {
      headers: {
        key: RAJAONGKIR_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`RajaOngkir API error: ${response.status}`);
    }

    const data: RajaongkirApiResponse<RajaongkirCity[]> = await response.json();
    
    if (data.rajaongkir.status.code !== 200) {
      throw new Error(`RajaOngkir error: ${data.rajaongkir.status.description}`);
    }

    return data.rajaongkir.results;
  },

  /**
   * Calculate shipping cost
   * Endpoint: /cost
   */
  async calculateCost(query: RajaongkirCostQuery): Promise<RajaongkirCostResult> {
    if (!RAJAONGKIR_API_KEY) {
      throw new Error('RAJAONGKIR_API_KEY is not configured');
    }

    const response = await fetch(`${RAJAONGKIR_BASE_URL}/cost`, {
      method: 'POST',
      headers: {
        key: RAJAONGKIR_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        origin: query.origin,
        destination: query.destination,
        weight: query.weight.toString(),
        courier: query.courier,
      }),
    });

    if (!response.ok) {
      throw new Error(`RajaOngkir API error: ${response.status}`);
    }

    const data: RajaongkirApiResponse<RajaongkirCostResult[]> = await response.json();
    
    if (data.rajaongkir.status.code !== 200) {
      throw new Error(`RajaOngkir error: ${data.rajaongkir.status.description}`);
    }

    return data.rajaongkir.results[0];
  },

  /**
   * Calculate costs for all available couriers
   */
  async calculateAllCouriers(
    origin: string,
    destination: string,
    weight: number
  ): Promise<RajaongkirCostResult[]> {
    const couriers: Array<'jne' | 'pos' | 'tiki'> = ['jne', 'pos', 'tiki'];
    
    const results = await Promise.all(
      couriers.map(courier => 
        this.calculateCost({ origin, destination, weight, courier })
          .catch(err => {
            console.error(`Failed to get ${courier} rates:`, err);
            return null;
          })
      )
    );

    return results.filter((r): r is RajaongkirCostResult => r !== null);
  },
};

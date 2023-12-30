// lib/rajaongkir/client.ts

import type {
  RajaongkirProvince,
  RajaongkirCity,
  RajaongkirCostQuery,
  RajaongkirCostResult,
} from './types';

/**
 * RajaOngkir API v2 Client (Komerce)
 * New API endpoint: rajaongkir.komerce.id
 * 
 * Supported couriers: jne, jnt, sicepat, idexpress, anteraja, pos, tiki, etc.
 */

const RAJAONGKIR_BASE_URL = process.env.RAJAONGKIR_BASE_URL || 'https://rajaongkir.komerce.id/api/v1';
const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;

if (!RAJAONGKIR_API_KEY) {
  console.warn('RAJAONGKIR_API_KEY is not set. Shipping calculation will not work.');
}

export const rajaongkirClient = {
  /**
   * Get all provinces
   * Endpoint: GET /destination/province
   */
  async getProvinces(): Promise<RajaongkirProvince[]> {
    if (!RAJAONGKIR_API_KEY) {
      throw new Error('RAJAONGKIR_API_KEY is not configured');
    }

    const response = await fetch(`${RAJAONGKIR_BASE_URL}/destination/province`, {
      headers: {
        key: RAJAONGKIR_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`RajaOngkir API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.meta?.code !== 200) {
      throw new Error(`RajaOngkir error: ${data.meta?.message || 'Unknown error'}`);
    }

    // Transform to our format (string ids)
    return data.data.map((p: { id: number; name: string }) => ({
      id: String(p.id),
      name: p.name,
    }));
  },

  /**
   * Get cities by province ID
   * Endpoint: GET /destination/city/{province_id}
   * Note: This returns districts, not cities! Use direct search for accurate subdistrict IDs.
   */
  async getCities(provinceId: string): Promise<RajaongkirCity[]> {
    if (!RAJAONGKIR_API_KEY) {
      throw new Error('RAJAONGKIR_API_KEY is not configured');
    }

    const response = await fetch(`${RAJAONGKIR_BASE_URL}/destination/city/${provinceId}`, {
      headers: {
        key: RAJAONGKIR_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`RajaOngkir API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.meta?.code !== 200) {
      throw new Error(`RajaOngkir error: ${data.meta?.message || 'Unknown error'}`);
    }

    // Transform to our format - these are actually districts
    return data.data.map((c: { id: number; name: string; zip_code?: string }) => ({
      id: String(c.id),
      name: c.name,
      type: 'Kecamatan',
      provinceId,
      province: '',
      postalCode: c.zip_code || '',
    }));
  },

  /**
   * Search domestic destination (direct search method)
   * Endpoint: GET /destination/domestic-destination?search={query}
   * This is the recommended method - returns subdistrict IDs for accurate pricing
   */
  async searchDestination(query: string, limit = 10): Promise<RajaongkirCity[]> {
    if (!RAJAONGKIR_API_KEY) {
      throw new Error('RAJAONGKIR_API_KEY is not configured');
    }

    const url = `${RAJAONGKIR_BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(query)}&limit=${limit}&offset=0`;

    console.log('[RajaOngkir] Searching:', url);

    const response = await fetch(url, {
      headers: {
        key: RAJAONGKIR_API_KEY,
      },
      cache: 'no-store',
    });

    console.log('[RajaOngkir] Response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('[RajaOngkir] Error response:', text);
      throw new Error(`RajaOngkir API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.meta?.code !== 200) {
      throw new Error(`RajaOngkir error: ${data.meta?.message || 'Unknown error'}`);
    }

    // Transform to our format
    // API returns subdistricts with full location info
    return (data.data || []).map((d: { 
      id: number; 
      label: string;
      province_name: string;
      city_name: string;
      district_name: string;
      subdistrict_name: string;
      zip_code: string;
    }) => ({
      id: String(d.id),
      name: d.label, // Full label: "DAUH PURI, DENPASAR BARAT, DENPASAR, BALI, 80113"
      type: 'Kelurahan',
      provinceId: '',
      province: d.province_name,
      city: d.city_name,
      district: d.district_name,
      subdistrict: d.subdistrict_name,
      postalCode: d.zip_code,
    }));
  },

  /**
   * Calculate shipping cost
   * Endpoint: POST /calculate/domestic-cost
   */
  async calculateCost(query: RajaongkirCostQuery): Promise<RajaongkirCostResult> {
    if (!RAJAONGKIR_API_KEY) {
      throw new Error('RAJAONGKIR_API_KEY is not configured');
    }

    const response = await fetch(`${RAJAONGKIR_BASE_URL}/calculate/domestic-cost`, {
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
        price: 'lowest',
      }),
    });

    if (!response.ok) {
      throw new Error(`RajaOngkir API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.meta?.code !== 200) {
      throw new Error(`RajaOngkir error: ${data.meta?.message || 'Unknown error'}`);
    }

    // Transform response
    return {
      code: query.courier,
      name: data.data?.[0]?.name || query.courier.toUpperCase(),
      costs: (data.data || []).map((service: {
        service: string;
        description: string;
        cost: number;
        etd: string;
      }) => ({
        service: service.service,
        description: service.description,
        cost: [{
          value: service.cost,
          etd: service.etd,
          note: '',
        }],
      })),
    };
  },

  /**
   * Calculate costs for all available couriers
   * Supported couriers: jne, jnt, sicepat, idexpress, anteraja, pos, tiki
   */
  async calculateAllCouriers(
    origin: string,
    destination: string,
    weight: number
  ): Promise<RajaongkirCostResult[]> {
    const couriers = ['jne', 'jnt', 'sicepat', 'idexpress', 'anteraja', 'pos', 'tiki'];
    
    const results = await Promise.all(
      couriers.map(courier => 
        this.calculateCost({ origin, destination, weight, courier: courier as 'jne' | 'pos' | 'tiki' })
          .catch(err => {
            console.error(`Failed to get ${courier} rates:`, err);
            return null;
          })
      )
    );

    return results.filter((r): r is RajaongkirCostResult => r !== null);
  },
};

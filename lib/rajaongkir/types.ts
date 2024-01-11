// lib/rajaongkir/types.ts

/**
 * RajaOngkir API Types
 * Starter tier supports: JNE, POS, TIKI
 */

export interface RajaongkirProvince {
  id: string;
  name: string;
}

export interface RajaongkirCity {
  id: string;
  name: string;
  type: string; // "Kabupaten", "Kota", "Kecamatan", "Kelurahan"
  provinceId: string;
  province: string;
  city?: string;       // City name (for subdistricts)
  district?: string;   // District name (for subdistricts)
  subdistrict?: string; // Subdistrict name
  postalCode: string;
}

export interface RajaongkirCostQuery {
  origin: string; // city_id
  destination: string; // city_id
  weight: number; // in grams
  courier: 'jne' | 'pos' | 'tiki';
}

export interface RajaongkirCostResult {
  code: string; // 'jne', 'pos', 'tiki'
  name: string; // 'Jalur Nugraha Ekakurir (JNE)'
  costs: RajaongkirServiceCost[];
}

export interface RajaongkirServiceCost {
  service: string; // 'REG', 'YES', 'ONS'
  description: string; // 'Layanan Reguler'
  cost: {
    value: number; // In Rupiah
    etd: string; // '1-2' (days)
    note: string;
  }[];
}

export interface ShippingRate {
  courier: string; // 'jne', 'pos', 'tiki'
  service: string; // 'REG', 'YES', etc.
  name: string; // 'Reguler'
  description: string; // 'Pengiriman standar 1-2 hari'
  category: 'same_day' | 'next_day' | 'regular' | 'economy' | 'cargo';
  costCents: number; // Converted to cents
  etd: string; // '1-2 hari'
}

export interface RajaongkirApiResponse<T> {
  rajaongkir: {
    status: {
      code: number;
      description: string;
    };
    results: T;
  };
}

export interface CityMatchResult {
  cityId: string;
  cityName: string;
  provinceId: string;
  provinceName: string;
  confidence: 'exact' | 'fuzzy' | 'none';
}

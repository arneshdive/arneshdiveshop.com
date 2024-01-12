// lib/rajaongkir/service-names.ts

/**
 * Human-friendly service names for RajaOngkir courier services
 * 
 * Format: courier_service => { name, description, category }
 * 
 * Categories:
 * - "same_day" → Same day delivery
 * - "next_day" → Next day delivery  
 * - "regular" → Standard delivery (2-3 days)
 * - "economy" → Budget/longer delivery
 * - "cargo" → Large items/trucking
 */

export interface ServiceInfo {
  name: string;
  description: string;
  category: 'same_day' | 'next_day' | 'regular' | 'economy' | 'cargo';
}

export const SERVICE_INFO: Record<string, ServiceInfo> = {
  // ===========================================
  // JNE (Jalur Nugraha Ekakurir)
  // ===========================================
  'jne_REG': {
    name: 'Reguler',
    description: 'Pengiriman standar 1-2 hari',
    category: 'regular',
  },
  'jne_YES': {
    name: 'YES (Yakin Esok Sampai)',
    description: 'Garansi sampai besok',
    category: 'next_day',
  },
  'jne_SPS': {
    name: 'Super Speed',
    description: 'Same day delivery',
    category: 'same_day',
  },
  'jne_JTR': {
    name: 'Trucking',
    description: 'Untuk barang besar',
    category: 'cargo',
  },
  'jne_JTR<130': {
    name: 'Trucking <130kg',
    description: 'Untuk barang besar',
    category: 'cargo',
  },
  'jne_JTR>130': {
    name: 'Trucking >130kg',
    description: 'Untuk barang besar',
    category: 'cargo',
  },
  'jne_JTR>200': {
    name: 'Trucking >200kg',
    description: 'Untuk barang besar',
    category: 'cargo',
  },

  // ===========================================
  // J&T Express
  // ===========================================
  'jnt_EZ': {
    name: 'Express',
    description: 'Pengiriman standar',
    category: 'regular',
  },
  'jnt_CTC': {
    name: 'City to City',
    description: 'Antar kota',
    category: 'regular',
  },
  'jnt_CTCYES': {
    name: 'City to City Express',
    description: 'Antar kota cepat',
    category: 'next_day',
  },

  // ===========================================
  // SiCepat
  // ===========================================
  'sicepat_REG': {
    name: 'Reguler',
    description: 'Pengiriman standar 1-2 hari',
    category: 'regular',
  },
  'sicepat_BEST': {
    name: 'BEST (Besok Sampai Tujuan)',
    description: 'Garansi sampai besok',
    category: 'next_day',
  },
  'sicepat_HALU': {
    name: 'HALU (Harga Mulai Lima Ribu)',
    description: 'Paling hemat',
    category: 'economy',
  },
  'sicepat_GOKIL': {
    name: 'Cargo',
    description: 'Per kg, minimal 10kg',
    category: 'cargo',
  },
  'sicepat_SIUNT': {
    name: 'SIUNT',
    description: 'Pengiriman khusus',
    category: 'regular',
  },

  // ===========================================
  // AnterAja
  // ===========================================
  'anteraja_REG': {
    name: 'Reguler',
    description: 'Pengiriman standar 1-2 hari',
    category: 'regular',
  },
  'anteraja_ND': {
    name: 'Next Day',
    description: 'Garansi sampai besok',
    category: 'next_day',
  },
  'anteraja_SD': {
    name: 'Same Day',
    description: 'Sampai hari ini',
    category: 'same_day',
  },

  // ===========================================
  // TIKI
  // ===========================================
  'tiki_REG': {
    name: 'Reguler',
    description: 'Pengiriman standar 3 hari',
    category: 'regular',
  },
  'tiki_ECO': {
    name: 'Economy',
    description: 'Paling hemat 5 hari',
    category: 'economy',
  },
  'tiki_ONS': {
    name: 'ONS (Over Night Service)',
    description: 'Garansi sampai besok',
    category: 'next_day',
  },
  'tiki_SDS': {
    name: 'Same Day',
    description: 'Sampai hari ini',
    category: 'same_day',
  },
  'tiki_DAT': {
    name: 'Daun',
    description: 'Pengiriman hemat',
    category: 'economy',
  },
  'tiki_SRP': {
    name: 'Sirip',
    description: 'Pengiriman hemat',
    category: 'economy',
  },
  'tiki_TRX': {
    name: 'Tirex',
    description: 'Pengiriman hemat',
    category: 'economy',
  },
  'tiki_TRC': {
    name: 'Trucking',
    description: 'Untuk barang besar',
    category: 'cargo',
  },
  'tiki_T15': {
    name: 'Motor <150cc',
    description: 'Pengiriman motor',
    category: 'cargo',
  },
  'tiki_T25': {
    name: 'Motor <250cc',
    description: 'Pengiriman motor',
    category: 'cargo',
  },
  'tiki_T60': {
    name: 'Motor <600cc',
    description: 'Pengiriman motor',
    category: 'cargo',
  },

  // ===========================================
  // POS Indonesia
  // ===========================================
  'pos_Pos Reguler': {
    name: 'Reguler',
    description: 'Pengiriman standar 2 hari',
    category: 'regular',
  },
  'pos_Pos Nextday': {
    name: 'Next Day',
    description: 'Garansi sampai besok',
    category: 'next_day',
  },
  'pos_PAKETPOS DANGEROUS GOODS': {
    name: 'Dangerous Goods',
    description: 'Barang berbahaya',
    category: 'cargo', // Not relevant for regular e-commerce
  },
  'pos_PAKETPOS VALUABLE GOODS': {
    name: 'Valuable Goods',
    description: 'Barang berharga',
    category: 'cargo', // Not relevant for regular e-commerce
  },
  'pos_POS KARGO': {
    name: 'Kargo',
    description: 'Untuk barang besar 7-14 hari',
    category: 'cargo',
  },

  // ===========================================
  // ID Express
  // ===========================================
  'idexpress_REG': {
    name: 'Reguler',
    description: 'Pengiriman standar',
    category: 'regular',
  },
  'idexpress_IDS': {
    name: 'Same Day',
    description: 'Sampai hari ini',
    category: 'same_day',
  },
  'idexpress_IDE': {
    name: 'Express',
    description: 'Pengiriman cepat',
    category: 'next_day',
  },
};

/**
 * Get human-friendly service info
 * Falls back to API description if not in mapping
 */
export function getServiceInfo(
  courier: string,
  service: string,
  apiDescription?: string
): ServiceInfo {
  const key = `${courier}_${service}`;
  const mapped = SERVICE_INFO[key];
  
  if (mapped) {
    return mapped;
  }
  
  // Fallback: infer from API description
  return {
    name: service,
    description: apiDescription || service,
    category: inferCategory(service, apiDescription),
  };
}

/**
 * Infer category from service name/description
 */
function inferCategory(service: string, description?: string): ServiceInfo['category'] {
  const text = `${service} ${description || ''}`.toLowerCase();
  
  if (text.includes('same day') || text.includes('sds') || text.includes('super speed')) {
    return 'same_day';
  }
  if (text.includes('next day') || text.includes('yes') || text.includes('besok') || text.includes('ons')) {
    return 'next_day';
  }
  if (text.includes('cargo') || text.includes('trucking') || text.includes('kargo') || text.includes('gokil') || text.includes('motor')) {
    return 'cargo';
  }
  if (text.includes('eco') || text.includes('economy') || text.includes('hemat') || text.includes('halu')) {
    return 'economy';
  }
  
  return 'regular';
}

/**
 * Category display order (lower = shown first)
 */
export const CATEGORY_ORDER: ServiceInfo['category'][] = [
  'same_day',
  'next_day', 
  'regular',
  'economy',
  'cargo',
];

/**
 * Category labels for UI
 */
export const CATEGORY_LABELS: Record<ServiceInfo['category'], string> = {
  same_day: 'Same Day',
  next_day: 'Next Day',
  regular: 'Reguler',
  economy: 'Economy',
  cargo: 'Cargo',
};

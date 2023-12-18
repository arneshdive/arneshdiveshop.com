// lib/rajaongkir/city-matcher.ts

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import type { CityMatchResult } from './types';

/**
 * Normalize city name for matching
 * - Lowercase
 * - Remove "Kabupaten ", "Kota ", "Kab. ", "Kota "
 * - Remove special characters
 */
function normalizeCityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(kabupaten|kab\.?|kota)\s*/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Normalize province name for matching
 */
function normalizeProvinceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Match customer address to RajaOngkir city_id
 * Uses cached cities from database
 */
export async function matchCityToRajaOngkir(
  cityName: string,
  provinceName: string
): Promise<CityMatchResult | null> {
  const normalizedCity = normalizeCityName(cityName);
  const normalizedProvince = normalizeProvinceName(provinceName);

  // Try exact match first (city + province)
  const exactMatch = await db.query.rajaongkirCities.findFirst({
    where: (cities) => {
      return sql`LOWER(REPLACE(REPLACE(REPLACE(${cities.name}, 'Kabupaten ', ''), 'Kota ', ''), 'Kab. ', '')) LIKE ${'%' + normalizedCity + '%'} AND LOWER(REPLACE(${cities.province}, ' ', '')) LIKE ${'%' + normalizedProvince + '%'}`;
    },
  });

  if (exactMatch) {
    return {
      cityId: exactMatch.id,
      cityName: exactMatch.name,
      provinceId: exactMatch.provinceId,
      provinceName: exactMatch.province,
      confidence: 'exact',
    };
  }

  // Try fuzzy match (city only, ignore province)
  const fuzzyMatch = await db.query.rajaongkirCities.findFirst({
    where: (cities) => {
      return sql`LOWER(REPLACE(REPLACE(REPLACE(${cities.name}, 'Kabupaten ', ''), 'Kota ', ''), 'Kab. ', '')) LIKE ${'%' + normalizedCity + '%'}`;
    },
  });

  if (fuzzyMatch) {
    return {
      cityId: fuzzyMatch.id,
      cityName: fuzzyMatch.name,
      provinceId: fuzzyMatch.provinceId,
      provinceName: fuzzyMatch.province,
      confidence: 'fuzzy',
    };
  }

  return null;
}

/**
 * Get shop origin city_id from shopSettings
 * If not cached, try to match from address
 */
export async function getShopOriginCityId(): Promise<string | null> {
  const settings = await db.query.shopSettings.findFirst();
  
  if (!settings) {
    console.error('Shop settings not found');
    return null;
  }

  // Return cached city_id if available
  if (settings.rajaongkirCityId) {
    return settings.rajaongkirCityId;
  }

  // Try to match from address if we have province/city info
  // For now, return null - admin should sync cities and set up address
  console.warn('Shop origin city_id not set. Please update shop settings with a valid address.');
  return null;
}

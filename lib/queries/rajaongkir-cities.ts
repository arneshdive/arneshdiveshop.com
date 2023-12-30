// lib/queries/rajaongkir-cities.ts

import { db } from '@/lib/db';
import { rajaongkirCities, rajaongkirProvinces } from '@/lib/db/schema';
import { rajaongkirClient } from '@/lib/rajaongkir/client';

/**
 * Sync all provinces from RajaOngkir API to database
 */
export async function syncProvinces(): Promise<number> {
  const provinces = await rajaongkirClient.getProvinces();
  
  // Clear existing
  await db.delete(rajaongkirProvinces);
  
  // Insert new
  await db.insert(rajaongkirProvinces).values(
    provinces.map(p => ({
      id: p.id,
      name: p.name,
    }))
  );

  return provinces.length;
}

/**
 * Sync all cities from RajaOngkir API to database
 * Fetches cities for each province
 */
export async function syncCities(): Promise<number> {
  // First get all provinces
  const provinces = await rajaongkirClient.getProvinces();
  
  // Clear existing cities
  await db.delete(rajaongkirCities);
  
  // Fetch cities for each province
  let totalCities = 0;
  
  for (const province of provinces) {
    try {
      const cities = await rajaongkirClient.getCities(province.id);
      
      if (cities.length > 0) {
        await db.insert(rajaongkirCities).values(
          cities.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            provinceId: province.id,
            province: province.name,
            postalCode: c.postalCode || null,
          }))
        );
        totalCities += cities.length;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to sync cities for province ${province.name}:`, error);
    }
  }

  return totalCities;
}

/**
 * Sync all RajaOngkir data (provinces + cities)
 */
export async function syncAllRajaongkirData(): Promise<{
  provinces: number;
  cities: number;
}> {
  const provinces = await syncProvinces();
  const cities = await syncCities();
  
  return { provinces, cities };
}

/**
 * Search cities using RajaOngkir direct search API
 * This is better for checkout flow - uses subdistrict IDs for accurate pricing
 */
export async function searchDestinations(query: string, limit = 10) {
  return rajaongkirClient.searchDestination(query, limit);
}

/**
 * Get city by ID from local cache
 */
export async function getCityById(cityId: string) {
  return db.query.rajaongkirCities.findFirst({
    where: (cities, { eq }) => eq(cities.id, cityId),
  });
}

/**
 * Search cities by name from local cache
 */
export async function searchCities(query: string, limit = 10) {
  const searchPattern = `%${query.toLowerCase()}%`;
  
  return db.query.rajaongkirCities.findMany({
    where: (cities, { sql }) => sql`LOWER(${cities.name}) LIKE ${searchPattern}`,
    limit,
    with: {
      province: true,
    },
  });
}

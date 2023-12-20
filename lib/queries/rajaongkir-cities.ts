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
 */
export async function syncCities(): Promise<number> {
  const cities = await rajaongkirClient.getCities();
  
  // Clear existing
  await db.delete(rajaongkirCities);
  
  // Insert new
  await db.insert(rajaongkirCities).values(
    cities.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      provinceId: c.provinceId,
      province: c.province,
      postalCode: c.postalCode || null,
    }))
  );

  return cities.length;
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
 * Get city by ID
 */
export async function getCityById(cityId: string) {
  return db.query.rajaongkirCities.findFirst({
    where: (cities, { eq }) => eq(cities.id, cityId),
  });
}

/**
 * Search cities by name
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

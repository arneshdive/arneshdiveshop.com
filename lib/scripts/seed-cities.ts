import { db } from '@/lib/db';
import { rajaongkirCities, rajaongkirProvinces } from '@/lib/db/schema';

/**
 * Seed Indonesian cities directly into database
 * Run with: npx tsx lib/scripts/seed-cities.ts
 */

// Major Indonesian cities for shipping (simplified list)
const provinces = [
  { id: '1', name: 'Bali' },
  { id: '2', name: 'Banten' },
  { id: '3', name: 'DKI Jakarta' },
  { id: '4', name: 'Jawa Barat' },
  { id: '5', name: 'Jawa Tengah' },
  { id: '6', name: 'Jawa Timur' },
  { id: '7', name: 'DI Yogyakarta' },
  { id: '8', name: 'Nusa Tenggara Barat' },
  { id: '9', name: 'Nusa Tenggara Timur' },
  { id: '10', name: 'Sulawesi Selatan' },
  { id: '11', name: 'Sumatera Utara' },
  { id: '12', name: 'Sumatera Barat' },
];

const cities = [
  // Bali
  { id: '17', name: 'Denpasar', type: 'Kota', provinceId: '1', province: 'Bali' },
  { id: '18', name: 'Badung', type: 'Kabupaten', provinceId: '1', province: 'Bali' },
  { id: '19', name: 'Gianyar', type: 'Kabupaten', provinceId: '1', province: 'Bali' },
  { id: '20', name: 'Tabanan', type: 'Kabupaten', provinceId: '1', province: 'Bali' },
  { id: '21', name: 'Bangli', type: 'Kabupaten', provinceId: '1', province: 'Bali' },
  { id: '22', name: 'Buleleng', type: 'Kabupaten', provinceId: '1', province: 'Bali' },
  { id: '23', name: 'Karangasem', type: 'Kabupaten', provinceId: '1', province: 'Bali' },
  { id: '24', name: 'Klungkung', type: 'Kabupaten', provinceId: '1', province: 'Bali' },
  
  // Jakarta
  { id: '152', name: 'Jakarta Pusat', type: 'Kota', provinceId: '3', province: 'DKI Jakarta' },
  { id: '153', name: 'Jakarta Utara', type: 'Kota', provinceId: '3', province: 'DKI Jakarta' },
  { id: '154', name: 'Jakarta Barat', type: 'Kota', provinceId: '3', province: 'DKI Jakarta' },
  { id: '155', name: 'Jakarta Selatan', type: 'Kota', provinceId: '3', province: 'DKI Jakarta' },
  { id: '156', name: 'Jakarta Timur', type: 'Kota', provinceId: '3', province: 'DKI Jakarta' },
  
  // Jawa Barat
  { id: '79', name: 'Bandung', type: 'Kota', provinceId: '4', province: 'Jawa Barat' },
  { id: '80', name: 'Bandung Barat', type: 'Kabupaten', provinceId: '4', province: 'Jawa Barat' },
  { id: '81', name: 'Bekasi', type: 'Kota', provinceId: '4', province: 'Jawa Barat' },
  { id: '82', name: 'Bekasi', type: 'Kabupaten', provinceId: '4', province: 'Jawa Barat' },
  { id: '83', name: 'Bogor', type: 'Kota', provinceId: '4', province: 'Jawa Barat' },
  { id: '84', name: 'Bogor', type: 'Kabupaten', provinceId: '4', province: 'Jawa Barat' },
  { id: '85', name: 'Cimahi', type: 'Kota', provinceId: '4', province: 'Jawa Barat' },
  { id: '86', name: 'Cianjur', type: 'Kabupaten', provinceId: '4', province: 'Jawa Barat' },
  { id: '87', name: 'Depok', type: 'Kota', provinceId: '4', province: 'Jawa Barat' },
  { id: '88', name: 'Sukabumi', type: 'Kota', provinceId: '4', province: 'Jawa Barat' },
  { id: '89', name: 'Sukabumi', type: 'Kabupaten', provinceId: '4', province: 'Jawa Barat' },
  { id: '90', name: 'Tasikmalaya', type: 'Kota', provinceId: '4', province: 'Jawa Barat' },
  
  // Jawa Tengah
  { id: '139', name: 'Semarang', type: 'Kota', provinceId: '5', province: 'Jawa Tengah' },
  { id: '140', name: 'Semarang', type: 'Kabupaten', provinceId: '5', province: 'Jawa Tengah' },
  { id: '141', name: 'Solo', type: 'Kota', provinceId: '5', province: 'Jawa Tengah' },
  { id: '142', name: 'Magelang', type: 'Kota', provinceId: '5', province: 'Jawa Tengah' },
  { id: '143', name: 'Pekalongan', type: 'Kota', provinceId: '5', province: 'Jawa Tengah' },
  { id: '144', name: 'Salatiga', type: 'Kota', provinceId: '5', province: 'Jawa Tengah' },
  { id: '145', name: 'Tegal', type: 'Kota', provinceId: '5', province: 'Jawa Tengah' },
  
  // Jawa Timur
  { id: '161', name: 'Surabaya', type: 'Kota', provinceId: '6', province: 'Jawa Timur' },
  { id: '162', name: 'Malang', type: 'Kota', provinceId: '6', province: 'Jawa Timur' },
  { id: '163', name: 'Malang', type: 'Kabupaten', provinceId: '6', province: 'Jawa Timur' },
  { id: '164', name: 'Sidoarjo', type: 'Kabupaten', provinceId: '6', province: 'Jawa Timur' },
  { id: '165', name: 'Gresik', type: 'Kabupaten', provinceId: '6', province: 'Jawa Timur' },
  { id: '166', name: 'Kediri', type: 'Kota', provinceId: '6', province: 'Jawa Timur' },
  { id: '167', name: 'Mojokerto', type: 'Kota', provinceId: '6', province: 'Jawa Timur' },
  { id: '168', name: 'Pasuruan', type: 'Kota', provinceId: '6', province: 'Jawa Timur' },
  { id: '169', name: 'Probolinggo', type: 'Kota', provinceId: '6', province: 'Jawa Timur' },
  { id: '170', name: 'Blitar', type: 'Kota', provinceId: '6', province: 'Jawa Timur' },
  
  // Yogyakarta
  { id: '149', name: 'Yogyakarta', type: 'Kota', provinceId: '7', province: 'DI Yogyakarta' },
  { id: '150', name: 'Bantul', type: 'Kabupaten', provinceId: '7', province: 'DI Yogyakarta' },
  { id: '151', name: 'Sleman', type: 'Kabupaten', provinceId: '7', province: 'DI Yogyakarta' },
  
  // Banten
  { id: '104', name: 'Tangerang', type: 'Kota', provinceId: '2', province: 'Banten' },
  { id: '105', name: 'Tangerang', type: 'Kabupaten', provinceId: '2', province: 'Banten' },
  { id: '106', name: 'Tangerang Selatan', type: 'Kota', provinceId: '2', province: 'Banten' },
  { id: '107', name: 'Serang', type: 'Kota', provinceId: '2', province: 'Banten' },
  { id: '108', name: 'Cilegon', type: 'Kota', provinceId: '2', province: 'Banten' },
];

async function main() {
  console.log('Seeding provinces...');
  
  // Clear existing
  await db.delete(rajaongkirCities);
  await db.delete(rajaongkirProvinces);
  
  // Insert provinces
  await db.insert(rajaongkirProvinces).values(provinces);
  console.log(`Inserted ${provinces.length} provinces`);
  
  // Insert cities
  console.log('Seeding cities...');
  await db.insert(rajaongkirCities).values(cities);
  console.log(`Inserted ${cities.length} cities`);
  
  console.log('\nDone! You can now search for cities in admin settings.');
}

main().catch(console.error);

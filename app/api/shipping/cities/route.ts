// app/api/shipping/cities/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { rajaongkirClient } from '@/lib/rajaongkir/client';

/**
 * GET /api/shipping/cities?search=query
 * Search destinations using RajaOngkir direct search API
 * Returns subdistrict IDs for accurate shipping pricing
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    if (!search.trim()) {
      return NextResponse.json({ cities: [] });
    }

    // Use RajaOngkir direct search API
    const destinations = await rajaongkirClient.searchDestination(search, 20);
    
    return NextResponse.json({
      cities: destinations.map(d => ({
        id: d.id,
        name: d.subdistrict || d.name,
        type: d.type,
        province: d.province,
        city: d.city || '',
        district: d.district || '',
        fullName: d.name, // Full label
      })),
    });
  } catch (error) {
    console.error('Error searching cities:', error);
    return NextResponse.json(
      { error: 'Failed to search cities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

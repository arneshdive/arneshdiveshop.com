// app/api/shipping/sync-cities/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { syncAllRajaongkirData } from '@/lib/queries/rajaongkir-cities';

/**
 * POST /api/shipping/sync-cities
 * Sync RajaOngkir cities to local cache (admin only)
 */
export async function POST() {
  try {
    // Check admin access
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await syncAllRajaongkirData();

    return NextResponse.json({
      success: true,
      provinces: result.provinces,
      cities: result.cities,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error syncing cities:', error);
    return NextResponse.json(
      { error: 'Failed to sync cities' },
      { status: 500 }
    );
  }
}

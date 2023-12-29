import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rajaongkirCities } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

/**
 * GET /api/shipping/cities?search=query
 * Search cities for autocomplete dropdown
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    if (!search.trim()) {
      return NextResponse.json({ cities: [] });
    }

    const searchPattern = `%${search.toLowerCase()}%`;

    const cities = await db.query.rajaongkirCities.findMany({
      where: (cities, { or, sql: sqlFn }) => or(
        sql`LOWER(${cities.name}) LIKE ${searchPattern}`,
        sql`LOWER(${cities.province}) LIKE ${searchPattern}`
      ),
      limit: 20,
    });

    return NextResponse.json({
      cities: cities.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        province: c.province,
      })),
    });
  } catch (error) {
    console.error('Error searching cities:', error);
    return NextResponse.json(
      { error: 'Failed to search cities' },
      { status: 500 }
    );
  }
}

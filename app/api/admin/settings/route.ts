import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shopSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/admin/settings - Fetch shop settings
export async function GET() {
  try {
    let settings = await db
      .select()
      .from(shopSettings)
      .where(eq(shopSettings.id, 'default'))
      .limit(1);

    // Create default settings if none exist
    if (settings.length === 0) {
      const inserted = await db
        .insert(shopSettings)
        .values({ id: 'default' })
        .returning();
      settings = inserted;
    }

    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error('Error fetching shop settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update shop settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const updated = await db
      .update(shopSettings)
      .set({
        storeName: body.storeName,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        businessHours: body.businessHours,
        about: body.about,
        addressFormatted: body.addressFormatted,
        addressLat: body.addressLat,
        addressLng: body.addressLng,
        instagram: body.instagram,
        tiktok: body.tiktok,
        updatedAt: new Date(),
      })
      .where(eq(shopSettings.id, 'default'))
      .returning();

    if (updated.length === 0) {
      // Create if doesn't exist
      const created = await db
        .insert(shopSettings)
        .values({
          id: 'default',
          ...body,
        })
        .returning();
      return NextResponse.json(created[0]);
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating shop settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

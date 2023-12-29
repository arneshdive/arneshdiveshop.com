import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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

    const updateData = {
      storeName: body.storeName,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp,
      businessHours: body.businessHours,
      about: body.about,
      rajaongkirCityId: body.rajaongkirCityId || null,
      rajaongkirCityName: body.rajaongkirCityName || null,
      instagram: body.instagram,
      tiktok: body.tiktok,
      updatedAt: new Date(),
    };

    const updated = await db
      .update(shopSettings)
      .set(updateData)
      .where(eq(shopSettings.id, 'default'))
      .returning();

    // Revalidate cached settings so footer shows updated data
    revalidatePath('/', 'layout');

    if (updated.length === 0) {
      // Create if doesn't exist
      const created = await db
        .insert(shopSettings)
        .values({
          id: 'default',
          ...updateData,
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

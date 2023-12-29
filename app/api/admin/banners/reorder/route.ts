import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, banners } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

const reorderSchema = z.object({
  orders: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int(),
  })),
});

// PATCH /api/admin/banners/reorder - Reorder banners
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = reorderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Data tidak valid' },
        { status: 400 }
      );
    }

    // Update sort order for each banner
    await Promise.all(
      result.data.orders.map(({ id, sortOrder }) =>
        db.update(banners)
          .set({ sortOrder, updatedAt: new Date() })
          .where(eq(banners.id, id))
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering banners:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

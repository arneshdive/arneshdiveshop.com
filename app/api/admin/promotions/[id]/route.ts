import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { promotions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { updatePromotion, deletePromotion } from '@/lib/queries/promotions';
import { db } from '@/lib/db';

const updatePromotionSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(['percentage', 'fixed_cents']).optional(),
  valueCents: z.number().int().positive().optional(),
  minOrderCents: z.number().int().min(0).nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerCustomer: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional().transform(val => val ? new Date(val) : null),
  endsAt: z.string().optional().transform(val => val ? new Date(val) : null),
});

// GET /api/admin/promotions/[id] - Get single promotion
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const promotion = await db.query.promotions.findFirst({
      where: eq(promotions.id, id),
    });

    if (!promotion) {
      return NextResponse.json({ error: 'Promo tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error('Error fetching promotion:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/promotions/[id] - Update promotion
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = updatePromotionSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
      return NextResponse.json(
        { error: 'Data tidak valid', details: errors },
        { status: 400 }
      );
    }

    // Check if promotion exists
    const existing = await db.query.promotions.findFirst({
      where: eq(promotions.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Promo tidak ditemukan' }, { status: 404 });
    }

    // Check for code uniqueness if code is being updated
    if (result.data.code && result.data.code.toUpperCase() !== existing.code) {
      const codeExists = await db.query.promotions.findFirst({
        where: eq(promotions.code, result.data.code.toUpperCase()),
      });
      if (codeExists) {
        return NextResponse.json(
          { error: 'Kode promo sudah digunakan', details: { code: 'Kode promo sudah digunakan' } },
          { status: 400 }
        );
      }
    }

    // Validate percentage value
    const type = result.data.type ?? existing.type;
    const valueCents = result.data.valueCents ?? existing.valueCents;
    if (type === 'percentage' && valueCents > 10000) {
      return NextResponse.json(
        { error: 'Persentase tidak boleh lebih dari 100%', details: { valueCents: 'Maksimal 10000 (100%)' } },
        { status: 400 }
      );
    }

    const updated = await updatePromotion(id, result.data);

    return NextResponse.json({ promotion: updated });
  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/promotions/[id] - Delete promotion
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if promotion exists
    const existing = await db.query.promotions.findFirst({
      where: eq(promotions.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Promo tidak ditemukan' }, { status: 404 });
    }

    await deletePromotion(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

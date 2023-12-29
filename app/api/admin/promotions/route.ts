import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { promotions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { createPromotion, listPromotions } from '@/lib/queries/promotions';

const createPromotionSchema = z.object({
  code: z.string().min(1, 'Kode promo wajib diisi').max(50),
  name: z.string().min(1, 'Nama promo wajib diisi').max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['percentage', 'fixed_cents']),
  valueCents: z.number().int().positive('Nilai promo harus lebih dari 0'),
  minOrderCents: z.number().int().min(0).optional(),
  maxUses: z.number().int().positive().optional(),
  maxUsesPerCustomer: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional().transform(val => val ? new Date(val) : null),
  endsAt: z.string().optional().transform(val => val ? new Date(val) : null),
});

// GET /api/admin/promotions - List all promotions
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allPromotions = await listPromotions();

    return NextResponse.json({ promotions: allPromotions });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST /api/admin/promotions - Create new promotion
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createPromotionSchema.safeParse(body);

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

    // Check if code already exists
    const existing = await db.query.promotions.findFirst({
      where: eq(promotions.code, result.data.code.toUpperCase()),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Kode promo sudah digunakan', details: { code: 'Kode promo sudah digunakan' } },
        { status: 400 }
      );
    }

    // Validate percentage value (basis points: 100 = 1%, max 10000 = 100%)
    if (result.data.type === 'percentage' && result.data.valueCents > 10000) {
      return NextResponse.json(
        { error: 'Persentase tidak boleh lebih dari 100%', details: { valueCents: 'Maksimal 10000 (100%)' } },
        { status: 400 }
      );
    }

    const newPromotion = await createPromotion({
      code: result.data.code,
      name: result.data.name,
      description: result.data.description ?? null,
      type: result.data.type,
      valueCents: result.data.valueCents,
      minOrderCents: result.data.minOrderCents ?? null,
      maxUses: result.data.maxUses ?? null,
      maxUsesPerCustomer: result.data.maxUsesPerCustomer ?? null,
      isActive: result.data.isActive,
      startsAt: result.data.startsAt,
      endsAt: result.data.endsAt,
    });

    return NextResponse.json({ promotion: newPromotion }, { status: 201 });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

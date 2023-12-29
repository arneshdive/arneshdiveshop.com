import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validatePromotion } from '@/lib/queries/promotions';

const validateSchema = z.object({
  code: z.string().min(1, 'Kode promo wajib diisi'),
  orderTotalCents: z.number().int().min(0, 'Total pesanan tidak valid'),
});

// POST /api/promotions/validate - Validate a promo code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = validateSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
      return NextResponse.json(
        { valid: false, error: 'Data tidak valid', details: errors },
        { status: 400 }
      );
    }

    const validation = await validatePromotion(result.data.code, result.data.orderTotalCents);

    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        error: validation.error,
      });
    }

    const discountFormatted = `Rp ${(validation.discountCents! / 100).toLocaleString('id-ID')}`;

    return NextResponse.json({
      valid: true,
      promotion: {
        id: validation.promotion!.id,
        code: validation.promotion!.code,
        name: validation.promotion!.name,
        type: validation.promotion!.type,
        valueCents: validation.promotion!.valueCents,
      },
      discountCents: validation.discountCents,
      discountFormatted,
    });
  } catch (error) {
    console.error('Error validating promotion:', error);
    return NextResponse.json(
      { valid: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

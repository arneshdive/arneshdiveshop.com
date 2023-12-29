import { db } from '@/lib/db';
import { promotions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { Promotion, NewPromotion } from '@/lib/db/schema';

// List all promotions
export async function listPromotions() {
  return db.query.promotions.findMany({
    orderBy: (promotions, { desc }) => [desc(promotions.createdAt)],
  });
}

// Get promotion by code
export async function getPromotionByCode(code: string) {
  return db.query.promotions.findFirst({
    where: eq(promotions.code, code.toUpperCase()),
  });
}

// Validate promotion for use
export async function validatePromotion(code: string, orderTotalCents: number): Promise<{
  valid: boolean;
  promotion?: Promotion;
  discountCents?: number;
  error?: string;
}> {
  const promotion = await getPromotionByCode(code);
  
  if (!promotion) {
    return { valid: false, error: 'Kode promo tidak ditemukan' };
  }
  
  if (!promotion.isActive) {
    return { valid: false, error: 'Kode promo tidak aktif' };
  }
  
  const now = new Date();
  if (promotion.startsAt && promotion.startsAt > now) {
    return { valid: false, error: 'Kode promo belum berlaku' };
  }
  if (promotion.endsAt && promotion.endsAt < now) {
    return { valid: false, error: 'Kode promo sudah kedaluwarsa' };
  }
  
  if (promotion.maxUses && promotion.usesCount >= promotion.maxUses) {
    return { valid: false, error: 'Kode promo sudah mencapai batas penggunaan' };
  }
  
  if (promotion.minOrderCents && orderTotalCents < promotion.minOrderCents) {
    const minFormatted = (promotion.minOrderCents / 100).toLocaleString('id-ID');
    return { valid: false, error: `Minimum pembelian Rp ${minFormatted}` };
  }
  
  // Calculate discount
  let discountCents = 0;
  if (promotion.type === 'percentage') {
    // valueCents is basis points (100 = 1%)
    discountCents = Math.floor((orderTotalCents * promotion.valueCents) / 10000);
  } else {
    discountCents = promotion.valueCents;
  }
  
  return { valid: true, promotion, discountCents };
}

// Create promotion
export async function createPromotion(data: NewPromotion) {
  const [promotion] = await db.insert(promotions).values({
    ...data,
    code: data.code.toUpperCase(),
  }).returning();
  return promotion;
}

// Update promotion
export async function updatePromotion(id: string, data: Partial<NewPromotion>) {
  const [promotion] = await db.update(promotions).set(data).where(eq(promotions.id, id)).returning();
  return promotion;
}

// Delete promotion
export async function deletePromotion(id: string) {
  await db.delete(promotions).where(eq(promotions.id, id));
}

// Increment usage count
export async function incrementPromotionUsage(code: string) {
  await db.update(promotions)
    .set({ usesCount: sql`${promotions.usesCount} + 1` })
    .where(eq(promotions.code, code.toUpperCase()));
}

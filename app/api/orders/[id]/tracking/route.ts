import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { orders, orderStatusHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const updateTrackingSchema = z.object({
  trackingNumber: z.string().min(1, 'Nomor resi tidak boleh kosong').max(100, 'Nomor resi terlalu panjang'),
});

/**
 * PATCH /api/orders/[id]/tracking
 * Update tracking number for an order (admin only)
 * 
 * Also sets shippedAt timestamp if not already set
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    // Require authentication
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Require admin or super_admin role
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const { id: orderId } = await params;
    const body = await request.json();
    
    // Validate request body
    const result = updateTrackingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }
    
    const { trackingNumber } = result.data;
    
    // Get current order
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Update tracking number and set shippedAt if this is a new shipment
    const now = new Date();
    const isFirstTracking = !order.trackingNumber;
    const shouldSetShippedAt = order.status === 'processing' && isFirstTracking;
    
    const [updatedOrder] = await db
      .update(orders)
      .set({
        trackingNumber,
        shippedAt: shouldSetShippedAt ? now : order.shippedAt,
        status: shouldSetShippedAt ? 'shipped' : order.status,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId))
      .returning();
    
    // If this is the first tracking number, create status history entry
    if (isFirstTracking && shouldSetShippedAt) {
      await db.insert(orderStatusHistory).values({
        orderId,
        status: 'shipped',
        note: `Nomor resi: ${trackingNumber}`,
        changedBy: session.userId,
      });
    }
    
    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Nomor resi berhasil diperbarui'
    });
    
  } catch (error) {
    console.error('Error updating tracking number:', error);
    return NextResponse.json(
      { error: 'Failed to update tracking number' },
      { status: 500 }
    );
  }
}

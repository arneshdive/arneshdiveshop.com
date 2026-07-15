import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db, orders, payments, orderStatusHistory } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getMidtransProvider } from '@/lib/payment/midtrans';
import type { PaymentStatus, OrderStatus } from '@/lib/db/schema';

/**
 * POST /api/orders/[id]/sync-payment
 * Manually sync payment status from Midtrans
 * Used when webhook fails or for manual verification
 */
export async function POST(
  _request: NextRequest,
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
    
    // Get current order
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Get payment record
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId));
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }
    
    // Query Midtrans for transaction status
    const midtransProvider = getMidtransProvider();
    const midtransStatus = await midtransProvider.getTransactionStatus(orderId);
    
    // Map Midtrans status to our internal status
    const newPaymentStatus = midtransProvider.mapTransactionStatus(
      midtransStatus.transactionStatus,
      midtransStatus.fraudStatus
    );
    
    const currentPaymentStatus = payment.status as PaymentStatus;
    const currentOrderStatus = order.status as OrderStatus;
    
    let newOrderStatus = currentOrderStatus;
    
    // Determine new order status based on payment status
    if (newPaymentStatus === 'paid' && currentOrderStatus === 'pending_payment') {
      newOrderStatus = 'processing';
    } else if (newPaymentStatus === 'failed' || newPaymentStatus === 'expired') {
      newOrderStatus = 'cancelled';
    }
    
    // Check if anything changed
    const paymentChanged = currentPaymentStatus !== newPaymentStatus;
    const orderChanged = currentOrderStatus !== newOrderStatus;
    
    if (!paymentChanged && !orderChanged) {
      return NextResponse.json({
        message: 'Status sudah sinkron dengan Midtrans',
        paymentStatus: currentPaymentStatus,
        orderStatus: currentOrderStatus,
        midtransStatus: midtransStatus.transactionStatus,
      });
    }
    
    // Update in transaction
    await db.transaction(async (tx) => {
      // Update payment status
      if (paymentChanged) {
        await tx
          .update(payments)
          .set({
            status: newPaymentStatus,
            paymentMethod: midtransStatus.paymentType || payment.paymentMethod,
            paidAt: newPaymentStatus === 'paid' ? new Date() : null,
            providerTransactionId: midtransStatus.transactionId || payment.providerTransactionId,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));
      }
      
      // Update order status
      if (orderChanged) {
        await tx
          .update(orders)
          .set({
            status: newOrderStatus,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
        
        // Create audit history entry
        await tx.insert(orderStatusHistory).values({
          orderId,
          status: newOrderStatus,
          note: `Manual sync dari Midtrans (status: ${midtransStatus.transactionStatus})`,
          changedBy: session.userId,
        });
      }
    });
    
    return NextResponse.json({
      message: 'Status berhasil disinkronisasi',
      previousPaymentStatus: currentPaymentStatus,
      newPaymentStatus,
      previousOrderStatus: currentOrderStatus,
      newOrderStatus,
      midtransStatus: midtransStatus.transactionStatus,
      midtransPaymentType: midtransStatus.paymentType,
    });
    
  } catch (error) {
    console.error('Error syncing payment status:', error);
    return NextResponse.json(
      { error: 'Gagal mengecek status pembayaran dari Midtrans' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { processWebhookNotification, getMidtransProvider } from '@/lib/payment/midtrans';
import { db, orders, payments, cartItems } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { WebhookPayload } from '@/lib/payment/types';
import type { PaymentStatus } from '@/lib/db/schema';
import {
  getCheckoutSessionById,
  completeCheckoutSession,
  revertCheckoutSessionToPending,
} from '@/lib/queries/checkout';
import { sendOrderEmail } from '@/lib/email';

/**
 * POST /api/payments/webhook
 * Handle Midtrans webhook notifications
 * 
 * This endpoint receives HTTP POST notifications from Midtrans when
 * a transaction status changes. It verifies the signature and updates
 * the payment and order status accordingly.
 * 
 * Midtrans will retry the notification if it doesn't receive a 200 response.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the webhook payload
    const payload: WebhookPayload = await request.json();

    console.log('Received Midtrans webhook:', {
      orderId: payload.orderId,
      transactionStatus: payload.transactionStatus,
      paymentType: payload.paymentType,
    });

    // Process the notification
    const result = await processWebhookNotification(
      payload,
      getMidtransProvider()
    );

    if (!result.success) {
      console.error('Webhook processing failed:', result.error);
      // Return 200 anyway to prevent Midtrans retries for invalid signatures
      // We don't want to leak information about signature verification
      return NextResponse.json({ status: 'ok' });
    }

    // Find the order by ID (which is the Midtrans order_id)
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, result.orderId),
    });

    if (!order) {
      console.error('Order not found for webhook:', result.orderId);
      return NextResponse.json({ status: 'ok' });
    }

    // Find the payment record
    const payment = await db.query.payments.findFirst({
      where: eq(payments.orderId, result.orderId),
    });

    if (!payment) {
      console.error('Payment not found for webhook:', result.orderId);
      return NextResponse.json({ status: 'ok' });
    }

    // Map our internal payment status to schema enum
    // Our schema only has: pending, paid, failed, expired
    const schemaPaymentStatus = mapToSchemaPaymentStatus(result.paymentStatus);

    // Update payment status
    await db
      .update(payments)
      .set({
        status: schemaPaymentStatus,
        paymentMethod: result.paymentMethod,
        paidAt: result.paidAt,
        providerTransactionId: result.transactionId,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // Update order status based on payment status
    let orderStatus = order.status;
    switch (schemaPaymentStatus) {
      case 'paid':
        orderStatus = 'processing'; // Order is now being processed
        break;
      case 'failed':
        orderStatus = 'cancelled';
        break;
      case 'expired':
        orderStatus = 'cancelled';
        break;
      // 'pending' doesn't change order status
    }

    if (orderStatus !== order.status) {
      await db
        .update(orders)
        .set({
          status: orderStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
    }

    // Send order confirmation email when payment is successful
    if (schemaPaymentStatus === 'paid' && order.idempotencyKey) {
      const checkoutSession = await getCheckoutSessionById(order.idempotencyKey);
      
      if (checkoutSession) {
        // Get order items for email
        const orderWithItems = await db.query.orders.findFirst({
          where: eq(orders.id, order.id),
          with: {
            items: true,
          },
        });
        
        if (orderWithItems) {
          await sendOrderEmail(checkoutSession.email, {
            orderNumber: order.orderNumber,
            customerName: checkoutSession.fullName,
            items: orderWithItems.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              priceCents: item.priceCents,
            })),
            subtotalCents: order.subtotalCents,
            shippingCents: order.shippingCents,
            totalCents: order.totalCents,
            status: 'processing',
          });
        }
      }
    }

    // The checkout session's idempotency key IS the checkout session ID it
    // was created from - use it to resolve the session and finalize it now
    // that we have a definitive payment outcome (creating the order no
    // longer completes the session or clears the cart - see payments/create).
    if (order.idempotencyKey) {
      const checkoutSession = await getCheckoutSessionById(order.idempotencyKey);

      if (checkoutSession) {
        if (schemaPaymentStatus === 'paid') {
          await completeCheckoutSession(checkoutSession.id);
          if (checkoutSession.cartId) {
            await db.delete(cartItems).where(eq(cartItems.cartId, checkoutSession.cartId));
          }
        } else if (schemaPaymentStatus === 'failed' || schemaPaymentStatus === 'expired') {
          // Let the user retry: session becomes editable/payable again.
          await revertCheckoutSessionToPending(checkoutSession.id);
        }
      }
    }

    console.log('Webhook processed successfully:', {
      orderId: result.orderId,
      paymentStatus: schemaPaymentStatus,
      orderStatus,
    });

    // Return 200 to acknowledge receipt
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to prevent Midtrans retries
    return NextResponse.json({ status: 'ok' });
  }
}

/**
 * GET /api/payments/webhook
 * Health check endpoint for webhook URL verification
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Midtrans webhook endpoint is active',
  });
}

/**
 * Map our internal PaymentStatusType to the schema's PaymentStatus enum
 * Schema only supports: pending, paid, failed, expired
 */
function mapToSchemaPaymentStatus(status: string): PaymentStatus {
  switch (status) {
    case 'paid':
      return 'paid';
    case 'failed':
    case 'cancelled':
      return 'failed';
    case 'expired':
    case 'refunded':
      return 'expired';
    case 'pending':
    default:
      return 'pending';
  }
}

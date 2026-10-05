import { NextRequest, NextResponse } from 'next/server';
import { getPayPalProvider } from '@/lib/payment/paypal';
import { db, orders, payments, cartItems } from '@/lib/db';
import { eq } from 'drizzle-orm';
import {
  getCheckoutSessionById,
  completeCheckoutSession,
  revertCheckoutSessionToPending,
} from '@/lib/queries/checkout';
import { sendOrderEmail } from '@/lib/email';

interface PayPalCaptureResource {
  id: string;
  status: string;
  custom_id?: string;
}

interface PayPalOrderResource {
  id: string;
}

interface PayPalWebhookEvent {
  event_type: string;
  resource: PayPalCaptureResource | PayPalOrderResource;
}

/**
 * POST /api/payments/paypal/webhook
 * Handle PayPal webhook notifications for international (USD) orders.
 *
 * Kept separate from /api/payments/webhook (Midtrans) since PayPal's verification
 * (an async call to PayPal's own API, using transmission headers) and payload shape
 * are completely different.
 *
 * Two event types matter here:
 * - CHECKOUT.ORDER.APPROVED: the customer approved payment on PayPal's page. We
 *   capture the order server-side immediately so payment completes without
 *   depending on the customer's browser returning to our return_url.
 * - PAYMENT.CAPTURE.*: the definitive outcome of that capture - this is what
 *   actually updates the order/payment status.
 */
export async function POST(request: NextRequest) {
  try {
    const event: PayPalWebhookEvent = await request.json();
    const paypal = getPayPalProvider();

    const isValid = await paypal.verifyWebhookSignature(request.headers, event);
    if (!isValid) {
      console.error('Invalid PayPal webhook signature');
      // Return 200 anyway to prevent retries for invalid signatures, same as the Midtrans webhook.
      return NextResponse.json({ status: 'ok' });
    }

    console.log('Received PayPal webhook:', event.event_type);

    if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const resource = event.resource as PayPalOrderResource;
      try {
        await paypal.captureOrder(resource.id);
      } catch (error) {
        console.error('PayPal capture failed for order:', resource.id, error);
        // Let PayPal retry the webhook - a transient failure here shouldn't be silently dropped.
        return NextResponse.json({ status: 'retry' }, { status: 500 });
      }
      return NextResponse.json({ status: 'ok' });
    }

    if (!event.event_type.startsWith('PAYMENT.CAPTURE.')) {
      // Other event types (refunds initiated elsewhere, disputes, etc.) aren't handled yet.
      return NextResponse.json({ status: 'ok' });
    }

    const resource = event.resource as PayPalCaptureResource;
    const orderId = resource.custom_id;
    if (!orderId) {
      console.error('PayPal capture webhook missing custom_id:', resource.id);
      return NextResponse.json({ status: 'ok' });
    }

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) {
      console.error('Order not found for PayPal webhook:', orderId);
      return NextResponse.json({ status: 'ok' });
    }

    const payment = await db.query.payments.findFirst({ where: eq(payments.orderId, orderId) });
    if (!payment) {
      console.error('Payment not found for PayPal webhook:', orderId);
      return NextResponse.json({ status: 'ok' });
    }

    const paymentStatus = paypal.mapTransactionStatus(resource.status);

    await db
      .update(payments)
      .set({
        status: paymentStatus,
        paymentMethod: 'paypal',
        paidAt: paymentStatus === 'paid' ? new Date() : undefined,
        providerTransactionId: resource.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    let orderStatus = order.status;
    switch (paymentStatus) {
      case 'paid':
        orderStatus = 'processing';
        break;
      case 'failed':
      case 'cancelled':
        orderStatus = 'cancelled';
        break;
      case 'refunded':
        orderStatus = 'refunded';
        break;
    }

    if (orderStatus !== order.status) {
      await db.update(orders).set({ status: orderStatus, updatedAt: new Date() }).where(eq(orders.id, order.id));
    }

    if (order.idempotencyKey) {
      const checkoutSession = await getCheckoutSessionById(order.idempotencyKey);

      if (checkoutSession) {
        if (paymentStatus === 'paid') {
          const orderWithItems = await db.query.orders.findFirst({
            where: eq(orders.id, order.id),
            with: { items: true },
          });

          if (orderWithItems) {
            await sendOrderEmail(checkoutSession.email, {
              orderNumber: order.orderNumber,
              customerName: checkoutSession.fullName,
              items: orderWithItems.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                priceCents: item.priceCents,
              })),
              subtotalCents: order.subtotalCents,
              shippingCents: order.shippingCents,
              totalCents: order.totalCents,
              currency: order.currency as 'IDR' | 'USD',
              status: 'processing',
            });
          }

          await completeCheckoutSession(checkoutSession.id);
          if (checkoutSession.cartId) {
            await db.delete(cartItems).where(eq(cartItems.cartId, checkoutSession.cartId));
          }
        } else if (paymentStatus === 'failed' || paymentStatus === 'expired' || paymentStatus === 'cancelled') {
          await revertCheckoutSessionToPending(checkoutSession.id);
        }
      }
    }

    console.log('PayPal webhook processed successfully:', { orderId, paymentStatus, orderStatus });

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json({ status: 'ok' });
  }
}

/**
 * GET /api/payments/paypal/webhook
 * Health check endpoint for webhook URL verification
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'PayPal webhook endpoint is active',
  });
}

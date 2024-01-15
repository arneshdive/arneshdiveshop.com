import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getCheckoutSessionById,
  updateCheckoutSessionTotals,
  markCheckoutSessionPaymentPending,
  type CheckoutSessionWithCart,
} from '@/lib/queries/checkout';
import { getMidtransProvider } from '@/lib/payment/midtrans';
import { db, orders, payments, orderItems } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createAccountFromCheckout } from '@/lib/auth/seamless-signup';

const createPaymentSchema = z.object({
  checkoutSessionId: z.string().min(1, 'Checkout session ID is required'),
});

// Indonesian Rupiah doesn't have decimal places, so 1 IDR = 100 cents throughout the app
// But Midtrans expects the full amount (not cents)

/**
 * POST /api/payments/create
 * Create a Midtrans Snap transaction for a checkout session
 * 
 * This endpoint:
 * 1. Validates the checkout session
 * 2. Checks for existing order (idempotency: returns existing payment if found)
 * 3. Creates or retrieves a customer record
 * 4. Generates a unique order number
 * 5. Creates the order and payment records (pending status)
 * 6. Returns the Midtrans Snap token for the frontend
 * 
 * Idempotency: Uses checkoutSessionId as the idempotency key, so submitting
 * the same checkout session twice returns the existing payment without creating
 * a duplicate order or charge.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createPaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { checkoutSessionId } = result.data;

    // Get checkout session
    const session = await getCheckoutSessionById(checkoutSessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Checkout session not found' },
        { status: 404 }
      );
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Checkout session has already been paid' },
        { status: 400 }
      );
    }

    // 'pending' = first payment attempt, 'payment_pending' = retrying after
    // closing/abandoning a previous Snap popup. Anything else is invalid.
    if (session.status !== 'pending' && session.status !== 'payment_pending') {
      return NextResponse.json(
        { error: 'Checkout session is no longer valid' },
        { status: 400 }
      );
    }

    if (!session.cart || session.cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // ============================================================
    // IDEMPOTENCY CHECK: Reuse or re-open an existing order/payment
    // ============================================================
    // Use checkoutSessionId as the idempotency key
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.idempotencyKey, checkoutSessionId),
      with: {
        payments: true,
      },
    });
    const existingPayment = existingOrder?.payments[0];

    if (existingOrder && existingPayment) {
      if (existingPayment.status === 'pending') {
        // Previous Snap transaction is still open (user closed the popup
        // without paying) - hand back the same token instead of creating
        // a duplicate order.
        const metadata = existingPayment.metadata as Record<string, unknown> | null;
        if (metadata?.snapToken) {
          console.log('Returning existing payment for idempotency key:', checkoutSessionId);
          return NextResponse.json({
            success: true,
            data: {
              orderId: existingOrder.id,
              orderNumber: existingOrder.orderNumber,
              snapToken: metadata.snapToken,
              redirectUrl: metadata.redirectUrl,
            },
          });
        }
      }

      if (existingPayment.status === 'failed' || existingPayment.status === 'expired') {
        // Previous Snap transaction was denied/expired - open a fresh
        // transaction against the SAME order (Midtrans allows re-charging
        // an order_id once its prior transaction reached a final state).
        const midtrans = getMidtransProvider();
        const transaction = await midtrans.createTransaction({
          orderId: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          amountCents: existingOrder.totalCents,
          currency: 'IDR',
          customerEmail: session.email,
          customerPhone: session.phone,
          customerName: session.fullName,
          billingAddress: {
            address1: session.address1,
            address2: session.address2,
            city: session.rajaongkirCity || session.rajaongkirCityName || '',
            province: session.rajaongkirProvince || '',
            postalCode: session.rajaongkirPostalCode || '',
            country: 'Indonesia',
          },
          itemDetails: buildItemDetails(session, existingOrder.shippingCents),
        });

        await db
          .update(payments)
          .set({
            status: 'pending',
            providerTransactionId: transaction.providerTransactionId,
            metadata: {
              snapToken: transaction.token,
              redirectUrl: transaction.redirectUrl,
            },
            updatedAt: new Date(),
          })
          .where(eq(payments.id, existingPayment.id));

        // The webhook cancelled the order on the prior failure/expiry -
        // a new transaction is now in flight, so reopen it.
        if (existingOrder.status === 'cancelled') {
          await db
            .update(orders)
            .set({ status: 'pending_payment', updatedAt: new Date() })
            .where(eq(orders.id, existingOrder.id));
        }

        await markCheckoutSessionPaymentPending(checkoutSessionId);

        return NextResponse.json({
          success: true,
          data: {
            orderId: existingOrder.id,
            orderNumber: existingOrder.orderNumber,
            snapToken: transaction.token,
            redirectUrl: transaction.redirectUrl,
          },
        });
      }

      // 'paid' (or any other unexpected status): session should already be
      // 'completed' by the webhook - treat as no longer payable.
      return NextResponse.json(
        { error: 'Checkout session has already been paid' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotalCents = session.cart.subtotalCents;
    const shippingCents = calculateShippingCost(session.shippingMethod, subtotalCents);
    const totalCents = subtotalCents + shippingCents;

    // Update checkout session with calculated totals
    await updateCheckoutSessionTotals(checkoutSessionId, {
      subtotalCents,
      shippingCents,
      totalCents,
    });

    // Create account for guest or get existing customer (with auto-login)
    const { customerId } = await createAccountFromCheckout({
      id: checkoutSessionId,
      email: session.email,
      phone: session.phone,
      fullName: session.fullName,
      userId: session.userId,
    });

    // Generate order number: ARD-YYYY-NNNN
    const orderNumber = await generateOrderNumber();

    // Create order ID (will be used as Midtrans order_id)
    const orderId = crypto.randomUUID();

    // Create Snap transaction with Midtrans
    const midtrans = getMidtransProvider();

    const transaction = await midtrans.createTransaction({
      orderId,
      orderNumber,
      amountCents: totalCents,
      currency: 'IDR',
      customerEmail: session.email,
      customerPhone: session.phone,
      customerName: session.fullName,
      billingAddress: {
        address1: session.address1,
        address2: session.address2,
        city: session.rajaongkirCity || session.rajaongkirCityName || '',
        province: session.rajaongkirProvince || '',
        postalCode: session.rajaongkirPostalCode || '',
        country: 'Indonesia',
      },
      itemDetails: buildItemDetails(session, shippingCents),
    });

    // Create order record (pending_payment status) WITH idempotency key
    await db.insert(orders).values({
      id: orderId,
      orderNumber,
      customerId: customerId,
      status: 'pending_payment',
      subtotalCents,
      shippingCents,
      taxCents: 0,
      discountCents: 0,
      totalCents,
      idempotencyKey: checkoutSessionId, // Idempotency key to prevent duplicates
      shippingFirstName: session.fullName.split(' ')[0] || session.fullName,
      shippingLastName: session.fullName.split(' ').slice(1).join(' ') || '',
      shippingPhone: session.phone,
      shippingAddress1: session.address1,
      shippingAddress2: session.address2,
      shippingCity: session.rajaongkirCity || session.rajaongkirCityName || '',
      shippingState: session.rajaongkirProvince,
      shippingPostalCode: session.rajaongkirPostalCode || '',
      shippingCountry: 'Indonesia',
      notes: session.notes,
    });

    // Create order items
    for (const item of session.cart.items) {
      const priceCents = item.variant?.priceCents ?? item.product.priceCents;
      await db.insert(orderItems).values({
        orderId,
        productId: item.productId,
        variantId: item.variantId,
        name: item.variant
          ? `${item.product.name} - ${item.variant.name}`
          : item.product.name,
        quantity: item.quantity,
        priceCents,
      });
    }

    // Create payment record (pending status) with idempotency key
    const idempotencyKeyPayment = `${checkoutSessionId}-payment`;
    await db.insert(payments).values({
      orderId,
      status: 'pending',
      amountCents: totalCents,
      provider: 'midtrans',
      providerTransactionId: transaction.providerTransactionId,
      idempotencyKey: idempotencyKeyPayment,
      metadata: {
        snapToken: transaction.token,
        redirectUrl: transaction.redirectUrl,
      },
    });

    // Payment attempt is now in flight - the checkout session stays
    // editable-but-locked until the Midtrans webhook confirms the outcome.
    // Completing the session and clearing the cart happens there, not here.
    await markCheckoutSessionPaymentPending(checkoutSessionId);

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        orderNumber,
        snapToken: transaction.token,
        redirectUrl: transaction.redirectUrl,
      },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment transaction' },
      { status: 500 }
    );
  }
}

// Midtrans rejects the whole transaction if any item_details[].name exceeds this
const MIDTRANS_ITEM_NAME_MAX_LENGTH = 50;

function truncateForMidtrans(name: string): string {
  if (name.length <= MIDTRANS_ITEM_NAME_MAX_LENGTH) return name;
  return `${name.slice(0, MIDTRANS_ITEM_NAME_MAX_LENGTH - 3)}...`;
}

/**
 * Build Midtrans item_details for a checkout session's cart + shipping
 */
function buildItemDetails(session: CheckoutSessionWithCart, shippingCents: number) {
  if (!session.cart) return [];
  return [
    ...session.cart.items.map(item => {
      const priceCents = item.variant?.priceCents ?? item.product.priceCents;
      const name = item.variant
        ? `${item.product.name} - ${item.variant.name}`
        : item.product.name;
      return {
        id: item.productId,
        name: truncateForMidtrans(name),
        price: priceCents,
        quantity: item.quantity,
      };
    }),
    {
      id: `shipping-${session.shippingMethod || 'standard'}`,
      name: truncateForMidtrans(`Pengiriman: ${getShippingMethodName(session.shippingMethod)}`),
      price: shippingCents,
      quantity: 1,
    },
  ];
}

/**
 * Calculate shipping cost based on method and order total
 * CONVENTION: All values are in cents (1 Rupiah = 100 cents)
 */
function calculateShippingCost(shippingMethod: string | null, subtotalCents: number): number {
  const FREE_SHIPPING_THRESHOLD = 50000000; // Rp 500.000 in cents
  
  // Free shipping for orders above threshold
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  switch (shippingMethod) {
    case 'jne-regular':
      return 2500000; // Rp 25.000 in cents
    case 'jne-yes':
      return 4500000; // Rp 45.000 in cents
    case 'sicepat-reg':
      return 2000000; // Rp 20.000 in cents
    default:
      return 2500000; // Default to JNE Regular
  }
}

/**
 * Get human-readable shipping method name
 */
function getShippingMethodName(method: string | null): string {
  switch (method) {
    case 'jne-regular':
      return 'JNE Reguler (3-5 hari)';
    case 'jne-yes':
      return 'JNE YES (1-2 hari)';
    case 'sicepat-reg':
      return 'SiCepat REG (2-3 hari)';
    default:
      return 'Pengiriman Standar';
  }
}

/**
 * Generate a unique order number
 * Format: ARD-YYYY-NNNN (e.g., ARD-2024-0001)
 */
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Find the last order number for this year
  const lastOrder = await db.query.orders.findFirst({
    where: (orders, { like }) => like(orders.orderNumber, `ARD-${year}-%`),
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });

  let sequence = 1;
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split('-');
    const lastNumber = parts[2];
    if (lastNumber) {
      sequence = parseInt(lastNumber, 10) + 1;
    }
  }

  return `ARD-${year}-${String(sequence).padStart(4, '0')}`;
}

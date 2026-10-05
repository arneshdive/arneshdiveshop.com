import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getCheckoutSessionById,
  updateCheckoutSessionTotals,
  markCheckoutSessionPaymentPending,
  type CheckoutSessionWithCart,
} from '@/lib/queries/checkout';
import { getPaymentProvider, type PaymentProviderName } from '@/lib/payment';
import { db, orders, payments, orderItems } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createAccountFromCheckout } from '@/lib/auth/seamless-signup';
import { calculateShippingRates } from '@/lib/shipping/calculator';
import { calculateInternationalShippingRates } from '@/lib/shipping/fedex';
import { sendOrderEmail } from '@/lib/email';
import { saveAddressFromOrder } from '@/lib/queries/addresses';

const createPaymentSchema = z.object({
  checkoutSessionId: z.string().min(1, 'Checkout session ID is required'),
  provider: z.enum(['midtrans', 'paypal']).default('midtrans'),
});

// Indonesian Rupiah doesn't have decimal places, so 1 IDR = 100 cents throughout the app
// But Midtrans expects the full amount (not cents)

// International shipping cost calculation is deferred to a future phase (2026-09-19 decision) -
// PayPal orders are charged for cart items only, with $0 shipping for now.
function getCurrencyForProvider(provider: PaymentProviderName): 'IDR' | 'USD' {
  return provider === 'paypal' ? 'USD' : 'IDR';
}

/** Resolve a cart item's price in the given provider's currency. Returns null if unavailable
 * (e.g. a product has no priceCentsUsd set yet, so it can't be sold via PayPal). */
function resolveItemPriceCents(
  item: { product: { priceCents: number; priceCentsUsd: number | null }; variant?: { priceCents: number | null; priceCentsUsd: number | null } | null },
  provider: PaymentProviderName
): number | null {
  if (provider === 'paypal') {
    return item.variant?.priceCentsUsd ?? item.product.priceCentsUsd ?? null;
  }
  return item.variant?.priceCents ?? item.product.priceCents;
}

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

    const { checkoutSessionId, provider } = result.data;
    const currency = getCurrencyForProvider(provider);

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

    // Shipping destination determines payment currency (same coupling the
    // checkout UI enforces): Indonesia -> Midtrans only, any other country ->
    // PayPal only. Enforced server-side too, not just as a UI constraint.
    const isDomesticSession = session.countryCode === 'ID';
    if (provider === 'midtrans' && !isDomesticSession) {
      return NextResponse.json(
        { error: 'Midtrans hanya tersedia untuk pengiriman dalam negeri (Indonesia).' },
        { status: 400 }
      );
    }
    if (provider === 'paypal' && isDomesticSession) {
      return NextResponse.json(
        { error: 'PayPal hanya tersedia untuk pengiriman internasional.' },
        { status: 400 }
      );
    }

    if (provider === 'paypal') {
      const hasUnpricedItem = session.cart.items.some(
        (item) => resolveItemPriceCents(item, provider) === null
      );
      if (hasUnpricedItem) {
        return NextResponse.json(
          { error: 'Beberapa produk di keranjang belum tersedia untuk pembayaran internasional (PayPal).' },
          { status: 400 }
        );
      }
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
        // Previous transaction was denied/expired - open a fresh transaction
        // against the SAME order, using the SAME provider/currency it was
        // originally created with (switching provider mid-order would mean
        // charging a different currency than the order's recorded totals).
        const retryProvider = existingPayment.provider as PaymentProviderName;
        const retryCurrency = existingOrder.currency as 'IDR' | 'USD';
        const paymentProvider = getPaymentProvider(retryProvider);
        const transaction = await paymentProvider.createTransaction({
          orderId: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          amountCents: existingOrder.totalCents,
          currency: retryCurrency,
          customerEmail: session.email,
          customerPhone: session.phone,
          customerName: session.fullName,
          billingAddress: {
            address1: session.address1,
            address2: session.address2,
            city: session.countryCode === 'ID' ? (session.rajaongkirCity || session.rajaongkirCityName || '') : (session.city || ''),
            province: session.countryCode === 'ID' ? (session.rajaongkirProvince || '') : (session.province || ''),
            postalCode: session.countryCode === 'ID' ? (session.rajaongkirPostalCode || '') : (session.postalCode || ''),
            country: session.country,
          },
          itemDetails:
            retryProvider === 'midtrans'
              ? buildItemDetails(session, existingOrder.shippingCents, session.shippingMethod)
              : undefined,
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

    // Calculate totals.
    let subtotalCents: number;
    let shippingCents: number;
    let shippingLabel: string | undefined;

    if (provider === 'paypal') {
      subtotalCents = session.cart.items.reduce(
        (sum, item) => sum + (resolveItemPriceCents(item, provider) ?? 0) * item.quantity,
        0
      );

      // Re-derive the shipping cost from FedEx (the same source of truth
      // the customer saw in the shipping method selector) rather than trusting
      // a client-supplied value - mirrors exactly how the domestic branch
      // re-derives cost from RajaOngkir below.
      const { rates: currentRates, error: intlShippingError } = await calculateInternationalShippingRates(
        {
          address1: session.address1,
          city: session.city || '',
          state: session.province || undefined,
          postalCode: session.postalCode || '',
          countryCode: session.countryCode,
        },
        session.cart.items
      );

      if (intlShippingError || currentRates.length === 0) {
        return NextResponse.json(
          { error: intlShippingError || 'Metode pengiriman tidak lagi tersedia, silakan pilih ulang metode pengiriman.' },
          { status: 400 }
        );
      }

      const selectedIntlRate = currentRates.find(
        (rate) => `${rate.courier}-${rate.service}`.toLowerCase() === session.shippingMethod
      );

      if (!selectedIntlRate) {
        return NextResponse.json(
          { error: 'Metode pengiriman tidak lagi tersedia, silakan pilih ulang metode pengiriman.' },
          { status: 400 }
        );
      }

      shippingCents = selectedIntlRate.costCents;
    } else {
      // Re-derive the shipping cost from RajaOngkir (the same source of truth
      // the customer saw in the shipping method selector) rather than trusting
      // a client-supplied value, so the captured cost always matches a real,
      // currently-valid courier quote.
      if (!session.rajaongkirCityId) {
        return NextResponse.json(
          { error: 'Alamat pengiriman tidak lengkap, silakan pilih ulang tujuan pengiriman.' },
          { status: 400 }
        );
      }

      subtotalCents = session.cart.subtotalCents;
      const { rates: currentRates } = await calculateShippingRates(
        session.rajaongkirCityId,
        session.cart.items
      );
      const selectedRate = currentRates.find(
        (rate) => `${rate.courier}-${rate.service}`.toLowerCase() === session.shippingMethod
      );

      if (!selectedRate) {
        return NextResponse.json(
          { error: 'Metode pengiriman tidak lagi tersedia, silakan pilih ulang metode pengiriman.' },
          { status: 400 }
        );
      }

      shippingCents = selectedRate.costCents;
      shippingLabel = `${selectedRate.courier.toUpperCase()} ${selectedRate.name}`;
    }

    const totalCents = subtotalCents + shippingCents;

    // Update checkout session with calculated totals. Skipped for PayPal: the
    // checkout session's totals are always displayed/re-derived in IDR
    // elsewhere (cart, order summary), so they must stay IDR-denominated -
    // the USD amounts computed above are only used for this order/payment.
    if (provider === 'midtrans') {
      await updateCheckoutSessionTotals(checkoutSessionId, {
        subtotalCents,
        shippingCents,
        totalCents,
      });
    }

    // Create account for guest or get existing customer (with auto-login)
    const { customerId } = await createAccountFromCheckout({
      id: checkoutSessionId,
      email: session.email,
      phone: session.phone,
      fullName: session.fullName,
      userId: session.userId,
    });

    // Save this shipping address to the customer's address book (unless it's
    // a duplicate of one they already have) so it's available to pick on
    // their next checkout instead of retyping it. Best-effort: a failure here
    // must never block the actual purchase. Domestic (RajaOngkir) addresses
    // only - the address book doesn't support international addresses yet.
    if (session.countryCode === 'ID' && session.rajaongkirCityId) {
      try {
        await saveAddressFromOrder(customerId, {
          name: 'Alamat Utama',
          firstName: session.fullName.split(' ')[0] || session.fullName,
          lastName: session.fullName.split(' ').slice(1).join(' ') || '',
          phone: session.phone,
          address1: session.address1,
          address2: session.address2 || undefined,
          rajaongkirCityId: session.rajaongkirCityId,
          rajaongkirCityName: session.rajaongkirCityName || '',
          rajaongkirProvince: session.rajaongkirProvince || undefined,
          rajaongkirCity: session.rajaongkirCity || undefined,
          rajaongkirDistrict: session.rajaongkirDistrict || undefined,
          rajaongkirSubdistrict: session.rajaongkirSubdistrict || undefined,
          rajaongkirPostalCode: session.rajaongkirPostalCode || undefined,
        });
      } catch (err) {
        console.error('Failed to save address to address book:', err);
      }
    }

    // Generate order number: ARD-YYYY-NNNN
    const orderNumber = await generateOrderNumber();

    // Create order ID (will be used as Midtrans order_id)
    const orderId = crypto.randomUUID();

    // Create transaction with the chosen provider (Midtrans for local, PayPal for international)
    const paymentProvider = getPaymentProvider(provider);

    const transaction = await paymentProvider.createTransaction({
      orderId,
      orderNumber,
      amountCents: totalCents,
      currency,
      customerEmail: session.email,
      customerPhone: session.phone,
      customerName: session.fullName,
      billingAddress: {
        address1: session.address1,
        address2: session.address2,
        city: session.countryCode === 'ID' ? (session.rajaongkirCity || session.rajaongkirCityName || '') : (session.city || ''),
        province: session.countryCode === 'ID' ? (session.rajaongkirProvince || '') : (session.province || ''),
        postalCode: session.countryCode === 'ID' ? (session.rajaongkirPostalCode || '') : (session.postalCode || ''),
        country: session.country,
      },
      itemDetails: provider === 'midtrans' ? buildItemDetails(session, shippingCents, shippingLabel) : undefined,
    });

    // Create order record (pending_payment status) WITH idempotency key
    await db.insert(orders).values({
      id: orderId,
      orderNumber,
      customerId: customerId,
      status: 'pending_payment',
      currency,
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
      shippingCity: session.countryCode === 'ID' ? (session.rajaongkirCity || session.rajaongkirCityName || '') : (session.city || ''),
      shippingState: session.countryCode === 'ID' ? session.rajaongkirProvince : session.province,
      shippingPostalCode: session.countryCode === 'ID' ? (session.rajaongkirPostalCode || '') : (session.postalCode || ''),
      shippingCountry: session.country,
      shippingCountryCode: session.countryCode,
      notes: session.notes,
    });

    // Create order items
    for (const item of session.cart.items) {
      const priceCents = resolveItemPriceCents(item, provider) ?? 0;
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
      currency,
      amountCents: totalCents,
      provider,
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

    // Send order confirmation email with payment link
    await sendOrderEmail(session.email, {
      orderNumber,
      customerName: session.fullName,
      items: session.cart.items.map(item => ({
        name: item.variant
          ? `${item.product.name} - ${item.variant.name}`
          : item.product.name,
        quantity: item.quantity,
        priceCents: resolveItemPriceCents(item, provider) ?? 0,
      })),
      subtotalCents,
      shippingCents,
      totalCents,
      currency,
      paymentUrl: transaction.redirectUrl,
      status: 'pending_payment',
    });

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
function buildItemDetails(
  session: CheckoutSessionWithCart,
  shippingCents: number,
  shippingLabel?: string | null
) {
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
      name: truncateForMidtrans(`Pengiriman: ${shippingLabel || session.shippingMethod || 'Standar'}`),
      price: shippingCents,
      quantity: 1,
    },
  ];
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

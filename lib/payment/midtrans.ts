import crypto from 'crypto';
import type {
  PaymentProvider,
  CreateTransactionInput,
  CreateTransactionResult,
  WebhookPayload,
  WebhookResult,
  PaymentStatusType,
} from './types';

// Local type for Midtrans transaction request
// The midtrans-client package doesn't export types properly
interface TransactionRequestBody {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    billing_address?: {
      address?: string;
      city?: string;
      postal_code?: string;
      country_code?: string;
    };
  };
  item_details?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  enabled_payments?: string[];
  callbacks?: {
    finish: string;
  };
  expiry?: {
    unit: string;
    duration: number;
  };
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Snap, CoreApi } = require('midtrans-client');

/**
 * Midtrans Snap API Client
 * Handles transaction creation and webhook verification
 */
class MidtransProvider implements PaymentProvider {
  readonly name = 'midtrans';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private snap: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private coreApi: any;
  private serverKey: string;
  private isProduction: boolean;

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    if (!this.serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY is not configured');
    }

    this.snap = new Snap({
      isProduction: this.isProduction,
      serverKey: this.serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    });

    this.coreApi = new CoreApi({
      isProduction: this.isProduction,
      serverKey: this.serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    });
  }

  /**
   * Create a Snap transaction for the given order
   */
  async createTransaction(input: CreateTransactionInput): Promise<CreateTransactionResult> {
    // Midtrans expects amount in full IDR units (not cents)
    const grossAmount = Math.round(input.amountCents / 100);

    const parameter: TransactionRequestBody = {
      transaction_details: {
        order_id: input.orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        email: input.customerEmail,
        phone: input.customerPhone,
        first_name: input.customerName.split(' ')[0] || input.customerName,
        last_name: input.customerName.split(' ').slice(1).join(' ') || undefined,
        billing_address: input.billingAddress ? {
          address: input.billingAddress.address1 + (input.billingAddress.address2 ? `, ${input.billingAddress.address2}` : ''),
          city: input.billingAddress.city,
          postal_code: input.billingAddress.postalCode,
          country_code: input.billingAddress.country === 'Indonesia' ? 'IDN' : 'IDN',
        } : undefined,
      },
      item_details: input.itemDetails?.map(item => ({
        id: item.id,
        name: item.name,
        price: Math.round(item.price / 100), // Convert cents to IDR units
        quantity: item.quantity,
      })),
      // Enable all supported payment methods
      enabled_payments: [
        'credit_card',
        'bca_va',
        'bni_va',
        'bri_va',
        'cimb_va',
        'other_va',
        'gopay',
        'gopay_partner',
        'ovo',
        'shopeepay',
        'qris',
        'danamon_online',
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/callback`,
      },
      // Custom expiry (24 hours)
      expiry: {
        unit: 'hours',
        duration: 24,
      },
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);

      if (!transaction.token || !transaction.redirect_url) {
        throw new Error('Invalid response from Midtrans: missing token or redirect_url');
      }

      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        providerTransactionId: input.orderId, // Midtrans uses order_id as transaction reference
      };
    } catch (error) {
      console.error('Midtrans createTransaction error:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature from Midtrans
   * Uses SHA-512 hash of order_id, status_code, gross_amount, and server_key
   */
  verifyWebhookSignature(payload: WebhookPayload): boolean {
    const { orderId, grossAmount, transactionStatus, signatureKey } = payload;
    
    // Status code mapping for verified status
    const statusCode = this.getStatusCode(transactionStatus);
    
    // Build the signature string: order_id + status_code + gross_amount + server_key
    const signatureString = `${orderId}${statusCode}${grossAmount}${this.serverKey}`;
    
    // Compute SHA-512 hash
    const computedSignature = crypto
      .createHash('sha512')
      .update(signatureString)
      .digest('hex');

    return computedSignature === signatureKey;
  }

  /**
   * Map Midtrans transaction status to our internal payment status
   */
  mapTransactionStatus(transactionStatus: string, fraudStatus?: string): PaymentStatusType {
    // Handle fraud status first for credit card transactions
    if (fraudStatus === 'deny') {
      return 'failed';
    }
    if (fraudStatus === 'challenge') {
      // Payment is challenged - needs manual verification
      // We treat this as pending for now
      return 'pending';
    }

    switch (transactionStatus) {
      case 'capture':
        // Credit card captured
        return fraudStatus === 'accept' ? 'paid' : 'pending';
      case 'settlement':
        // Payment completed successfully
        return 'paid';
      case 'pending':
        // Awaiting payment
        return 'pending';
      case 'deny':
        // Payment denied by bank/provider
        return 'failed';
      case 'cancel':
        // Transaction cancelled
        return 'cancelled';
      case 'expire':
        // Transaction expired
        return 'expired';
      case 'refund':
        // Transaction refunded
        return 'refunded';
      case 'partial_refund':
        // Partially refunded
        return 'refunded';
      default:
        console.warn(`Unknown Midtrans transaction status: ${transactionStatus}`);
        return 'pending';
    }
  }

  /**
   * Get transaction status from Midtrans API
   * Used for manual sync when webhook fails
   */
  async getTransactionStatus(orderId: string) {
    const response = await this.coreApi.transaction.status(orderId);

    return {
      transactionStatus: response.transaction_status,
      paymentType: response.payment_type,
      transactionId: response.transaction_id,
      transactionTime: response.transaction_time,
      grossAmount: response.gross_amount,
      fraudStatus: response.fraud_status,
    };
  }

  /**
   * Get HTTP status code for transaction status (used in signature verification)
   */
  private getStatusCode(transactionStatus: string): string {
    switch (transactionStatus) {
      case 'capture':
      case 'settlement':
        return '200';
      case 'pending':
        return '201';
      case 'deny':
      case 'cancel':
      case 'expire':
      case 'refund':
        return '202';
      default:
        return '200';
    }
  }
}

// Singleton instance
let midtransProvider: MidtransProvider | null = null;

/**
 * Get the Midtrans provider instance
 */
export function getMidtransProvider(): MidtransProvider {
  if (!midtransProvider) {
    midtransProvider = new MidtransProvider();
  }
  return midtransProvider;
}

/**
 * Process webhook notification from Midtrans
 */
export async function processWebhookNotification(
  payload: WebhookPayload,
  provider: PaymentProvider = getMidtransProvider()
): Promise<WebhookResult> {
  // Verify signature
  const isSignatureValid = provider.verifyWebhookSignature(payload);
  
  if (!isSignatureValid) {
    return {
      success: false,
      orderId: payload.orderId,
      transactionId: payload.transactionId,
      paymentStatus: 'failed',
      error: 'Invalid webhook signature',
    };
  }

  // Map payment status
  const paymentStatus = provider.mapTransactionStatus(
    payload.transactionStatus,
    payload.fraudStatus
  );

  return {
    success: true,
    orderId: payload.orderId,
    transactionId: payload.transactionId,
    paymentStatus,
    paymentMethod: payload.paymentType,
    paidAt: paymentStatus === 'paid' ? new Date(payload.transactionTime) : undefined,
  };
}

// Re-export types
export type { PaymentProvider, CreateTransactionInput, CreateTransactionResult, WebhookPayload, WebhookResult, PaymentStatusType };

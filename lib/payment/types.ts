/**
 * Payment Provider Interface
 * Allows swapping to Stripe/Xendit/other providers later
 */

export interface CreateTransactionInput {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  billingAddress?: BillingAddress;
  itemDetails?: ItemDetail[];
}

export interface BillingAddress {
  address1: string;
  address2?: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface ItemDetail {
  id: string;
  name: string;
  price: number; // In the currency's smallest unit (cents for IDR means rupiah, but Midtrans expects IDR in full units)
  quantity: number;
}

export interface CreateTransactionResult {
  token: string;
  redirectUrl: string;
  providerTransactionId: string;
}

export interface WebhookPayload {
  orderId: string;
  transactionId: string;
  transactionStatus: string;
  paymentType: string;
  grossAmount: string;
  fraudStatus?: string;
  signatureKey: string;
  transactionTime: string;
}

export interface WebhookResult {
  success: boolean;
  orderId: string;
  transactionId: string;
  paymentStatus: PaymentStatusType;
  paymentMethod?: string;
  paidAt?: Date;
  error?: string;
}

export type PaymentStatusType = 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refunded';

export interface PaymentProvider {
  name: string;
  createTransaction(input: CreateTransactionInput): Promise<CreateTransactionResult>;
  verifyWebhookSignature(payload: WebhookPayload): boolean;
  mapTransactionStatus(transactionStatus: string, fraudStatus?: string): PaymentStatusType;
}

export type MidtransPaymentMethod =
  | 'credit_card'
  | 'bank_transfer'
  | 'echannel' // Mandiri Bill
  | 'bca_va'
  | 'bni_va'
  | 'bri_va'
  | 'cimb_va'
  | 'other_va'
  | 'gopay'
  | 'gopay_partner'
  | 'ovo'
  | 'shopeepay'
  | 'qris'
  | 'danamon_online'
  | 'akulaku';

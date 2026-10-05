/**
 * Payment Module
 * Provides payment processing through Midtrans (local/IDR) and PayPal (international/USD)
 *
 * Design allows swapping to other providers by implementing PaymentProvider interface
 */

import { getMidtransProvider } from './midtrans';
import { getPayPalProvider } from './paypal';
import type { CreateTransactionInput, CreateTransactionResult } from './types';

export * from './types';
export * from './midtrans';
export * from './paypal';

export type PaymentProviderName = 'midtrans' | 'paypal';

export interface PaymentProviderHandle {
  name: string;
  createTransaction(input: CreateTransactionInput): Promise<CreateTransactionResult>;
}

export function getPaymentProvider(providerName: PaymentProviderName): PaymentProviderHandle {
  switch (providerName) {
    case 'midtrans':
      return getMidtransProvider();
    case 'paypal':
      return getPayPalProvider();
    default:
      throw new Error(`Unknown payment provider: ${providerName}`);
  }
}

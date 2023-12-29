declare module 'midtrans-client' {
  export interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface CustomerDetails {
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
  }

  export interface ItemDetail {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }

  export interface Expiry {
    unit: 'minutes' | 'hours' | 'days';
    duration: number;
  }

  export interface Callbacks {
    finish?: string;
    error?: string;
    pending?: string;
    close?: string;
  }

  export type PaymentType = 
    | 'credit_card'
    | 'bank_transfer'
    | 'echannel'
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

  export interface TransactionRequestBody {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    item_details?: ItemDetail[];
    enabled_payments?: PaymentType[];
    callbacks?: Callbacks;
    expiry?: Expiry;
    credit_card?: {
      secure?: boolean;
      save_card?: boolean;
      channel?: string;
    };
  }

  export interface TransactionResponseBody {
    token: string;
    redirect_url: string;
    order_id?: string;
    message?: string;
  }

  export class Snap {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });
    createTransaction(parameter: TransactionRequestBody): Promise<TransactionResponseBody>;
  }

  export class Core {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });
    charge(parameter: TransactionRequestBody): Promise<TransactionResponseBody>;
    get_status(orderId: string): Promise<Record<string, unknown>>;
  }
}

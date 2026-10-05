import type { CreateTransactionInput, CreateTransactionResult, PaymentStatusType } from './types';

/**
 * PayPal Orders v2 API client
 * Used for international customers; Midtrans (lib/payment/midtrans.ts) handles local (IDR) payments.
 *
 * PayPal's webhook verification is an async call to PayPal's own API (unlike Midtrans's local
 * HMAC check) and its event shape is completely different from Midtrans's, so this provider does
 * NOT implement the shared `PaymentProvider` interface's webhook methods — webhook handling lives
 * entirely in app/api/payments/paypal/webhook/route.ts via the exported helpers below.
 */

interface PayPalOrderResponse {
  id: string;
  status: string;
  links: { rel: string; href: string; method: string }[];
}

interface PayPalCaptureResponse {
  id: string;
  status: string;
  purchase_units: {
    payments: {
      captures: { id: string; status: string; create_time: string }[];
    };
  }[];
}

class PayPalProvider {
  readonly name = 'paypal';
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private cachedToken: { value: string; expiresAt: number } | null = null;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    this.baseUrl =
      process.env.PAYPAL_MODE === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    if (!this.clientId || !this.clientSecret) {
      throw new Error('PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET is not configured');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.value;
    }

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`PayPal OAuth token request failed: ${response.status}`);
    }

    const data = await response.json();
    this.cachedToken = {
      value: data.access_token,
      // Refresh a minute early to avoid edge-of-expiry failures
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return this.cachedToken.value;
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    const body = await response.json();
    if (!response.ok) {
      console.error('PayPal API error:', path, body);
      throw new Error(`PayPal API request to ${path} failed: ${response.status}`);
    }
    return body as T;
  }

  /**
   * Create a PayPal order (intent CAPTURE) and return its hosted approve link as `redirectUrl`,
   * matching MidtransProvider.createTransaction's shape so the checkout page can treat both
   * providers identically.
   */
  async createTransaction(input: CreateTransactionInput): Promise<CreateTransactionResult> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const value = (input.amountCents / 100).toFixed(2);

    const order = await this.request<PayPalOrderResponse>('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: input.orderId,
            custom_id: input.orderId,
            amount: {
              currency_code: input.currency,
              value,
            },
          },
        ],
        application_context: {
          brand_name: 'Arnesh Dive',
          user_action: 'PAY_NOW',
          return_url: `${appUrl}/checkout/callback?provider=paypal`,
          cancel_url: `${appUrl}/checkout?paypalCancelled=true`,
        },
      }),
    });

    const approveLink = order.links.find((link) => link.rel === 'approve')?.href;
    if (!approveLink) {
      throw new Error('Invalid response from PayPal: missing approve link');
    }

    return {
      token: order.id,
      redirectUrl: approveLink,
      providerTransactionId: order.id,
    };
  }

  /**
   * Capture a previously-approved order. Called from the webhook route on
   * CHECKOUT.ORDER.APPROVED so payment completes without depending on the customer's
   * browser tab returning to our `return_url`.
   */
  async captureOrder(paypalOrderId: string): Promise<PayPalCaptureResponse> {
    return this.request<PayPalCaptureResponse>(`/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
    });
  }

  /**
   * Verify a webhook request came from PayPal via their verification API.
   * Requires the raw event body and the `PAYPAL-*` transmission headers from the request.
   */
  async verifyWebhookSignature(headers: Headers, event: unknown): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      throw new Error('PAYPAL_WEBHOOK_ID is not configured');
    }

    const result = await this.request<{ verification_status: string }>(
      '/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        body: JSON.stringify({
          auth_algo: headers.get('paypal-auth-algo'),
          cert_url: headers.get('paypal-cert-url'),
          transmission_id: headers.get('paypal-transmission-id'),
          transmission_sig: headers.get('paypal-transmission-sig'),
          transmission_time: headers.get('paypal-transmission-time'),
          webhook_id: webhookId,
          webhook_event: event,
        }),
      }
    );

    return result.verification_status === 'SUCCESS';
  }

  mapTransactionStatus(captureStatus: string): PaymentStatusType {
    switch (captureStatus) {
      case 'COMPLETED':
        return 'paid';
      case 'DECLINED':
        return 'failed';
      case 'VOIDED':
        return 'cancelled';
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return 'refunded';
      case 'PENDING':
        return 'pending';
      default:
        console.warn(`Unknown PayPal capture status: ${captureStatus}`);
        return 'pending';
    }
  }
}

let paypalProvider: PayPalProvider | null = null;

export function getPayPalProvider(): PayPalProvider {
  if (!paypalProvider) {
    paypalProvider = new PayPalProvider();
  }
  return paypalProvider;
}

export type { PayPalProvider };

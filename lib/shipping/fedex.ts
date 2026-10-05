import { getShopSettings } from '@/lib/queries/settings';
import type { ShippingRate } from '@/lib/rajaongkir/types';

const DEFAULT_PRODUCT_WEIGHT_GRAMS = 500;

interface CartItemForShipping {
  quantity: number;
  product?: {
    weightGrams?: number | null;
  } | null;
}

export interface InternationalDestination {
  address1: string;
  city: string;
  state?: string | null;
  postalCode: string;
  countryCode: string;
}

interface FedExRatedShipmentDetail {
  rateType: string;
  totalNetCharge: number;
  currency: string;
}

interface FedExRateReplyDetail {
  serviceType: string;
  serviceName: string;
  ratedShipmentDetails: FedExRatedShipmentDetail[];
}

interface FedExRateResponse {
  output?: { rateReplyDetails?: FedExRateReplyDetail[] };
  errors?: { code: string; message: string }[];
}

function gramsToKg(grams: number): number {
  return Math.max(grams / 1000, 0.1);
}

function calculateTotalWeightGrams(items: CartItemForShipping[]): number {
  return items.reduce((total, item) => {
    const weight = item.product?.weightGrams ?? DEFAULT_PRODUCT_WEIGHT_GRAMS;
    return total + weight * item.quantity;
  }, 0);
}

class FedExProvider {
  private apiKey: string;
  private secretKey: string;
  private accountNumber: string;
  private baseUrl: string;
  private cachedToken: { value: string; expiresAt: number } | null = null;

  constructor() {
    this.apiKey = process.env.FEDEX_API_KEY || '';
    this.secretKey = process.env.FEDEX_SECRET_KEY || '';
    this.accountNumber = process.env.FEDEX_ACCOUNT_NUMBER || '';
    // No separate FEDEX_MODE flag - this project runs a single environment,
    // so sandbox vs. production is inferred from NODE_ENV like the rest of
    // the app (e.g. secure cookies), not a bespoke per-provider toggle.
    this.baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://apis.fedex.com'
        : 'https://apis-sandbox.fedex.com';
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.value;
    }

    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.apiKey,
        client_secret: this.secretKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`FedEx OAuth token request failed: ${response.status}`);
    }

    const data = await response.json();
    this.cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return this.cachedToken.value;
  }

  async getRates(
    destination: InternationalDestination,
    weightGrams: number
  ): Promise<{ rates: ShippingRate[]; error?: string }> {
    if (!this.apiKey || !this.secretKey || !this.accountNumber) {
      return { rates: [], error: 'FedEx credentials are not configured.' };
    }

    const settings = await getShopSettings();
    if (!settings || !settings.originPostalCode) {
      return { rates: [], error: 'Kode pos asal pengiriman internasional belum dikonfigurasi. Silakan hubungi admin.' };
    }

    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/rate/v1/rates/quotes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-locale': 'en_US',
      },
      body: JSON.stringify({
        accountNumber: { value: this.accountNumber },
        requestedShipment: {
          shipper: {
            address: {
              postalCode: settings.originPostalCode,
              countryCode: settings.originCountryCode || 'ID',
            },
          },
          recipient: {
            address: {
              postalCode: destination.postalCode,
              countryCode: destination.countryCode,
            },
          },
          pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
          preferredCurrency: 'USD',
          rateRequestType: ['LIST', 'ACCOUNT', 'PREFERRED'],
          requestedPackageLineItems: [
            { weight: { units: 'KG', value: gramsToKg(weightGrams) } },
          ],
        },
      }),
    });

    const data: FedExRateResponse = await response.json();

    if (!response.ok || data.errors) {
      console.error('FedEx rate request failed:', data.errors);
      return { rates: [], error: 'Gagal menghitung ongkos kirim internasional.' };
    }

    const details = data.output?.rateReplyDetails || [];
    if (details.length === 0) {
      return { rates: [], error: 'Tidak ada layanan FedEx tersedia untuk alamat ini.' };
    }

    const rates: ShippingRate[] = details.flatMap((detail) => {
      // PayPal charges USD. Never interpret an account's native-currency quote
      // as USD cents; use FedEx's preferred-currency quote instead (no local FX).
      const usdRates = detail.ratedShipmentDetails.filter((rate) =>
        rate.currency === 'USD' && Number.isFinite(rate.totalNetCharge) && rate.totalNetCharge > 0
      );
      // Prefer account pricing, including PREFERRED_ACCOUNT responses.
      const rateDetail =
        usdRates.find((rate) => rate.rateType.includes('ACCOUNT')) || usdRates[0];
      if (!rateDetail) return [];

      return [{
        courier: 'fedex',
        service: detail.serviceType.toLowerCase(),
        name: detail.serviceName,
        description: 'Ongkir tidak termasuk bea masuk & pajak - ditanggung penerima saat barang tiba',
        category: 'regular',
        costCents: Math.round(rateDetail.totalNetCharge * 100),
        etd: 'N/A',
      }];
    });

    if (rates.length === 0) {
      return { rates: [], error: 'Tidak ada tarif FedEx dalam USD tersedia untuk alamat ini.' };
    }

    rates.sort((a, b) => a.costCents - b.costCents);
    return { rates };
  }
}

let fedexProvider: FedExProvider | null = null;

function getFedExProvider(): FedExProvider {
  if (!fedexProvider) {
    fedexProvider = new FedExProvider();
  }
  return fedexProvider;
}

/**
 * Calculate international shipping rates via FedEx.
 *
 * Requests USD preferred-currency quotes from FedEx and accepts only USD
 * responses. No currency conversion is performed locally.
 * Duties/taxes are explicitly excluded from the quote (DDU - the recipient's
 * local customs collects them, not the shop), per FedEx's own customer
 * message on international rate responses.
 *
 * Returns the same `ShippingRate` shape the RajaOngkir calculator uses
 * (lib/shipping/calculator.ts) so the checkout UI needs no rendering changes.
 */
export async function calculateInternationalShippingRates(
  destination: InternationalDestination,
  items: CartItemForShipping[]
): Promise<{ rates: ShippingRate[]; weight: number; error?: string }> {
  const weightGrams = calculateTotalWeightGrams(items);

  try {
    const { rates, error } = await getFedExProvider().getRates(destination, weightGrams);
    return { rates, weight: weightGrams, error };
  } catch (error) {
    console.error('Failed to calculate international shipping rates:', error);
    return {
      rates: [],
      weight: weightGrams,
      error: error instanceof Error ? error.message : 'Gagal menghitung ongkos kirim internasional.',
    };
  }
}

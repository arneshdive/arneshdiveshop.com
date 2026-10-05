import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartItem } from '@/lib/store/cart';

const mocks = vi.hoisted(() => ({ cart: vi.fn(), checkout: vi.fn() }));
vi.mock('@/lib/store/cart', () => ({ useCartStore: mocks.cart, useCartSync: vi.fn() }));
vi.mock('@/lib/store/checkout', () => ({ useCheckoutStore: mocks.checkout }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@iconify/react', () => ({ Icon: () => null }));
vi.mock('next/image', () => ({ default: () => null }));

import { OrderSummaryCard } from './order-summary-card';

const items: CartItem[] = [{
  id: 'item-1', productId: 'product-1', quantity: 2,
  product: {
    id: 'product-1', name: 'Dive Mask', slug: 'dive-mask',
    priceCents: 20000000, priceCentsUsd: 1250, compareAtPriceCents: 25000000, images: [],
  },
  variant: { id: 'variant-1', name: 'Blue', priceCents: 22000000, priceCentsUsd: 1500 },
}, {
  id: 'item-2', productId: 'product-2', quantity: 1,
  product: {
    id: 'product-2', name: 'Snorkel', slug: 'snorkel',
    priceCents: 10000000, priceCentsUsd: 1000, compareAtPriceCents: null, images: [],
  },
  variant: { id: 'variant-2', name: 'Black', priceCents: null, priceCentsUsd: null },
}];

describe('checkout summary currency', () => {
  beforeEach(() => {
    mocks.cart.mockReturnValue({ items, promoDiscountCents: 1000000, getSubtotalCents: () => 54000000 });
  });

  it('renders USD variant prices, base-price fallback, shipping and the actual PayPal total', () => {
    mocks.checkout.mockReturnValue({ data: { countryCode: 'GB', shippingCostCents: 2500 } });
    const html = renderToStaticMarkup(<OrderSummaryCard selectedProvider="paypal" />);
    for (const amount of ['$30.00', '$10.00', '$40.00', '$25.00', '$65.00']) expect(html).toContain(amount);
    expect(html).not.toContain('Rp');
    expect(html).not.toContain('summary.discount');
  });

  it('retains domestic IDR totals and promotions', () => {
    mocks.checkout.mockReturnValue({ data: { countryCode: 'ID', shippingCostCents: 2000000 } });
    const html = renderToStaticMarkup(<OrderSummaryCard selectedProvider="midtrans" />);
    expect(html).toMatch(/Rp\s*550\.000/);
    expect(html).toContain('summary.discount');
    expect(html).not.toContain('$');
  });

  it('does not substitute IDR prices or a zero-price total for items without a USD price', () => {
    mocks.cart.mockReturnValue({
      items: [{ ...items[1]!, product: { ...items[1]!.product, priceCentsUsd: null } }],
      promoDiscountCents: 0, getSubtotalCents: () => 10000000,
    });
    mocks.checkout.mockReturnValue({ data: { countryCode: 'GB', shippingCostCents: null } });
    const html = renderToStaticMarkup(<OrderSummaryCard selectedProvider="paypal" />);
    expect(html).toContain('—');
    expect(html).not.toContain('Rp');
    expect(html).not.toContain('$0.00');
  });
});

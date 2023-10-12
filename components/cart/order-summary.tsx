'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useCartStore } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils/validators';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants/shipping';

export function OrderSummary() {
  const { items, promoCode, promoDiscount, applyPromo, clearPromo, getSubtotal, getTotal } = useCartStore();
  const [promoInput, setPromoInput] = useState(promoCode || '');
  const [promoError, setPromoError] = useState('');
  const subtotal = getSubtotal();
  const total = getTotal();
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  const handleApplyPromo = () => {
    if (!promoInput.trim()) {
      setPromoError('Masukkan kode promo');
      return;
    }
    const success = applyPromo(promoInput);
    if (success) {
      setPromoError('');
    } else {
      setPromoError('Kode promo tidak valid');
    }
  };

  const handleRemovePromo = () => {
    clearPromo();
    setPromoInput('');
    setPromoError('');
  };

  return (
    <div className="w-full lg:w-80 bg-neutral-100 p-6 h-fit sticky top-24">
      <h2 className="font-semibold mb-6 pb-4 border-b border-neutral-200">Ringkasan Pesanan</h2>

      {/* Items Count */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal ({items.length} item)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Ongkos Kirim</span>
          {freeShipping ? (
            <span className="text-green-600">Gratis</span>
          ) : (
            <span className="text-neutral-400">Dihitung saat checkout</span>
          )}
        </div>
      </div>

      {/* Promo Code */}
      <div className="border-t border-b border-neutral-200 py-4 my-4">
        <p className="text-sm font-medium mb-2">Kode Promo</p>
        {promoCode ? (
          <div className="flex items-center justify-between bg-white px-3 py-2 border border-neutral-300">
            <span className="text-sm font-medium text-green-600">{promoCode}</span>
            <button
              onClick={handleRemovePromo}
              className="text-neutral-400 hover:text-red-500"
              aria-label="Hapus promo"
            >
              <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Masukkan kode"
              className="flex-1 px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
            />
            <button
              onClick={handleApplyPromo}
              className="px-4 py-2 bg-white border border-neutral-300 text-xs hover:border-neutral-900 transition-colors"
            >
              Terapkan
            </button>
          </div>
        )}
        {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
        {promoDiscount > 0 && (
          <p className="text-xs text-green-600 mt-1">Diskon {promoDiscount * 100}% diterapkan</p>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between font-semibold text-lg mb-6">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      {/* CTA */}
      <Link
        href="/checkout"
        className="block w-full bg-neutral-900 text-white py-4 text-center text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors"
      >
        Lanjut ke Checkout
      </Link>

      {/* Trust Badges */}
      <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-neutral-200 text-xs text-neutral-500 text-center">
        <span className="flex items-center gap-1">
          <Icon icon="solar:lock-linear" className="w-4 h-4" />
          Pembayaran Aman
        </span>
      </div>
    </div>
  );
}

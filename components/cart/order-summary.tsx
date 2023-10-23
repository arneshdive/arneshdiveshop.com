'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useCartStore } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils/validators';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants/shipping';
import { AnimatedButton } from '@/components/ui/animated-button';

export function OrderSummary() {
  const { items, promoCode, promoDiscount, applyPromo, clearPromo, getSubtotal, getTotal } = useCartStore();
  const [promoInput, setPromoInput] = useState(promoCode || '');
  const [promoError, setPromoError] = useState('');
  const subtotal = getSubtotal();
  const total = getTotal();
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

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
    <div className="bg-neutral-50 p-8 lg:p-12 sticky top-24 rounded-2xl">
      <h2 className="text-xl font-semibold tracking-tight mb-6">Ringkasan</h2>

      {/* Free shipping progress */}
      {!freeShipping && subtotal > 0 && (
        <div className="mb-6 p-4 bg-neutral-50 rounded-xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-500">Gratis ongkir di atas {formatPrice(FREE_SHIPPING_THRESHOLD)}</span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-neutral-900 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Tambah {formatPrice(remainingForFreeShipping)} lagi untuk gratis ongkir
          </p>
        </div>
      )}

      {/* Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-neutral-100 rounded-lg relative overflow-hidden flex-shrink-0">
              {item.product.image && (
                <img 
                  src={item.product.image} 
                  alt={item.product.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.product.title}</p>
              <p className="text-xs text-neutral-400">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-medium">{item.product.price}</p>
          </div>
        ))}
      </div>

      {/* Promo Code */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2">Kode Promo</p>
        {promoCode ? (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">{promoCode}</span>
            </div>
            <button
              onClick={handleRemovePromo}
              className="text-neutral-400 hover:text-red-500 transition-colors"
              aria-label="Hapus promo"
            >
              <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder="Masukkan kode"
              className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
            />
            <button
              onClick={handleApplyPromo}
              className="px-5 py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Pakai
            </button>
          </div>
        )}
        {promoError && <p className="text-xs text-red-500 mt-2">{promoError}</p>}
        {promoDiscount > 0 && (
          <p className="text-xs text-green-600 mt-2">Diskon {promoDiscount * 100}% diterapkan!</p>
        )}
      </div>

      {/* Totals */}
      <div className="border-t border-neutral-100 pt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Diskon</span>
            <span>-{formatPrice(subtotal * promoDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">Ongkos Kirim</span>
          <span>{freeShipping ? <span className="text-green-600 font-medium">Gratis</span> : 'Dihitung saat checkout'}</span>
        </div>
        <div className="flex justify-between text-xl font-semibold tracking-tight pt-3 border-t border-neutral-100">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8">
        <AnimatedButton asChild className="w-full py-4 text-base">
          <Link href="/checkout">
            Lanjut ke Checkout
          </Link>
        </AnimatedButton>
      </div>

      {/* Trust */}
      <div className="flex items-center justify-center gap-2 mt-6 text-xs text-neutral-400">
        <Icon icon="solar:shield-check-linear" className="w-4 h-4" />
        Transaksi aman & terenkripsi
      </div>
    </div>
  );
}

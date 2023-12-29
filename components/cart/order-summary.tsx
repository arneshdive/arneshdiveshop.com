'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useCartStore } from '@/lib/store/cart';
import { formatRupiah } from '@/lib/utils/format';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants/shipping';
import { AnimatedButton } from '@/components/ui/animated-button';

// Note: FREE_SHIPPING_THRESHOLD is in Rupiah, and cart uses cents (same value)
// So we can use it directly since 1 Rupiah = 100 cents conceptually, but actually
// the system treats priceCents as the actual Rupiah value (e.g., 850000 means Rp 850.000)
// For consistency, we'll treat the threshold as-is

export function OrderSummary() {
  const { 
    items, 
    promoCode, 
    promoDiscountCents, 
    applyPromo, 
    clearPromo, 
    getSubtotalCents, 
    getTotalCents,
    lastError,
  } = useCartStore();
  
  const [promoInput, setPromoInput] = useState(promoCode || '');
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  const subtotalCents = getSubtotalCents();
  const totalCents = getTotalCents();
  const freeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotalCents;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) {
      setPromoError('Masukkan kode promo');
      return;
    }
    
    setIsApplyingPromo(true);
    setPromoError('');
    
    const result = await applyPromo(promoInput);
    
    setIsApplyingPromo(false);
    
    if (!result.success) {
      setPromoError(result.error || 'Kode promo tidak valid');
    }
  };

  const handleRemovePromo = () => {
    clearPromo();
    setPromoInput('');
    setPromoError('');
  };

  // Get image URL for an item
  const getItemImage = (item: typeof items[0]) => {
    return item.product.images?.[0] || null;
  };

  return (
    <>
      {/* Desktop Sidebar Card */}
      <div className="hidden lg:block bg-neutral-50 p-8 lg:p-12 sticky top-24 rounded-2xl">
        <h2 className="text-xl font-semibold tracking-tight mb-6">Ringkasan</h2>

        {/* Free shipping progress */}
        {!freeShipping && subtotalCents > 0 && (
          <div className="mb-6 p-4 bg-white rounded-xl">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-500">Gratis ongkir di atas {formatRupiah(FREE_SHIPPING_THRESHOLD)}</span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((subtotalCents / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              Tambah {formatRupiah(remainingForFreeShipping)} lagi untuk gratis ongkir
            </p>
          </div>
        )}

        {/* Items */}
        <div className="space-y-4 mb-6">
          {items.map((item) => {
            const image = getItemImage(item);
            const priceCents = item.variant?.priceCents ?? item.product.priceCents;
            
            return (
              <div key={item.id} className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-lg relative overflow-hidden flex-shrink-0">
                  {image ? (
                    <img 
                      src={image} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                      <Icon icon="solar:box-linear" className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-neutral-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium">{formatRupiah(priceCents * item.quantity)}</p>
              </div>
            );
          })}
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
                onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                placeholder="Masukkan kode"
                disabled={isApplyingPromo}
                className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleApplyPromo}
                disabled={isApplyingPromo}
                className="px-5 py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {isApplyingPromo ? 'Memeriksa...' : 'Pakai'}
              </button>
            </div>
          )}
          {promoError && <p className="text-xs text-red-500 mt-2">{promoError}</p>}
          {lastError && <p className="text-xs text-red-500 mt-2">{lastError}</p>}
          {promoDiscountCents > 0 && (
            <p className="text-xs text-green-600 mt-2">Diskon {formatRupiah(promoDiscountCents)} diterapkan!</p>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-neutral-100 pt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span>{formatRupiah(subtotalCents)}</span>
          </div>
          {promoDiscountCents > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Diskon</span>
              <span>-{formatRupiah(promoDiscountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Ongkos Kirim</span>
            <span>{freeShipping ? <span className="text-green-600 font-medium">Gratis</span> : 'Dihitung saat checkout'}</span>
          </div>
          <div className="flex justify-between text-xl font-semibold tracking-tight pt-3 border-t border-neutral-100">
            <span>Total</span>
            <span>{formatRupiah(totalCents)}</span>
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

      {/* Mobile: Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="w-full"
        >
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-neutral-500">Total</span>
              <span className="text-lg font-semibold tracking-tight">{formatRupiah(totalCents)}</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-400">
              <span className="text-xs">Detail</span>
              <Icon icon="solar:alt-arrow-up-linear" className="w-4 h-4" />
            </div>
          </div>
        </button>
        <div className="px-4 pb-4">
          <AnimatedButton asChild className="w-full py-4 text-sm">
            <Link href="/checkout">
              Checkout
            </Link>
          </AnimatedButton>
        </div>
      </div>

      {/* Mobile: Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-drawer-up">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Ringkasan</h2>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 -mr-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <Icon icon="solar:close-circle-linear" className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <div className="p-6">
              {/* Free shipping progress */}
              {!freeShipping && subtotalCents > 0 && (
                <div className="mb-6 p-4 bg-neutral-50 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500">Gratis ongkir di atas {formatRupiah(FREE_SHIPPING_THRESHOLD)}</span>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((subtotalCents / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    Tambah {formatRupiah(remainingForFreeShipping)} lagi untuk gratis ongkir
                  </p>
                </div>
              )}

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
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                      placeholder="Masukkan kode"
                      disabled={isApplyingPromo}
                      className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors disabled:opacity-50"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={isApplyingPromo}
                      className="px-5 py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                      {isApplyingPromo ? 'Memeriksa...' : 'Pakai'}
                    </button>
                  </div>
                )}
                {promoError && <p className="text-xs text-red-500 mt-2">{promoError}</p>}
                {lastError && <p className="text-xs text-red-500 mt-2">{lastError}</p>}
                {promoDiscountCents > 0 && (
                  <p className="text-xs text-green-600 mt-2">Diskon {formatRupiah(promoDiscountCents)} diterapkan!</p>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-neutral-100 pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span>{formatRupiah(subtotalCents)}</span>
                </div>
                {promoDiscountCents > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Diskon</span>
                    <span>-{formatRupiah(promoDiscountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Ongkos Kirim</span>
                  <span>{freeShipping ? <span className="text-green-600 font-medium">Gratis</span> : 'Dihitung saat checkout'}</span>
                </div>
                <div className="flex justify-between text-xl font-semibold tracking-tight pt-3 border-t border-neutral-100">
                  <span>Total</span>
                  <span>{formatRupiah(totalCents)}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6">
                <AnimatedButton asChild className="w-full py-4 text-base">
                  <Link href="/checkout">
                    Lanjut ke Checkout
                  </Link>
                </AnimatedButton>
              </div>

              {/* Trust */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-neutral-400">
                <Icon icon="solar:shield-check-linear" className="w-4 h-4" />
                Transaksi aman & terenkripsi
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

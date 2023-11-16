'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { useCartStore } from '@/lib/store/cart';
import { useCheckoutStore } from '@/lib/store/checkout';
import { shippingMethods } from '@/lib/constants/shipping';
import { formatRupiah } from '@/lib/utils/format';

export function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { items, clearCart } = useCartStore();
  const { data, reset } = useCheckoutStore();
  const hasCleared = useRef(false);

  const orderId = searchParams.get('order_id') || `ARD-${new Date().getFullYear()}-0000`;

  // Clear cart and checkout data on successful order - only once
  useEffect(() => {
    if (hasCleared.current) return;
    hasCleared.current = true;
    
    const timer = setTimeout(() => {
      clearCart();
      reset();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [clearCart, reset]);

  const selectedMethod = shippingMethods.find((m) => m.id === data.shippingMethod);
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.product.price.replace(/[^0-9]/g, ''));
    return sum + price * item.quantity;
  }, 0);

  const fullAddress = [data.address1, data.address2, data.city, data.province, data.postalCode]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      {/* Hero */}
      <section className="relative bg-neutral-100 pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Icon icon="solar:check-circle-bold" className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter mb-4">
              Terima Kasih!
            </h1>
            <p className="text-neutral-500 max-w-md mx-auto mb-4">
              Pesanan Anda telah berhasil dibuat
            </p>
            <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm">
              <span className="text-sm text-neutral-500">No. Pesanan:</span>
              <span className="font-semibold">{orderId}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Shipping Info */}
            <div className="p-8 border-b border-neutral-100">
              <h2 className="text-xl font-semibold tracking-tight mb-6">Informasi Pengiriman</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Nama</p>
                  <p className="font-medium">{data.fullName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Metode Pengiriman</p>
                  <p className="font-medium">{selectedMethod ? `${selectedMethod.name}` : '-'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-neutral-400 mb-1">Alamat</p>
                  <p className="font-medium">{fullAddress || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Email</p>
                  <p className="font-medium">{data.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Telepon</p>
                  <p className="font-medium">{data.phone || '-'}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-8 border-b border-neutral-100">
              <h2 className="text-xl font-semibold tracking-tight mb-6">Detail Pesanan</h2>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-16 h-20 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-300">
                      <Icon icon="solar:box-linear" className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.product.title}</p>
                      <p className="text-sm text-neutral-400">
                        {item.selectedVariant?.color || item.selectedVariant?.size} • Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">{item.product.price}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-neutral-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Ongkos Kirim</span>
                  <span>{formatRupiah(selectedMethod?.price || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-3 border-t border-neutral-100">
                  <span>Total</span>
                  <span>{formatRupiah(subtotal + (selectedMethod?.price || 0))}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="p-8 bg-amber-50">
              <div className="flex gap-3">
                <Icon icon="solar:info-circle-linear" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 mb-1">Instruksi Pembayaran</p>
                  <p className="text-sm text-amber-700">
                    Anda akan diarahkan ke halaman pembayaran Midtrans untuk menyelesaikan transaksi. 
                    Jika pembayaran belum selesai, Anda dapat melanjutkan dari halaman pesanan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <AnimatedButton asChild className="flex-1 py-4 text-sm uppercase tracking-wider">
              <Link href="/account/orders">
                Lihat Pesanan
              </Link>
            </AnimatedButton>
            <Link
              href="/"
              className="flex-1 py-4 text-center text-sm uppercase tracking-wider border-2 border-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              Lanjut Belanja
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

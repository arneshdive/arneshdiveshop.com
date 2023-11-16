'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { formatRupiah } from '@/lib/utils/format';

interface OrderConfirmationCardProps {
  orderId: string;
  customerName: string;
  email: string;
  address: string;
  shippingMethod: string;
  items: Array<{
    title: string;
    variant?: string;
    quantity: number;
    price: string;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
}

export function OrderConfirmationCard({
  orderId,
  customerName,
  email,
  address,
  shippingMethod,
  items,
  subtotal,
  shippingCost,
  total,
}: OrderConfirmationCardProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white border border-neutral-200">
        {/* Header */}
        <div className="text-center p-8 border-b border-neutral-200">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Icon icon="solar:check-circle-bold" className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold">Terima Kasih!</h1>
          <p className="text-neutral-500">Pesanan Anda telah berhasil dibuat</p>
        </div>

        {/* Order Number */}
        <div className="bg-neutral-100 p-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Nomor Pesanan</p>
          <p className="text-xl font-semibold">{orderId}</p>
        </div>

        {/* Details */}
        <div className="p-6">
          {/* Shipping Info */}
          <div className="mb-6">
            <h2 className="font-semibold pb-2 mb-4 border-b border-neutral-200">
              Informasi Pengiriman
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-neutral-500">Nama</p>
                <p className="font-medium">{customerName}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Metode Pengiriman</p>
                <p>{shippingMethod}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-neutral-500">Alamat</p>
                <p>{address}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Email</p>
                <p>{email}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h2 className="font-semibold pb-2 mb-4 border-b border-neutral-200">Detail Pesanan</h2>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 pb-4 border-b border-neutral-200 last:border-b-0">
                  <div className="w-16 h-20 bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 text-[10px]">
                    Img
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-neutral-500">
                      {item.variant && `${item.variant} | `}Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-sm">{item.price}</p>
                </div>
              ))}
            </div>
            <div className="bg-neutral-100 p-4 mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Ongkos Kirim</span>
                <span>{formatRupiah(shippingCost)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-neutral-300">
                <span>Total</span>
                <span>{formatRupiah(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-yellow-50 border border-yellow-300 p-4 mb-6">
            <p className="font-semibold mb-2">Instruksi Pembayaran</p>
            <p className="text-sm text-yellow-800 mb-2">
              Anda akan diarahkan ke halaman pembayaran Midtrans untuk menyelesaikan transaksi.
            </p>
            <p className="text-xs text-yellow-700">
              Jika pembayaran belum selesai, Anda dapat melanjutkan dari halaman pesanan.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/account/orders"
              className="flex-1 bg-neutral-900 text-white py-3 text-center text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              Lihat Pesanan
            </Link>
            <Link
              href="/"
              className="flex-1 bg-white border border-neutral-900 py-3 text-center text-xs uppercase tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Lanjut Belanja
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-100 p-4 text-center text-sm text-neutral-500">
          Konfirmasi pembayaran telah dikirim ke email Anda.
          <br />
          Pertanyaan?{' '}
          <Link href="/contact" className="text-neutral-900 hover:underline">
            Hubungi kami
          </Link>
        </div>
      </div>
    </div>
  );
}

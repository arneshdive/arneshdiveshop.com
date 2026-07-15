'use client';

import { useEffect, useRef, useState, use } from 'react';
import { Icon } from '@iconify/react';
import { formatRupiah, formatDate, toTitleCase } from '@/lib/utils/format';
import { orderStatusConfig } from '@/lib/constants/order-status';
import type { OrderStatus, PaymentStatus } from '@/lib/db/schema';

interface PrintOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  trackingNumber: string | null;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  createdAt: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingAddress1: string;
  shippingAddress2: string | null;
  shippingCity: string;
  shippingState: string | null;
  shippingPostalCode: string;
  shippingCountry: string;
  notes: string | null;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    priceCents: number;
    variant: { id: string; name: string } | null;
  }>;
  payments: Array<{
    status: PaymentStatus;
    paymentMethod: string | null;
    paidAt: string | null;
  }>;
}

export default function OrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<PrintOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasTriggeredPrint = useRef(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${id}`);
        if (!response.ok) {
          setError('Pesanan tidak ditemukan');
          return;
        }
        const data = await response.json();
        setOrder(data.order);
      } catch {
        setError('Gagal memuat pesanan');
      }
    }
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!order || hasTriggeredPrint.current) return;
    hasTriggeredPrint.current = true;
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, [order]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-neutral-500">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon="solar:spinner-line" className="w-6 h-6 text-neutral-400 animate-spin" />
      </div>
    );
  }

  const status = orderStatusConfig[order.status];
  const payment = order.payments[0];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto py-8 px-6 print:p-0 print:max-w-none text-[11px] leading-snug">
        {/* Invoice Header */}
        <div className="flex items-start justify-between border-b border-neutral-300 pb-4 mb-4">
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-neutral-900">arneshdiveshop.com</h1>
            <p className="text-[10px] text-neutral-500 mt-0.5">Invoice Pesanan</p>
          </div>
          <div className="text-right">
            <p className="font-semibold tracking-tight text-neutral-900">{order.orderNumber}</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">{formatDate(order.createdAt)}</p>
            <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border border-neutral-900 text-neutral-900">
              {status.label}
            </span>
          </div>
        </div>

        {/* Customer & Shipping */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">Pelanggan</h2>
            <p className="font-medium text-neutral-900">{order.customer.firstName} {order.customer.lastName}</p>
            <p className="text-neutral-600">{order.customer.email}</p>
            {order.customer.phone && <p className="text-neutral-600">{order.customer.phone}</p>}
          </div>
          <div>
            <h2 className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">Alamat Pengiriman</h2>
            <p className="font-medium text-neutral-900">{order.shippingFirstName} {order.shippingLastName}</p>
            <p className="text-neutral-600">
              {order.shippingAddress1}{order.shippingAddress2 && `, ${order.shippingAddress2}`}
            </p>
            <p className="text-neutral-600">
              {toTitleCase(order.shippingCity)}{order.shippingState && `, ${toTitleCase(order.shippingState)}`} {order.shippingPostalCode}
            </p>
            {order.trackingNumber && (
              <p className="text-neutral-600 mt-1">Resi: {order.trackingNumber}</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-4 border-collapse table-fixed">
          <colgroup>
            <col className="w-[46%]" />
            <col className="w-[12%]" />
            <col className="w-[21%]" />
            <col className="w-[21%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-neutral-300 text-left text-[9px] uppercase tracking-wider text-neutral-500">
              <th className="py-1.5 pr-2 font-semibold">Item</th>
              <th className="py-1.5 px-2 font-semibold text-center">Qty</th>
              <th className="py-1.5 px-2 font-semibold text-right">Harga</th>
              <th className="py-1.5 pl-2 font-semibold text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-100">
                <td className="py-1.5 pr-2">
                  <p className="font-medium text-neutral-900 truncate">{item.name}</p>
                  {item.variant?.name && (
                    <p className="text-[10px] text-neutral-500 truncate">{item.variant.name}</p>
                  )}
                </td>
                <td className="py-1.5 px-2 text-center text-neutral-700 whitespace-nowrap">{item.quantity}</td>
                <td className="py-1.5 px-2 text-right text-neutral-700 whitespace-nowrap">{formatRupiah(item.priceCents)}</td>
                <td className="py-1.5 pl-2 text-right font-medium text-neutral-900 whitespace-nowrap">
                  {formatRupiah(item.priceCents * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mb-6">
          <div className="w-48 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span className="text-neutral-700">{formatRupiah(order.subtotalCents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Ongkos Kirim</span>
              <span className="text-neutral-700">{order.shippingCents === 0 ? 'Gratis' : formatRupiah(order.shippingCents)}</span>
            </div>
            {order.taxCents > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Pajak</span>
                <span className="text-neutral-700">{formatRupiah(order.taxCents)}</span>
              </div>
            )}
            {order.discountCents > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Diskon</span>
                <span className="text-green-600">-{formatRupiah(order.discountCents)}</span>
              </div>
            )}
            <div className="pt-1.5 border-t border-neutral-300 flex items-center justify-between">
              <span className="font-semibold text-neutral-900">Total</span>
              <span className="font-semibold text-neutral-900">{formatRupiah(order.totalCents)}</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        {payment && (
          <div className="text-neutral-600 mb-4">
            <span className="text-neutral-500">Pembayaran: </span>
            {payment.status === 'paid' ? 'Lunas' : payment.status === 'failed' ? 'Gagal' : payment.status === 'expired' ? 'Kadaluarsa' : 'Menunggu'}
            {payment.paymentMethod && ` · ${payment.paymentMethod.replace('_', ' ')}`}
            {payment.paidAt && ` · Dibayar ${formatDate(payment.paidAt)}`}
          </div>
        )}

        {order.notes && (
          <div className="text-neutral-600 mb-4">
            <span className="text-neutral-500">Catatan: </span>{order.notes}
          </div>
        )}

        <p className="text-[9px] text-neutral-400 text-center border-t border-neutral-200 pt-4">
          Terima kasih telah berbelanja di arneshdiveshop.com
        </p>
      </div>
    </div>
  );
}

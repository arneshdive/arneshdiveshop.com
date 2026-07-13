'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

type PaymentStatus = 'success' | 'pending' | 'failed' | 'loading';

function CheckoutCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const orderIdParam = searchParams.get('order_id');
    const transactionStatus = searchParams.get('transaction_status');
    const statusCode = searchParams.get('status_code');

    if (!orderIdParam) {
      router.push('/account');
      return;
    }

    setOrderId(orderIdParam);

    // Determine payment status from Midtrans callback params
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      setStatus('success');
    } else if (transactionStatus === 'pending') {
      setStatus('pending');
    } else if (['deny', 'cancel', 'expire'].includes(transactionStatus || '')) {
      setStatus('failed');
    } else if (statusCode === '200' || statusCode === '201') {
      // Fallback: 200 = success, 201 = pending
      setStatus(statusCode === '200' ? 'success' : 'pending');
    } else {
      setStatus('failed');
    }
  }, [searchParams, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900" />
      </div>
    );
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-[480px] mx-auto px-6 text-center">
        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon icon="solar:check-circle-bold" className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter mb-4">
              Pembayaran Berhasil!
            </h1>
            <p className="text-neutral-500 mb-8">
              Terima kasih! Pesanan Anda telah dikonfirmasi dan sedang diproses.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/account/orders/${orderId}`)}
                className="w-full py-3 px-6 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                Lihat Pesanan
              </button>
              <button
                onClick={() => router.push('/account')}
                className="w-full py-3 px-6 border border-neutral-300 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Ke Akun Saya
              </button>
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon icon="solar:clock-circle-bold" className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter mb-4">
              Menunggu Pembayaran
            </h1>
            <p className="text-neutral-500 mb-8">
              Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran sesuai instruksi yang diberikan.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/account/orders/${orderId}`)}
                className="w-full py-3 px-6 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                Lihat Pesanan
              </button>
              <button
                onClick={() => router.push('/account')}
                className="w-full py-3 px-6 border border-neutral-300 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Ke Akun Saya
              </button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon icon="solar:close-circle-bold" className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter mb-4">
              Pembayaran Gagal
            </h1>
            <p className="text-neutral-500 mb-8">
              Maaf, pembayaran Anda tidak dapat diproses. Silakan coba lagi atau hubungi customer service.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/checkout')}
                className="w-full py-3 px-6 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                Coba Lagi
              </button>
              <button
                onClick={() => router.push('/account')}
                className="w-full py-3 px-6 border border-neutral-300 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Ke Akun Saya
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900" />
      </div>
    }>
      <CheckoutCallbackContent />
    </Suspense>
  );
}

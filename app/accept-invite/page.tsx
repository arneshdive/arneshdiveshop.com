'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<{ email: string; name: string | null; role: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Token undangan tidak ditemukan');
      return;
    }

    // Automatically accept the invitation
    acceptInvitation(token);
  }, [token]);

  const acceptInvitation = async (inviteToken: string) => {
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('kadaluarsa')) {
          setStatus('expired');
        } else {
          setStatus('error');
          setError(data.error || 'Terjadi kesalahan');
        }
        return;
      }

      setUser(data.user);
      setStatus('success');

      // Redirect to admin after a short delay
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setStatus('error');
      setError('Terjadi kesalahan pada server');
    }
  };

  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : 'Admin';

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tighter hover:opacity-70 transition-opacity">
            <span className="italic">ArneshDive</span>®
          </Link>
        </div>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400 mb-4" />
            <p className="text-neutral-600">Memproses undangan...</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && user && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Undangan Diterima!</h2>
            <p className="text-sm text-neutral-500 mb-4">
              Anda sekarang menjadi <strong>{roleLabel}</strong> di Arnesh Dive.
            </p>
            <p className="text-xs text-neutral-400 mb-6">
              Mengalihkan ke panel admin...
            </p>
            <AnimatedButton onClick={() => router.push('/admin')} className="w-full py-3 text-sm">
              Buka Panel Admin
            </AnimatedButton>
          </div>
        )}

        {/* Expired State */}
        {status === 'expired' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Token Kedaluwarsa</h2>
            <p className="text-sm text-neutral-500 mb-6">
              Link undangan ini sudah tidak berlaku. Silakan minta administrator untuk mengirim ulang undangan.
            </p>
            <Link
              href="/"
              className="block w-full text-center text-sm text-neutral-600 hover:text-neutral-900"
            >
              ← Kembali ke toko
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Terjadi Kesalahan</h2>
            <p className="text-sm text-red-500 mb-6">{error}</p>
            <Link
              href="/"
              className="block w-full text-center text-sm text-neutral-600 hover:text-neutral-900"
            >
              ← Kembali ke toko
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}

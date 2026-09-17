'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatedUnderline } from '@/components/ui/animated-underline';

// Client-fetched (not read from the session cookie on the server) so this
// one admin-only link doesn't force the whole storefront route to render
// dynamically on every request — see footer.tsx.
export function AdminFooterLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && (data?.user?.role === 'admin' || data?.user?.role === 'super_admin')) {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link href="/admin" className="hover:text-white transition-colors">
      <AnimatedUnderline>Portal Admin</AnimatedUnderline>
    </Link>
  );
}

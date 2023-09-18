import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isAdmin = nextUrl.pathname.startsWith('/admin');
  const isAuthPage =
    nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/register');
  const isAccountPage = nextUrl.pathname.startsWith('/account');

  if (isAdmin && !session?.user) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  if (isAdmin && (session?.user as { role?: string })?.role === 'customer') {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  if ((isAuthPage || isAccountPage) && session?.user) {
    return NextResponse.redirect(new URL('/account', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/login', '/register', '/account/:path*'],
};

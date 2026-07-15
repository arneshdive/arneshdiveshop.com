import { NextRequest, NextResponse } from 'next/server';
import { verifySession, type SessionPayload } from '@/lib/auth/session';

// Routes that require authentication
const protectedRoutes = ['/account'];

// Routes that require admin role
const adminRoutes = ['/admin', '/print/orders'];
const adminApiRoutes = ['/api/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session from cookie
  const token = request.cookies.get('session')?.value;
  let session: SessionPayload | null = null;

  if (token) {
    session = await verifySession(token);
  }

  // Check if route requires auth
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminApiRoute = adminApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // No session on protected route → redirect to login
  if ((isProtectedRoute || isAdminRoute || isAdminApiRoute) && !session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route but not admin role → deny access
  if ((isAdminRoute || isAdminApiRoute) && session) {
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Akses ditolak' },
          { status: 403 }
        );
      }
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // Add session to headers for downstream use
  const response = NextResponse.next();
  if (session) {
    response.headers.set('x-user-id', session.userId);
    response.headers.set('x-user-role', session.role);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

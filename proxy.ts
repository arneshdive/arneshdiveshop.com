import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, type SessionPayload } from '@/lib/auth/session';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication
const protectedRoutes = ['/account'];

// Routes that require admin role
const adminRoutes = ['/admin', '/print/orders'];
const adminApiRoutes = ['/api/admin'];

// Paths that get locale detection/prefixing — this is an allowlist, not a
// blocklist, deliberately: it's exactly the route group under
// app/[locale]/(store)/**. Everything else (admin, auth, API, print, docs,
// lab, accept-invite, .well-known, the legacy short-link redirects, and any
// root-level special file — sitemap.xml, robots.txt, icons, opengraph-image,
// llms.txt, google-merchant.xml, and whatever gets added later) stays
// unprefixed and untouched by next-intl. A blocklist here would need a new
// entry every time a root-level route is added; this list only needs to
// track app/[locale]/(store)'s own route folders, which is what the SEO
// alternates/sitemap code already has to enumerate anyway. An early version
// of this file used a blocklist and it 404'd /sitemap.xml and /robots.txt
// because next-intl rewrote them into the (nonexistent) /id/sitemap.xml —
// this allowlist is the fix.
const LOCALIZED_ROOT_PATHS = [
  '/',
  '/produk',
  '/search',
  '/blog',
  '/faq',
  '/kontak',
  '/privasi',
  '/syarat',
  '/cart',
  '/checkout',
  '/account',
  '/auth',
];

function stripLocalePrefix(pathname: string) {
  const nonDefaultLocales = routing.locales.filter((locale) => locale !== routing.defaultLocale);
  for (const locale of nonDefaultLocales) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

// The locale prefix a pathname carries, e.g. "/en" for "/en/account/orders",
// or "" for a default-locale (unprefixed) or non-localized path. Used to
// carry the visitor's locale across the redirect to /auth, since that's a
// separate request/response and next-intl only prefixes requests that are
// already in LOCALIZED_ROOT_PATHS.
function getPathLocalePrefix(pathname: string) {
  const nonDefaultLocales = routing.locales.filter((locale) => locale !== routing.defaultLocale);
  for (const locale of nonDefaultLocales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) return `/${locale}`;
  }
  return '';
}

function isLocalizedRoute(pathname: string) {
  const stripped = stripLocalePrefix(pathname);
  return LOCALIZED_ROOT_PATHS.some(
    (route) => stripped === route || (route !== '/' && stripped.startsWith(`${route}/`))
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Markdown for Agents: agents that send Accept: text/markdown get a
  // markdown rendering of the homepage instead of HTML. Rewritten (not
  // redirected) so the URL bar/caller-visible path stays "/".
  if (
    pathname === '/' &&
    request.method === 'GET' &&
    request.headers.get('accept')?.includes('text/markdown')
  ) {
    return NextResponse.rewrite(new URL('/api/markdown/home', request.url));
  }

  const localized = isLocalizedRoute(pathname);
  const intlResponse = localized ? intlMiddleware(request) : null;

  // Locale negotiation added/changed the URL (e.g. detected a non-default
  // locale for an unprefixed path) — follow that redirect before anything
  // else runs.
  if (intlResponse && intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  const response = intlResponse ?? NextResponse.next();
  const pathnameWithoutLocale = localized ? stripLocalePrefix(pathname) : pathname;

  // Get session from cookie
  const token = request.cookies.get('session')?.value;
  let session: SessionPayload | null = null;

  if (token) {
    session = await verifySession(token);
  }

  // Check if route requires auth
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isAdminApiRoute = adminApiRoutes.some((route) => pathname.startsWith(route));

  // No session on protected route → redirect to login
  if ((isProtectedRoute || isAdminRoute || isAdminApiRoute) && !session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Admin routes are never localized, so this stays plain "/auth" for
    // them; a locale-prefixed customer route (e.g. "/en/account") carries
    // its "/en" prefix over to the login page too, so the visitor doesn't
    // get bounced back into the default locale just because /auth and
    // /account are two separate requests.
    const authPrefix = isProtectedRoute ? getPathLocalePrefix(pathname) : '';
    const loginUrl = new URL(`${authPrefix}/auth`, request.url);
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
  if (session) {
    response.headers.set('x-user-id', session.userId);
    response.headers.set('x-user-role', session.role);
  }

  // RFC 8288 Link headers for agent discovery — advertise the API catalog
  // and its docs from the homepage.
  if (pathname === '/') {
    response.headers.set(
      'Link',
      '</.well-known/api-catalog>; rel="api-catalog", </docs/api>; rel="service-doc"'
    );
    response.headers.set('Vary', 'Accept');
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

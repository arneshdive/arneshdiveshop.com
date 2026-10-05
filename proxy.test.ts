import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { CATEGORY_SLUG_ALIASES } from '@/lib/constants/category-aliases';
import { routing } from '@/i18n/routing';

const { intl, verifySession } = vi.hoisted(() => ({
  intl: vi.fn(),
  verifySession: vi.fn(),
}));
vi.mock('next-intl/middleware', () => ({ default: () => intl }));
vi.mock('@/lib/auth/session', () => ({ verifySession }));

import { proxy } from './proxy';

beforeEach(() => {
  vi.clearAllMocks();
  intl.mockReturnValue(NextResponse.next());
});

describe('legacy category redirects', () => {
  for (const locale of routing.locales) {
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
    for (const [source, target] of Object.entries(CATEGORY_SLUG_ALIASES)) {
      it(`permanently redirects ${locale}/${source}, preserving other query values`, async () => {
        const request = new NextRequest(
          `https://example.com${prefix}/produk?category=${source}&q=blue%20fins&page=2&brand=mares&tag=a&tag=b`
        );
        const response = await proxy(request);
        expect(response.status).toBe(308);
        const destination = new URL(response.headers.get('location')!);
        expect(destination.pathname).toBe(`${prefix}/produk`);
        expect(destination.searchParams.get('category')).toBe(target);
        expect(destination.searchParams.get('q')).toBe('blue fins');
        expect(destination.searchParams.get('page')).toBe('2');
        expect(destination.searchParams.get('brand')).toBe('mares');
        expect(destination.searchParams.getAll('tag')).toEqual(['a', 'b']);
        expect(intl).not.toHaveBeenCalled();
        expect(verifySession).not.toHaveBeenCalled();
      });
    }
  }

  it.each([
    '/produk?category=fins',
    '/produk?category=bcd',
    '/produk?category=unknown',
    '/produk?category=constructor',
    '/produk/item?category=fin',
    '/api/search?category=fin',
    '/blog?category=fin',
  ])('leaves unrelated URLs alone: %s', async (path) => {
    const response = await proxy(new NextRequest(`https://example.com${path}`));
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});

import { beforeEach, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { CATEGORY_SLUG_ALIASES } from '@/lib/constants/category-aliases';

const { findCategory, findProducts } = vi.hoisted(() => ({
  findCategory: vi.fn(),
  findProducts: vi.fn(),
}));
vi.mock('@/lib/db', async () => {
  const schema = await import('@/lib/db/schema');
  return {
    ...schema,
    db: { query: {
      categories: { findFirst: findCategory },
      products: { findMany: findProducts },
    } },
  };
});

import { searchProducts } from './products';

const dialect = new PgDialect();
beforeEach(() => {
  vi.clearAllMocks();
  findProducts.mockResolvedValue([]);
});

it.each(Object.entries(CATEGORY_SLUG_ALIASES))('resolves API category alias %s to %s', async (source, target) => {
  findCategory.mockResolvedValue({ id: 'surviving-id' });
  await searchProducts({ category: source });
  expect(dialect.sqlToQuery(findCategory.mock.calls[0]![0].where).params).toEqual([target]);
  const query = dialect.sqlToQuery(findProducts.mock.calls[0]![0].where);
  expect(query.params).toEqual([true, 'surviving-id']);
  expect(query.sql).toContain('"products"."deleted_at" is null');
});

it('returns no matches for a missing category instead of removing its filter', async () => {
  findCategory.mockResolvedValue(undefined);
  await searchProducts({ category: 'missing-category' });
  const query = dialect.sqlToQuery(findProducts.mock.calls[0]![0].where);
  expect(query.sql).toContain('false');
});

it('still supports category UUID filters without a slug lookup', async () => {
  const id = 'f016b59b-1b5f-4c0f-b63a-b609af2a82a6';
  await searchProducts({ category: id });
  expect(findCategory).not.toHaveBeenCalled();
  expect(dialect.sqlToQuery(findProducts.mock.calls[0]![0].where).params).toEqual([true, id]);
});

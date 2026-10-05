// One-off approved data migration. Dry-run by default; never run on deploy.
// Apply: node lib/scripts/consolidate-categories.mjs --apply --snapshot-dir /existing/private/directory
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MERGES = [
  { source: 'fin', target: 'fins', sourceId: '14c387c2-e7b0-46b9-bcb2-12aceadde09a', targetId: 'f016b59b-1b5f-4c0f-b63a-b609af2a82a6' },
  { source: 'mask', target: 'masker', sourceId: '61ec0617-5b5c-491f-8c5b-40b1feedeea1', targetId: '07cdddb9-69a7-4fb6-a588-c01cef53a5fa' },
  { source: 'wetsuits', target: 'wetsuit', sourceId: 'e55f2c32-ebcb-458a-b9af-bc8fad19de1d', targetId: '1b6200e5-0d57-43e7-b607-1a87c7343450' },
  { source: 'accessories', target: 'aksesoris', sourceId: '56b0d619-51a6-42e9-b1b2-aa577119b4ec', targetId: 'a7d003bc-8376-4eb6-b6ef-65ac60df2171' },
];

function canonicalSlug(slug) {
  return MERGES.find((merge) => merge.source === slug)?.target ?? slug;
}

export function canonicalCtaHref(href) {
  if (!href) return href;
  const url = new URL(href, 'https://category-migration.invalid');
  if (!/^\/(?:id\/|en\/|es\/|ja\/|fr\/)?produk\/?$/.test(url.pathname)) return href;
  // Replace only the category value, preserving other parameters, duplicate
  // keys, original encoding, the locale, and fragment byte-for-byte.
  const hashIndex = href.indexOf('#');
  const queryEnd = hashIndex < 0 ? href.length : hashIndex;
  const queryStart = href.indexOf('?');
  if (queryStart < 0 || queryStart > queryEnd) return href;
  const query = href.slice(queryStart, queryEnd).replace(/([?&]category=)([^&#]*)/g, (match, key, value) => {
    const decoded = decodeURIComponent(value.replace(/\+/g, ' '));
    const target = canonicalSlug(decoded);
    return target === decoded ? match : `${key}${target}`;
  });
  return href.slice(0, queryStart) + query + href.slice(queryEnd);
}

export function expectedConsolidation(before) {
  const after = structuredClone(before);
  for (const merge of MERGES) {
    const source = after.categories.find((category) => category.slug === merge.source);
    const target = after.categories.find((category) => category.slug === merge.target);
    if (source?.id !== merge.sourceId || target?.id !== merge.targetId) {
      throw new Error(`Category IDs changed or source missing: ${merge.source} -> ${merge.target}`);
    }
    for (const product of after.products) {
      if (product.category_id === source.id) product.category_id = target.id;
    }
    if (merge.source === 'fin' && !target.description?.trim()) target.description = source.description;
    if (merge.target === 'masker') target.name = 'Masker';
  }
  const sourceIds = new Set(MERGES.map((merge) => merge.sourceId));
  after.categories = after.categories.filter((category) => !sourceIds.has(category.id));
  for (const post of after.blog_posts) {
    post.related_category_slug = canonicalSlug(post.related_category_slug);
    post.cta_href = canonicalCtaHref(post.cta_href);
  }
  const categoryIds = new Set(after.categories.map((category) => category.id));
  if (after.products.some((product) => !categoryIds.has(product.category_id))) {
    throw new Error('Orphan product category detected');
  }
  return after;
}

function summarize(snapshot) {
  return snapshot.categories.map((category) => {
    const products = snapshot.products.filter((product) => product.category_id === category.id);
    return {
      slug: category.slug,
      total: products.length,
      visible: products.filter((product) => product.is_active && product.deleted_at === null).length,
      inactive: products.filter((product) => !product.is_active && product.deleted_at === null).length,
      deleted: products.filter((product) => product.deleted_at !== null).length,
    };
  }).sort((a, b) => a.slug.localeCompare(b.slug));
}

// Static trusted SQL only. Values in mutations and guards are parameterized.
// Full rows include all current columns, including columns absent from the
// application schema; exact JSON equality guards against collateral changes.
const STATE_SQL = `jsonb_build_object(
  'categories', (select coalesce(jsonb_agg(to_jsonb(c) order by id), '[]'::jsonb) from categories c),
  'products', (select coalesce(jsonb_agg(to_jsonb(p) order by id), '[]'::jsonb) from products p),
  'product_variants', (select coalesce(jsonb_agg(to_jsonb(v) order by id), '[]'::jsonb) from product_variants v),
  'blog_posts', (select coalesce(jsonb_agg(to_jsonb(b) order by id), '[]'::jsonb) from blog_posts b),
  'category_fks', (select coalesce(jsonb_agg(jsonb_build_object(
    'name', conname, 'table', conrelid::regclass::text, 'definition', pg_get_constraintdef(oid)
  ) order by conname), '[]'::jsonb) from pg_constraint where confrelid = 'categories'::regclass),
  'triggers', (select coalesce(jsonb_agg(jsonb_build_object(
    'table', c.relname, 'name', t.tgname, 'enabled', t.tgenabled::text,
    'definition', pg_get_triggerdef(t.oid), 'function', pg_get_functiondef(t.tgfoid)
  ) order by c.relname, t.tgname), '[]'::jsonb)
    from pg_trigger t join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal and n.nspname = current_schema()
    and c.relname in ('categories', 'products', 'product_variants', 'blog_posts'))
)`;

async function main() {
  config({ quiet: true });
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const sql = neon(process.env.DATABASE_URL);
  const [{ snapshot: before }] = await sql`select ${sql.unsafe(STATE_SQL)} as snapshot`;
  const after = expectedConsolidation(before);
  if (before.category_fks.length !== 1 || before.category_fks[0].table !== 'products' ||
      before.category_fks[0].name !== 'products_category_id_categories_id_fk') {
    throw new Error('Category foreign keys differ from the reviewed plan');
  }
  const changedPosts = after.blog_posts.filter((post, index) =>
    post.related_category_slug !== before.blog_posts[index].related_category_slug ||
    post.cta_href !== before.blog_posts[index].cta_href
  );
  // Detect legacy query links outside the two reviewed blog link fields.
  for (const post of before.blog_posts) {
    const { related_category_slug: _related, cta_href: _href, ...otherFields } = post;
    if (/category=(?:fin|mask|wetsuits|accessories)(?:[&#"\s]|$)/.test(JSON.stringify(otherFields))) {
      throw new Error(`Additional blog category link needs review: ${post.slug}`);
    }
  }
  const movedProducts = before.products.filter((product) =>
    MERGES.some((merge) => merge.sourceId === product.category_id)
  ).length;
  console.log(JSON.stringify({
    mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
    movedProducts,
    changedPosts: changedPosts.map((post) => ({ slug: post.slug, related_category_slug: post.related_category_slug, cta_href: post.cta_href })),
    before: summarize(before),
    projected: summarize(after),
  }, null, 2));
  if (!process.argv.includes('--apply')) return;

  const directoryIndex = process.argv.indexOf('--snapshot-dir');
  if (directoryIndex < 0 || !process.argv[directoryIndex + 1]) throw new Error('--snapshot-dir is required for apply');
  const directory = resolve(process.argv[directoryIndex + 1]);
  if (!(await stat(directory)).isDirectory()) throw new Error('Snapshot directory must already exist');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const beforePath = resolve(directory, `arnesh-category-consolidation-${timestamp}-before.json`);
  await writeFile(beforePath, JSON.stringify({ capturedAt: new Date().toISOString(), snapshot: before }, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(`Snapshot: ${beforePath}`);

  const blogTrigger = before.triggers.find((trigger) => trigger.table === 'blog_posts' && trigger.name === 'blog_posts_updated_at');
  if (blogTrigger && blogTrigger.enabled !== 'O') throw new Error('Unexpected blog updated_at trigger state');
  // All statements run in one HTTP transaction. Locks exclude concurrent
  // writes; guards compare the freshly snapshotted full rows both before and
  // after. Any stale snapshot, extra trigger effect, or invariant failure
  // aborts the entire transaction. No hard-coded product count is imposed.
  const statements = [
    sql`set local lock_timeout = '5s'`,
    sql`set local statement_timeout = '30s'`,
    sql`lock table categories, products, product_variants, blog_posts in share row exclusive mode`,
    sql`select 1 / ((${sql.unsafe(STATE_SQL)}) = ${JSON.stringify(before)}::jsonb)::int as before_guard`,
  ];
  for (const merge of MERGES) {
    statements.push(sql`update products set category_id = ${merge.targetId} where category_id = ${merge.sourceId}`);
    if (merge.source === 'fin') {
      const target = after.categories.find((category) => category.id === merge.targetId);
      statements.push(sql`update categories set description = ${target.description} where id = ${merge.targetId} and nullif(btrim(description), '') is null`);
    }
    if (merge.target === 'masker') statements.push(sql`update categories set name = ${'Masker'} where id = ${merge.targetId}`);
    statements.push(sql`delete from categories where id = ${merge.sourceId} and slug = ${merge.source}`);
  }
  // Restore the trigger inside the same transaction, preserving updated_at
  // while still requiring every other blog column to remain exactly equal.
  if (changedPosts.length && blogTrigger) statements.push(sql`alter table blog_posts disable trigger blog_posts_updated_at`);
  for (const post of changedPosts) {
    statements.push(sql`update blog_posts set related_category_slug = ${post.related_category_slug}, cta_href = ${post.cta_href} where id = ${post.id}`);
  }
  if (changedPosts.length && blogTrigger) statements.push(sql`alter table blog_posts enable trigger blog_posts_updated_at`);
  statements.push(
    sql`select 1 / ((${sql.unsafe(STATE_SQL)}) = ${JSON.stringify(after)}::jsonb)::int as after_guard`,
    sql`select 1 / (not exists (select 1 from products p left join categories c on c.id = p.category_id where c.id is null))::int as foreign_key_guard`,
    sql`select ${sql.unsafe(STATE_SQL)} as snapshot`,
  );
  const results = await sql.transaction(statements, { isolationLevel: 'Serializable' });
  const committed = results[results.length - 1][0].snapshot;
  const afterPath = beforePath.replace('-before.json', '-after.json');
  await writeFile(afterPath, JSON.stringify({ committedAt: new Date().toISOString(), snapshot: committed }, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({
    committed: true,
    movedProducts,
    deletedCategories: MERGES.map((merge) => merge.source),
    products: committed.products.length,
    variants: committed.product_variants.length,
    categories: summarize(committed),
    beforePath,
    afterPath,
    verified: 'Exact full-row equality: only approved category IDs, category fields, and blog link fields changed; all variants and trigger definitions/states preserved; no orphan products.',
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    // Do not log query parameters or database credentials on failure.
    console.error(`Category consolidation failed: ${error.message}`);
    process.exitCode = 1;
  });
}

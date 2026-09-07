import 'dotenv/config';
import { db, products } from '@/lib/db';
import { getStorageProvider } from '@/lib/storage';
import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

/**
 * Read-only inventory of every product image, ahead of the R2 migration.
 *
 * WRITES NOTHING. It issues HTTP HEAD against Vercel Blob, calls the storage
 * interface's read-only head() against R2, and SELECTs from the database. There
 * is no flag that makes it write — that is the point: we want real numbers
 * before designing a step that touches ~780 irreplaceable images.
 *
 * Usage:
 *   STORAGE_PROVIDER=r2 tsx lib/scripts/inventory-images.ts [--limit N] [--out path]
 */

const BLOB_HOST = 'duruwpeexnyc4tce.public.blob.vercel-storage.com';

/** Legacy files are big enough to be worth re-encoding above this size. */
const REENCODE_THRESHOLD_BYTES = 150 * 1024;

type ImageClass = 'pipeline' | 'legacy' | 'local' | 'unknown';

interface HeadInfo {
  status: number;
  contentLength: number | null;
  etag: string | null;
  error?: string;
}

interface Entry {
  url: string;
  class: ImageClass;
  refCount: number;
  /** Storage key, i.e. the URL minus scheme+host. Absent for local paths. */
  path?: string;
  blob?: HeadInfo;
  /** Pipeline mains only: the -800 / -400 siblings. */
  variants?: { path: string; blob: HeadInfo }[];
  r2?: 'present' | 'absent' | 'error';
  r2Error?: string;
}

/**
 * `products.images` stores absolute URLs. Classification keys off the path, so
 * strip the origin first and treat anything that is not on the Blob host as
 * unknown — an off-host URL is something a human needs to look at, not
 * something to migrate silently.
 */
function pathOf(url: string): string | null {
  if (url.startsWith('/')) return null;
  try {
    const u = new URL(url);
    return u.host === BLOB_HOST ? u.pathname.replace(/^\/+/, '') : null;
  } catch {
    return null;
  }
}

const VARIANT_SUFFIX = /-(?:400|800|original)\.(?:webp|jpg|jpeg|png)$/i;

function classify(url: string, path: string | null): ImageClass {
  if (url.startsWith('/')) return 'local';
  if (!path) return 'unknown';
  // A v2 main is the URL stored on the product; its siblings are derived, so a
  // stored URL that already carries a variant suffix is unexpected.
  if (path.startsWith('products/v2/')) {
    return path.endsWith('.webp') && !VARIANT_SUFFIX.test(path) ? 'pipeline' : 'unknown';
  }
  // Legacy: products/<name>.<ext>, one path segment deep, any image extension.
  if (/^products\/[^/]+\.(?:webp|jpg|jpeg|png|gif|avif)$/i.test(path)) return 'legacy';
  return 'unknown';
}

async function headBlob(path: string): Promise<HeadInfo> {
  try {
    const res = await fetch(`https://${BLOB_HOST}/${path}`, { method: 'HEAD' });
    const len = res.headers.get('content-length');
    return {
      status: res.status,
      contentLength: len === null ? null : Number.parseInt(len, 10),
      etag: res.headers.get('etag'),
    };
  } catch (error) {
    return {
      status: 0,
      contentLength: null,
      etag: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Bounded parallelism over a task list. Workers pull from a shared cursor, so
 * every task is awaited — the earlier version spliced the wrong promise out of
 * its in-flight list and returned before the work finished, which silently
 * truncated the manifest to 718 of 969 entries and made every summary number
 * wrong. Prefer a shape that cannot report partial results as complete.
 */
async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let cursor = 0;
  let done = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await fn(items[index]!);
      done++;
      if (done % 100 === 0) console.log(`   ...${done}/${items.length}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

function stats(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, n) => acc + n, 0);
  return {
    count: sorted.length,
    total: sum,
    min: sorted[0]!,
    median: sorted[Math.floor(sorted.length / 2)]!,
    mean: Math.round(sum / sorted.length),
    max: sorted[sorted.length - 1]!,
  };
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.indexOf('--limit');
  const outArg = args.indexOf('--out');
  const limit = limitArg >= 0 ? Number.parseInt(args[limitArg + 1]!, 10) : null;
  const outPath = outArg >= 0 ? args[outArg + 1]! : '.work/inventory-manifest.jsonl';

  console.log('\nINVENTARIS GAMBAR PRODUK (baca saja, tidak menulis apa pun)');
  console.log('='.repeat(64));

  // --- 1. Database ---------------------------------------------------------
  // No WHERE clause: soft-deleted products still reference stored objects, and
  // those objects are equally irreplaceable.
  const rows = await db.select().from(products);
  const withImages = rows.filter((r) => (r.images ?? []).length > 0);

  const refCounts = new Map<string, number>();
  for (const row of rows) {
    for (const url of row.images ?? []) {
      refCounts.set(url, (refCounts.get(url) ?? 0) + 1);
    }
  }

  let entries: Entry[] = [...refCounts.entries()].map(([url, refCount]) => {
    const path = pathOf(url);
    return { url, refCount, path: path ?? undefined, class: classify(url, path) };
  });

  const totalDistinct = entries.length;
  if (limit !== null) entries = entries.slice(0, limit);

  console.log(`\nProduk                 : ${rows.length}`);
  console.log(`  dengan gambar        : ${withImages.length}`);
  console.log(`  tanpa gambar         : ${rows.length - withImages.length}`);
  console.log(`URL unik               : ${totalDistinct}${limit !== null ? ` (memeriksa ${entries.length})` : ''}`);

  const byClass = (c: ImageClass) => entries.filter((e) => e.class === c);
  console.log('\nKlasifikasi:');
  for (const c of ['pipeline', 'legacy', 'local', 'unknown'] as ImageClass[]) {
    const group = byClass(c);
    const refs = group.reduce((n, e) => n + e.refCount, 0);
    console.log(`  ${c.padEnd(9)} ${String(group.length).padStart(4)} URL, ${refs} referensi`);
  }

  // --- 2. Vercel Blob ------------------------------------------------------
  const remote = entries.filter((e) => e.path);
  console.log(`\nMemeriksa ${remote.length} objek di Vercel Blob...`);
  await mapLimit(remote, 6, async (entry) => {
    entry.blob = await headBlob(entry.path!);
    if (entry.class === 'pipeline') {
      entry.variants = [];
      for (const suffix of ['-800', '-400']) {
        const path = entry.path!.replace(/\.webp$/, `${suffix}.webp`);
        entry.variants.push({ path, blob: await headBlob(path) });
      }
    }
  });

  // --- 3. Cloudflare R2 ----------------------------------------------------
  const storage = await getStorageProvider();
  console.log(`\nMemeriksa ${remote.length} objek di Cloudflare R2...`);
  await mapLimit(remote, 6, async (entry) => {
    try {
      entry.r2 = (await storage.head(entry.path!)) ? 'present' : 'absent';
    } catch (error) {
      // An error is NOT absence. Reporting it as absent would make a throttled
      // or misconfigured store look like "nothing has been migrated yet".
      entry.r2 = 'error';
      entry.r2Error = error instanceof Error ? error.message : String(error);
    }
  });

  // --- 4. Manifest ---------------------------------------------------------
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, entries.map((e) => JSON.stringify(e)).join('\n') + '\n');

  // --- 5. Summary ----------------------------------------------------------
  const sizesOf = (c: ImageClass) =>
    byClass(c).map((e) => e.blob?.contentLength).filter((n): n is number => typeof n === 'number');

  console.log('\nUKURAN');
  console.log('-'.repeat(64));
  for (const c of ['pipeline', 'legacy', 'unknown'] as ImageClass[]) {
    const s = stats(sizesOf(c));
    if (!s) continue;
    console.log(
      `  ${c.padEnd(9)} ${String(s.count).padStart(4)} file, total ${mb(s.total).padStart(9)}` +
        ` | min ${kb(s.min)} · median ${kb(s.median)} · mean ${kb(s.mean)} · max ${kb(s.max)}`,
    );
  }

  const variantSizes = byClass('pipeline').flatMap((e) =>
    (e.variants ?? []).map((v) => v.blob.contentLength).filter((n): n is number => typeof n === 'number'),
  );
  const variantStats = stats(variantSizes);
  if (variantStats) {
    console.log(`  ${'varian'.padEnd(9)} ${String(variantStats.count).padStart(4)} file, total ${mb(variantStats.total).padStart(9)} (sibling -800/-400)`);
  }

  const legacyBig = byClass('legacy').filter(
    (e) => (e.blob?.contentLength ?? 0) > REENCODE_THRESHOLD_BYTES,
  );

  console.log('\nRENCANA PENYALINAN');
  console.log('-'.repeat(64));
  const pipelineObjects = byClass('pipeline').length * 3;
  console.log(`  Salin apa adanya (pipeline + varian) : ${pipelineObjects} objek`);
  console.log(`  Legacy, salin apa adanya             : ${byClass('legacy').length} objek`);
  console.log(`  Legacy > 150KB, perlu dibuat varian  : ${legacyBig.length} file -> ${legacyBig.length * 2} objek baru`);
  console.log(`  ------------------------------------`);
  console.log(`  Perkiraan total objek di R2          : ${pipelineObjects + byClass('legacy').length + legacyBig.length * 2}`);

  const totalBytes = [...sizesOf('legacy'), ...sizesOf('pipeline'), ...variantSizes].reduce((a, b) => a + b, 0);
  console.log(`  Total byte yang harus diunduh        : ${mb(totalBytes)}`);

  // --- 6. Problems ---------------------------------------------------------
  const problems: string[] = [];
  for (const e of entries) {
    if (e.class === 'unknown') problems.push(`URL tak dikenali: ${e.url}`);
    if (e.blob && e.blob.status !== 200) {
      problems.push(`Blob HTTP ${e.blob.status}${e.blob.error ? ` (${e.blob.error})` : ''}: ${e.url}`);
    }
    for (const v of e.variants ?? []) {
      if (v.blob.status !== 200) problems.push(`Varian hilang (HTTP ${v.blob.status}): ${v.path}`);
    }
    if (e.r2 === 'error') problems.push(`R2 error: ${e.url} — ${e.r2Error}`);
  }

  console.log('\nMASALAH');
  console.log('-'.repeat(64));
  if (problems.length === 0) {
    console.log('  Tidak ada. Semua objek yang direferensikan ada dan terbaca.');
  } else {
    const shown = problems.slice(0, 40);
    for (const p of shown) console.log(`  • ${p}`);
    if (problems.length > shown.length) {
      console.log(`  ... dan ${problems.length - shown.length} lagi (lihat manifest)`);
    }
  }

  const r2Present = entries.filter((e) => e.r2 === 'present').length;
  console.log(`\nSudah ada di R2        : ${r2Present} / ${remote.length}`);
  console.log(`Manifest               : ${outPath}`);
  console.log();
}

main().catch((error) => {
  console.error('GAGAL:', error);
  process.exit(1);
});

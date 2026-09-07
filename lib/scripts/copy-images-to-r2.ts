import 'dotenv/config';
import { createHash } from 'crypto';
import { appendFile, mkdir, readFile } from 'fs/promises';
import { dirname } from 'path';
import { db, products } from '@/lib/db';
import { getStorageProvider } from '@/lib/storage';

/**
 * Copy every product image from Vercel Blob to Cloudflare R2, byte for byte.
 *
 * ## What this does NOT do
 *
 * It does not write to Vercel Blob. It does not delete anything, anywhere. It
 * does not touch the database. It does not re-encode, resize, rename or
 * otherwise transform a single byte. Vercel Blob remains a complete, untouched
 * archive after this runs, forever — the catalogue cannot be re-uploaded, so
 * the original store is the last line of defence and is never cleaned up.
 *
 * ## Why byte-for-byte, and why paths are preserved
 *
 * Copying without transformation is the only form of migration that can be
 * *proven* correct: the MD5 of the bytes downloaded must equal the ETag R2
 * reports for the object it stored. Anything re-encoded has a different MD5 by
 * definition, which would leave "did this arrive intact?" a matter of opinion.
 * Generating the -800/-400 variants for large legacy files is therefore a
 * separate, later, purely additive step — if it never runs, the site behaves
 * exactly as it does today.
 *
 * Keeping the path identical (`products/x.jpg` → `products/x.jpg`) means the
 * eventual cutover is a hostname swap and nothing else: no database writes, no
 * per-object lookup at render time, and a rollback that is one flag.
 *
 * ## Safety properties
 *
 * - Dry-run by default. Writing requires an explicit `--execute`.
 * - Every write passes `IfNoneMatch: '*'` (inside the R2 provider), so an
 *   object that somehow already exists is never clobbered — R2 overwrites
 *   silently otherwise, unlike Vercel Blob.
 * - Every object is verified by MD5 after writing. A mismatch is recorded as a
 *   failure; it is never counted as done.
 * - Resumable and safe to re-run: the state file records what has been verified,
 *   and R2 is asked directly for anything not in it.
 * - Circuit breaker: consecutive read failures from Blob abort the run rather
 *   than hammering a store that is refusing — the exact failure that started
 *   this whole project.
 *
 * Usage:
 *   STORAGE_PROVIDER=r2 tsx lib/scripts/copy-images-to-r2.ts [--execute] [--limit N]
 */

const BLOB_HOST = 'duruwpeexnyc4tce.public.blob.vercel-storage.com';
const STATE_FILE = '.work/r2-copy-state.jsonl';
const CONCURRENCY = 4;
const CONSECUTIVE_FAILURE_LIMIT = 3;
const CACHE_MAX_AGE_SECONDS = 31536000;

interface StateRecord {
  path: string;
  md5: string;
  size: number;
  at: string;
}

interface Job {
  path: string;
  kind: 'legacy' | 'pipeline-main' | 'pipeline-variant';
}

/** Objects referenced by products, plus the derived siblings of pipeline mains. */
async function enumerateJobs(): Promise<Job[]> {
  const rows = await db.select().from(products);

  const paths = new Map<string, Job['kind']>();
  for (const row of rows) {
    for (const url of row.images ?? []) {
      if (url.startsWith('/')) continue; // local /public asset, not in Blob
      let path: string;
      try {
        const parsed = new URL(url);
        if (parsed.host !== BLOB_HOST) continue;
        path = parsed.pathname.replace(/^\/+/, '');
      } catch {
        continue;
      }

      if (path.startsWith('products/v2/') && path.endsWith('.webp')) {
        paths.set(path, 'pipeline-main');
        // The stored URL is the main; -800/-400 are derived at render time and
        // are separate objects that must travel with it.
        for (const suffix of ['-800', '-400']) {
          paths.set(path.replace(/\.webp$/, `${suffix}.webp`), 'pipeline-variant');
        }
      } else {
        paths.set(path, 'legacy');
      }
    }
  }

  return [...paths.entries()].map(([path, kind]) => ({ path, kind }));
}

async function loadState(): Promise<Map<string, StateRecord>> {
  const state = new Map<string, StateRecord>();
  try {
    const raw = await readFile(STATE_FILE, 'utf8');
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      const record = JSON.parse(line) as StateRecord;
      state.set(record.path, record);
    }
  } catch {
    // No state file yet — first run.
  }
  return state;
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const limitArg = args.indexOf('--limit');
  const limit = limitArg >= 0 ? Number.parseInt(args[limitArg + 1]!, 10) : null;

  console.log('\nSALIN GAMBAR: Vercel Blob -> Cloudflare R2');
  console.log('='.repeat(64));
  console.log(execute ? 'MODE: MENULIS ke R2' : 'MODE: UJI COBA (tidak menulis apa pun)');
  console.log('Vercel Blob hanya dibaca. Tidak ada yang dihapus atau ditimpa.');

  const allJobs = await enumerateJobs();
  const state = await loadState();

  let jobs = allJobs.filter((job) => !state.has(job.path));
  const alreadyDone = allJobs.length - jobs.length;
  if (limit !== null) jobs = jobs.slice(0, limit);

  console.log(`\nObjek total            : ${allJobs.length}`);
  console.log(`  sudah terverifikasi  : ${alreadyDone}`);
  console.log(`  akan dikerjakan      : ${jobs.length}`);

  if (jobs.length === 0) {
    console.log('\nTidak ada yang perlu disalin.\n');
    return;
  }

  const storage = await getStorageProvider();
  await mkdir(dirname(STATE_FILE), { recursive: true });

  let copied = 0;
  let skipped = 0;
  let bytes = 0;
  const failures: { path: string; reason: string }[] = [];

  // Counts *consecutive* read failures across workers. A store that starts
  // refusing does so for everything, so this trips fast; an isolated bad object
  // resets it and the run continues.
  let consecutiveFailures = 0;
  let aborted = false;

  let cursor = 0;
  const worker = async () => {
    while (cursor < jobs.length && !aborted) {
      const job = jobs[cursor++]!;

      try {
        // Already in R2 from an interrupted run whose state was not written?
        // Trust the store over the state file.
        const existing = await storage.head(job.path);
        if (existing) {
          skipped++;
          await appendFile(
            STATE_FILE,
            JSON.stringify({
              path: job.path,
              md5: existing.etag,
              size: existing.size,
              at: new Date().toISOString(),
            } satisfies StateRecord) + '\n',
          );
          continue;
        }

        const response = await fetch(`https://${BLOB_HOST}/${job.path}`);
        if (!response.ok) {
          consecutiveFailures++;
          failures.push({ path: job.path, reason: `Blob HTTP ${response.status}` });
          if (consecutiveFailures >= CONSECUTIVE_FAILURE_LIMIT) {
            aborted = true;
            console.error(
              `\nDIHENTIKAN: ${CONSECUTIVE_FAILURE_LIMIT} kegagalan baca beruntun dari Vercel Blob.`,
            );
          }
          continue;
        }
        consecutiveFailures = 0;

        const body = new Uint8Array(await response.arrayBuffer());
        const expectedMd5 = createHash('md5').update(body).digest('hex');
        const contentType = response.headers.get('content-type') ?? 'application/octet-stream';

        if (!execute) {
          copied++;
          bytes += body.byteLength;
          continue;
        }

        // The provider passes IfNoneMatch: '*', so this throws rather than
        // overwriting if the key exists.
        const result = await storage.put({
          path: job.path,
          body,
          contentType,
          cacheControlMaxAge: CACHE_MAX_AGE_SECONDS,
        });

        // R2 returns the MD5 as the ETag for a non-multipart PutObject. If this
        // does not match, the bytes that landed are not the bytes we read.
        if (result.etag.toLowerCase() !== expectedMd5.toLowerCase()) {
          failures.push({
            path: job.path,
            reason: `MD5 tidak cocok: harap ${expectedMd5}, dapat ${result.etag}`,
          });
          continue;
        }

        await appendFile(
          STATE_FILE,
          JSON.stringify({
            path: job.path,
            md5: expectedMd5,
            size: body.byteLength,
            at: new Date().toISOString(),
          } satisfies StateRecord) + '\n',
        );

        copied++;
        bytes += body.byteLength;
        if (copied % 50 === 0) {
          console.log(`   ...${copied}/${jobs.length} (${mb(bytes)})`);
        }
      } catch (error) {
        failures.push({
          path: job.path,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));

  console.log('\nHASIL');
  console.log('-'.repeat(64));
  console.log(`  ${execute ? 'Disalin' : 'Siap disalin'}      : ${copied} objek, ${mb(bytes)}`);
  if (skipped) console.log(`  Sudah ada di R2      : ${skipped}`);
  console.log(`  Gagal                : ${failures.length}`);

  if (failures.length > 0) {
    console.log('\nKEGAGALAN');
    console.log('-'.repeat(64));
    for (const failure of failures.slice(0, 40)) {
      console.log(`  • ${failure.path} — ${failure.reason}`);
    }
    if (failures.length > 40) console.log(`  ... dan ${failures.length - 40} lagi`);
  }

  if (!execute) {
    console.log('\nIni uji coba. Tidak ada yang ditulis.');
    console.log('Jalankan lagi dengan --execute untuk benar-benar menyalin.\n');
  } else {
    console.log(`\nStatus tersimpan di ${STATE_FILE} — aman dijalankan ulang.\n`);
  }

  if (aborted || failures.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error('GAGAL:', error);
  process.exit(1);
});

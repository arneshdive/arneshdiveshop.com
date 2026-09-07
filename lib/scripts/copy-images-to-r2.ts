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
 * ## The verification chain
 *
 * Measured on 2026-09-07: all 1,127 objects report a plain quoted MD5 as their
 * Vercel Blob `etag`, and R2 returns the same plain MD5 as the `ETag` of a
 * non-multipart `PutObject` (this SDK's `PutObjectCommand` is always a single
 * PUT — `@aws-sdk/lib-storage`, the only thing that would split an upload into
 * parts, is not installed and must not be). So the chain is closed end to end
 * and every link is checked:
 *
 *     Blob's stored MD5  ==  MD5 of the bytes we downloaded  ==  R2's ETag
 *
 * The first equality is the one the original version of this script was
 * missing. Without it, MD5 verification only proves "R2 stored what we sent",
 * not "what we sent is what Blob holds" — a truncated or error-page response
 * would have been copied and then confidently declared verified. Since this
 * interface has neither delete nor overwrite, such an object could never
 * afterwards be corrected.
 *
 * ## Safety properties
 *
 * - Dry-run by default. Writing requires an explicit `--execute`.
 * - Refuses to run unless STORAGE_PROVIDER=r2. Without that check the script
 *   silently talks to Vercel Blob, finds every object "already present", and
 *   writes a state file claiming a migration that never happened.
 * - Every write passes `IfNoneMatch: '*'` (inside the R2 provider), so an
 *   object that somehow already exists is never clobbered — R2 overwrites
 *   silently otherwise, unlike Vercel Blob.
 * - Nothing is recorded as done without a verified MD5, including on the
 *   already-present path, which re-checks R2 against Blob rather than trusting
 *   whatever happens to be sitting at the key.
 * - Resumable and safe to re-run: the state file records what has been
 *   verified, and R2 is asked directly for anything not in it.
 * - Circuit breaker: consecutive *throttle-shaped* read failures abort the run
 *   rather than hammering a store that is refusing — the exact failure that
 *   started this whole project. A 404 is a missing file, not a refusal, and
 *   deliberately does not trip it.
 * - `--verify` re-reads every recorded object from R2 and re-checks it against
 *   Blob, transferring no bytes. This is the gate for the cutover flag: trust
 *   its output, not the mere existence of a state file.
 *
 * Usage:
 *   STORAGE_PROVIDER=r2 tsx lib/scripts/copy-images-to-r2.ts [--execute] [--limit N]
 *   STORAGE_PROVIDER=r2 tsx lib/scripts/copy-images-to-r2.ts --verify
 */

const BLOB_HOST = 'duruwpeexnyc4tce.public.blob.vercel-storage.com';
const STATE_FILE = '.work/r2-copy-state.jsonl';
const CONCURRENCY = 4;
const CONSECUTIVE_FAILURE_LIMIT = 3;
const CACHE_MAX_AGE_SECONDS = 31536000;

/** How many already-verified objects to re-check before doing any work. */
const ANCHOR_SAMPLE = 3;

const MD5_HEX = /^[0-9a-f]{32}$/;

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

/** A failure that counts towards the circuit breaker, versus one that does not. */
type FailureClass = 'throttle' | 'object';

interface Failure {
  path: string;
  reason: string;
  class: FailureClass;
}

/** Metadata from a Blob HEAD — no bytes transferred. */
interface BlobHead {
  status: number;
  etag: string | null;
  size: number | null;
  contentType: string | null;
}

/**
 * Both stores quote their etags (`"d41d8..."`). Normalising to bare lowercase
 * hex is what makes the three-way comparison in the doc comment above a plain
 * string equality instead of a place for a casing or quoting bug to hide.
 */
function normaliseEtag(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.replace(/^"(.*)"$/, '$1').toLowerCase();
  return MD5_HEX.test(value) ? value : null;
}

/**
 * A store that is refusing, versus a file that is not there.
 *
 * The incident this work exists to fix produced `403` for *everything*,
 * including deliberately nonexistent paths. A `404` is the opposite signal: the
 * store answered normally and the object is genuinely absent. Counting 404s
 * towards the breaker would abort a healthy run over two adjacent products with
 * missing variants, and report it as "Vercel Blob is refusing" — which would
 * send the operator looking in the wrong place entirely.
 */
function isThrottleStatus(status: number): boolean {
  return status === 403 || status === 429 || status >= 500;
}

/** Objects referenced by products, plus the derived siblings of pipeline mains. */
async function enumerateJobs(): Promise<Job[]> {
  // No WHERE clause: soft-deleted products still reference stored objects, and
  // those objects are equally irreplaceable.
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

      // `pathname` is percent-encoded, but the storage key is not, so a path
      // needing encoding would be copied to a key that does not match the one
      // it is served from. Measured 2026-09-07: 0 of 967 paths contain a
      // character outside this set. Refuse rather than quietly create a key
      // that cannot be corrected afterwards.
      if (!/^[A-Za-z0-9._/-]+$/.test(path)) {
        throw new Error(`Path gambar mengandung karakter tak aman: ${url}`);
      }

      // A stored URL is always the main. `hasVariants()` in
      // lib/utils/product-image.ts and `classify()` in inventory-images.ts both
      // exclude a variant suffix here, so this must too — otherwise a stored
      // `-800.webp` would spawn `-800-800.webp` jobs that can only ever 404.
      if (
        path.startsWith('products/v2/') &&
        path.endsWith('.webp') &&
        !/-(?:400|800|original)\.webp$/.test(path)
      ) {
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

/**
 * Read the state file.
 *
 * A missing file means "first run". A malformed file does NOT: the original
 * version wrapped the whole parse loop in one `catch {}`, so a single truncated
 * line silently discarded every verified record and reported a fresh start.
 */
async function loadState(): Promise<Map<string, StateRecord>> {
  const state = new Map<string, StateRecord>();

  let raw: string;
  try {
    raw = await readFile(STATE_FILE, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return state;
    throw error;
  }

  const lines = raw.split('\n');
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    let record: StateRecord;
    try {
      record = JSON.parse(line) as StateRecord;
    } catch {
      throw new Error(`${STATE_FILE} baris ${index + 1} rusak. Perbaiki dulu, jangan dihapus.`);
    }
    if (!record.path || normaliseEtag(record.md5) === null) {
      // A quoted etag here is the fingerprint of a run that went to Vercel Blob
      // instead of R2 (the Blob SDK does not strip quotes; the R2 provider
      // does), i.e. a state file that records a migration that never happened.
      throw new Error(
        `${STATE_FILE} baris ${index + 1} tidak punya MD5 yang sah: ${JSON.stringify(record.md5)}`,
      );
    }
    state.set(record.path, record);
  }
  return state;
}

async function headBlob(path: string): Promise<BlobHead> {
  const res = await fetch(`https://${BLOB_HOST}/${path}`, { method: 'HEAD' });
  const length = res.headers.get('content-length');
  return {
    status: res.status,
    etag: normaliseEtag(res.headers.get('etag')),
    size: length === null ? null : Number.parseInt(length, 10),
    contentType: res.headers.get('content-type'),
  };
}

/**
 * An object stored under the wrong content type renders as a download rather
 * than an image, and this interface has no way to correct it afterwards. So a
 * missing or non-image type fails the object instead of being papered over with
 * `application/octet-stream`.
 */
function contentTypeProblem(contentType: string | null): string | null {
  if (!contentType) return 'Blob tidak mengirim content-type';
  if (!/^image\//i.test(contentType.split(';')[0]!.trim())) {
    return `content-type bukan gambar: ${contentType}`;
  }
  return null;
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Bounded parallelism over a task list, with every task awaited. */
async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      await fn(items[cursor++]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

/**
 * Re-read recorded objects from R2 and re-check them against Blob. Transfers no
 * bytes: both sides are asked for metadata only, and both report the same MD5.
 */
async function verifyRecords(
  storage: Awaited<ReturnType<typeof getStorageProvider>>,
  records: StateRecord[],
): Promise<string[]> {
  const problems: string[] = [];
  await mapLimit(records, CONCURRENCY, async (record) => {
    try {
      const inR2 = await storage.head(record.path);
      if (!inR2) {
        problems.push(`Tidak ada di R2: ${record.path}`);
        return;
      }
      const r2Etag = normaliseEtag(inR2.etag);
      if (r2Etag !== record.md5 || inR2.size !== record.size) {
        problems.push(
          `R2 tidak cocok dengan catatan: ${record.path} (R2 ${r2Etag}/${inR2.size}, catatan ${record.md5}/${record.size})`,
        );
        return;
      }
      const source = await headBlob(record.path);
      if (source.status !== 200) {
        problems.push(`Blob HTTP ${source.status}: ${record.path}`);
        return;
      }
      if (source.etag !== record.md5 || source.size !== record.size) {
        problems.push(
          `R2 tidak cocok dengan Blob: ${record.path} (Blob ${source.etag}/${source.size}, R2 ${r2Etag}/${inR2.size})`,
        );
      }
    } catch (error) {
      problems.push(
        `Gagal memeriksa ${record.path}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });
  return problems;
}

function parseArgs(argv: string[]) {
  const known = new Set(['--execute', '--limit', '--verify']);
  let execute = false;
  let verify = false;
  let limit: number | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (!known.has(arg)) throw new Error(`Argumen tidak dikenal: ${arg}`);
    if (arg === '--execute') execute = true;
    else if (arg === '--verify') verify = true;
    else {
      // `--limit` with a missing or non-numeric value used to become NaN, and
      // `slice(0, NaN)` is empty — so the run printed "nothing to copy" and
      // exited 0 having done nothing. Silence is the wrong answer here.
      const raw = argv[++i];
      const value = raw === undefined ? Number.NaN : Number(raw);
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`--limit butuh bilangan bulat positif, dapat: ${raw ?? '(kosong)'}`);
      }
      limit = value;
    }
  }

  return { execute, verify, limit };
}

async function main() {
  const { execute, verify, limit } = parseArgs(process.argv.slice(2));

  // Without this the script runs happily against Vercel Blob: `head()` reports
  // every object as already present, the skip path records all 1,127 as done,
  // and it exits 0 with a clean summary and an empty R2 bucket. The cutover
  // gate is "the state file shows everything verified", so that state file
  // would authorise pointing production at nothing at all.
  if (process.env.STORAGE_PROVIDER !== 'r2') {
    throw new Error(
      "Jalankan dengan STORAGE_PROVIDER=r2. Tanpa itu skrip ini bicara ke Vercel Blob, bukan R2.",
    );
  }

  const storage = await getStorageProvider();
  const state = await loadState();

  console.log('\nSALIN GAMBAR: Vercel Blob -> Cloudflare R2');
  console.log('='.repeat(64));

  if (verify) {
    const records = [...state.values()];
    console.log(`MODE: PERIKSA ULANG ${records.length} objek yang tercatat (tidak menulis apa pun)`);
    if (records.length === 0) {
      console.log('\nBelum ada catatan untuk diperiksa.\n');
      return;
    }
    const problems = await verifyRecords(storage, records);
    console.log('\nHASIL');
    console.log('-'.repeat(64));
    console.log(`  Diperiksa            : ${records.length}`);
    console.log(`  Bermasalah           : ${problems.length}`);
    for (const problem of problems.slice(0, 40)) console.log(`  • ${problem}`);
    if (problems.length > 40) console.log(`  ... dan ${problems.length - 40} lagi`);
    console.log(
      problems.length === 0
        ? '\nSemua objek tercatat cocok byte-per-byte dengan Vercel Blob.\n'
        : '\nJANGAN pindahkan trafik ke R2 sampai daftar di atas kosong.\n',
    );
    if (problems.length > 0) process.exit(1);
    return;
  }

  console.log(execute ? 'MODE: MENULIS ke R2' : 'MODE: UJI COBA (tidak menulis apa pun)');
  console.log('Vercel Blob hanya dibaca. Tidak ada yang dihapus atau ditimpa.');

  const allJobs = await enumerateJobs();

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

  // A wrong bucket name, endpoint or account cannot be told from an empty one:
  // R2 answers HeadObject against a nonexistent bucket with a bodyless 404 that
  // the SDK models as `NotFound`, exactly like a missing key (measured
  // 2026-09-07). Re-reading objects we know we wrote is the check that catches
  // it, so do it before spending a single operation on new work.
  const anchors = [...state.values()].slice(0, ANCHOR_SAMPLE);
  if (anchors.length > 0) {
    const problems = await verifyRecords(storage, anchors);
    if (problems.length > 0) {
      console.error(`\nDIHENTIKAN: ${anchors.length} objek acuan tidak cocok. Periksa konfigurasi R2.`);
      for (const problem of problems) console.error(`  • ${problem}`);
      process.exit(1);
    }
    console.log(`  acuan diperiksa      : ${anchors.length} objek cocok`);
  } else {
    console.log('  acuan diperiksa      : belum ada catatan, lewati');
  }

  await mkdir(dirname(STATE_FILE), { recursive: true });

  let copied = 0;
  let skipped = 0;
  let bytes = 0;
  const failures: Failure[] = [];

  // Counts *consecutive* throttle-shaped read failures across workers. A store
  // that starts refusing does so for everything, so this trips fast; an
  // isolated missing object is not a refusal and does not touch it.
  let consecutiveFailures = 0;
  let aborted = false;

  const fail = (path: string, reason: string, kind: FailureClass) => {
    failures.push({ path, reason, class: kind });
    if (kind !== 'throttle') return;
    consecutiveFailures++;
    if (consecutiveFailures >= CONSECUTIVE_FAILURE_LIMIT && !aborted) {
      aborted = true;
      console.error(
        `\nDIHENTIKAN: ${CONSECUTIVE_FAILURE_LIMIT} kegagalan baca beruntun (penyimpanan menolak).`,
      );
    }
  };

  const record = async (path: string, md5: string, size: number) => {
    await appendFile(
      STATE_FILE,
      JSON.stringify({ path, md5, size, at: new Date().toISOString() } satisfies StateRecord) + '\n',
    );
  };

  let cursor = 0;
  const worker = async () => {
    while (cursor < jobs.length && !aborted) {
      const job = jobs[cursor++]!;

      try {
        // Already in R2 from an interrupted run whose state was not written?
        // Check it, do not trust it. An object left behind by a run whose MD5
        // verification failed is still sitting at this key — this interface has
        // no delete — and recording `existing.etag` unexamined would launder
        // exactly that object into "verified".
        const existing = await storage.head(job.path);
        if (existing) {
          const source = await headBlob(job.path);
          if (source.status !== 200) {
            fail(
              job.path,
              `sudah ada di R2 tapi Blob menjawab HTTP ${source.status}`,
              isThrottleStatus(source.status) ? 'throttle' : 'object',
            );
            continue;
          }
          consecutiveFailures = 0;

          const r2Etag = normaliseEtag(existing.etag);
          if (!source.etag || r2Etag !== source.etag || existing.size !== source.size) {
            fail(
              job.path,
              `objek di R2 berbeda dari Blob (R2 ${r2Etag}/${existing.size}, Blob ${source.etag}/${source.size})`,
              'object',
            );
            continue;
          }

          skipped++;
          // Not in a dry run: the banner promises nothing is written, and the
          // state file is the thing the cutover decision is read from.
          if (execute) await record(job.path, source.etag, source.size);
          continue;
        }

        if (aborted) break;

        // A dry run must not cost what a real run costs: the store's operation
        // quota is why this project exists. HEAD gives size, content type and
        // the source MD5 — everything the preview reports — without moving the
        // 148.8 MB the catalogue weighs.
        if (!execute) {
          const source = await headBlob(job.path);
          if (source.status !== 200) {
            fail(
              job.path,
              `Blob HTTP ${source.status}`,
              isThrottleStatus(source.status) ? 'throttle' : 'object',
            );
            continue;
          }
          consecutiveFailures = 0;

          const problem = contentTypeProblem(source.contentType);
          if (problem) {
            fail(job.path, problem, 'object');
            continue;
          }
          if (!source.etag) {
            fail(job.path, 'Blob tidak memberi etag MD5, tidak bisa diverifikasi', 'object');
            continue;
          }

          copied++;
          bytes += source.size ?? 0;
          continue;
        }

        const response = await fetch(`https://${BLOB_HOST}/${job.path}`);
        if (!response.ok) {
          fail(
            job.path,
            `Blob HTTP ${response.status}`,
            isThrottleStatus(response.status) ? 'throttle' : 'object',
          );
          continue;
        }
        consecutiveFailures = 0;

        const contentType = response.headers.get('content-type');
        const typeProblem = contentTypeProblem(contentType);
        if (typeProblem) {
          fail(job.path, typeProblem, 'object');
          continue;
        }

        const sourceEtag = normaliseEtag(response.headers.get('etag'));
        const body = new Uint8Array(await response.arrayBuffer());
        const expectedMd5 = createHash('md5').update(body).digest('hex');

        // Link one of the chain: what we hold must be what Blob holds. Without
        // this a truncated response verifies perfectly against R2 and is
        // recorded as done, and nothing can correct it afterwards.
        if (!sourceEtag) {
          fail(job.path, 'Blob tidak memberi etag MD5, tidak bisa diverifikasi', 'object');
          continue;
        }
        if (sourceEtag !== expectedMd5) {
          fail(
            job.path,
            `unduhan tidak cocok dengan sumber: Blob ${sourceEtag}, terunduh ${expectedMd5}`,
            'throttle',
          );
          continue;
        }

        // The provider passes IfNoneMatch: '*', so this throws rather than
        // overwriting if the key exists.
        const result = await storage.put({
          path: job.path,
          body,
          contentType: contentType!,
          cacheControlMaxAge: CACHE_MAX_AGE_SECONDS,
        });

        // Link two: R2 returns the MD5 as the ETag for a non-multipart
        // PutObject. If this does not match, the bytes that landed are not the
        // bytes we read.
        if (normaliseEtag(result.etag) !== expectedMd5) {
          fail(
            job.path,
            `MD5 tidak cocok: harap ${expectedMd5}, dapat ${result.etag}`,
            'object',
          );
          continue;
        }

        await record(job.path, expectedMd5, body.byteLength);

        copied++;
        bytes += body.byteLength;
        if (copied % 50 === 0) {
          console.log(`   ...${copied}/${jobs.length} (${mb(bytes)})`);
        }
      } catch (error) {
        // A thrown error used to bypass the breaker entirely, so an R2 that
        // started refusing was worked through object by object to the end.
        // ObjectAlreadyExistsError is a lost race against another run, not a
        // refusal, so it does not count.
        const isRace = error instanceof Error && error.name === 'ObjectAlreadyExistsError';
        fail(
          job.path,
          error instanceof Error ? error.message : String(error),
          isRace ? 'object' : 'throttle',
        );
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
    console.log(`\nStatus tersimpan di ${STATE_FILE} — aman dijalankan ulang.`);
    console.log('Jalankan --verify sebelum memindahkan trafik ke R2.\n');
  }

  if (aborted || failures.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error('GAGAL:', error instanceof Error ? error.message : error);
  process.exit(1);
});

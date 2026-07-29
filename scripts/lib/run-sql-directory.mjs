/**
 * Shared logic for running a directory of .sql files against DATABASE_URL.
 * Used by both scripts/migrate.mjs (schema/) and scripts/seed.mjs (seed/).
 *
 * IMPORTANT: never throws in a way that should crash the calling npm script —
 * see docs/backend.md §7 for why the dev environment may not be able to
 * reach Postgres directly at all (IPv6-only direct connection, no route).
 * Callers are expected to always exit 0 regardless of what happens here.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadDotEnv() {
  // Minimal .env loader (avoids adding a dotenv dependency just for these
  // dev-time scripts). Next.js already loads .env for the app itself; these
  // scripts run standalone via `node`, so they need their own tiny loader.
  try {
    const envPath = join(__dirname, '..', '..', '.env');
    const content = readFileSync(envPath, 'utf-8');

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env not found — fine, DATABASE_URL might be set another way (CI, shell export, etc).
  }
}

/**
 * Runs every .sql file in `dir` (lexicographic order — filenames are
 * zero-padded, e.g. 0001_, 0002_, ...) against DATABASE_URL.
 *
 * @param {string} dir - absolute path to a directory of .sql files
 * @param {string} label - used in log lines, e.g. "schema" or "seed"
 */
export async function runSqlDirectory(dir, label) {
  loadDotEnv();

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn(
      `[db:${label}] DATABASE_URL not set — skipping. See .env.example. ` +
        'Falling back to manual SQL Editor runs is fine.'
    );
    return;
  }

  let files;
  try {
    files = readdirSync(dir)
      .filter((name) => name.endsWith('.sql'))
      .sort();
  } catch (err) {
    console.warn(`[db:${label}] Could not read ${dir}: ${err.message}`);
    return;
  }

  if (files.length === 0) {
    console.log(`[db:${label}] No .sql files found in ${dir}.`);
    return;
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
  } catch (err) {
    console.warn(
      `[db:${label}] Could not connect to database (${err.message}). Skipping — ` +
        'this will not block dev/build. Run the SQL files manually via ' +
        'Supabase Dashboard → SQL Editor instead.'
    );
    return;
  }

  console.log(`[db:${label}] Connected. Running ${files.length} file(s) from ${label}/...`);

  for (const file of files) {
    const sql = readFileSync(join(dir, file), 'utf-8');

    try {
      await client.query(sql);
      console.log(`[db:${label}] ✓ ${file}`);
    } catch (err) {
      // Schema files use `create or replace` / `if not exists` throughout;
      // seed files use `where not exists` — both are safe to re-run. A real
      // failure here is worth seeing, but still shouldn't block dev/build.
      console.warn(`[db:${label}] ✗ ${file}: ${err.message}`);
    }
  }

  await client.end();
  console.log(`[db:${label}] Done.`);
}

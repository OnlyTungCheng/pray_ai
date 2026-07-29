#!/usr/bin/env node
/**
 * Runs supabase/migrations/seed/*.sql — idempotent data seeding (e.g. the
 * system lobby room). Safe AND cheap to re-run every time, and intended to:
 * every `npm run dev`/`npm run build` runs this automatically (see
 * package.json predev/prebuild), so that if the lobby row (or any future
 * seed row) ever gets deleted — accidentally during testing, or because the
 * database was reset — it's recreated automatically on the next dev/build
 * without anyone needing to remember to run anything by hand.
 *
 * Deliberately allowed to run on every environment, including a Vercel
 * production build — unlike migrate.mjs (schema/DDL changes), this only
 * ever inserts a fixed row with `insert ... where not exists`, so re-running
 * it against production is a safe no-op if the row already exists. This is
 * a conscious decision, not an oversight: see docs/backend.md §3 for the
 * schema-vs-seed distinction and why migrate.mjs has a production
 * safeguard that this file intentionally does not need.
 *
 * Usage: `npm run db:seed` (also runs automatically via predev/prebuild)
 */

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSqlDirectory } from './lib/run-sql-directory.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedDir = join(__dirname, '..', 'supabase', 'migrations', 'seed');

runSqlDirectory(seedDir, 'seed').catch((err) => {
  console.warn(`[db:seed] Unexpected error, continuing anyway: ${err.message}`);
});

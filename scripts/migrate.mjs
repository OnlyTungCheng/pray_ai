#!/usr/bin/env node
/**
 * Runs supabase/migrations/schema/*.sql — one-time DDL (tables, RPC
 * functions, RLS policies, views, extensions). Safe to re-run (all files
 * use `create or replace` / `if not exists`), but not something that needs
 * to run on every `npm run dev` — only when the schema itself has changed
 * (e.g. after `git pull`, or right after provisioning a fresh Supabase
 * project / clearing the database).
 *
 * NOT wired into predev/prebuild — schema changes are applied manually by a
 * developer running this from their own machine, never automatically as
 * part of a Vercel build. See the production safeguard below for why this
 * matters even though it isn't currently in the build pipeline: it exists
 * so that if someone adds `db:migrate` to prebuild/predev later without
 * re-reading this file, a production build still refuses to run schema
 * changes unless explicitly opted in.
 *
 * Usage: `npm run db:migrate` (local/dev use only — see safeguard below)
 */

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSqlDirectory } from './lib/run-sql-directory.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaDir = join(__dirname, '..', 'supabase', 'migrations', 'schema');

// Production safeguard: Vercel sets VERCEL_ENV=production for production
// builds/deployments (VERCEL_ENV is also 'preview' or 'development' for
// other deployment types — see Vercel's system environment variables docs).
// Schema migrations should only ever be run by a developer from their own
// machine against a database they've deliberately pointed DATABASE_URL at
// — never automatically as part of a production build. This is a
// fail-safe-by-default check: it refuses to run on a detected production
// build UNLESS ALLOW_PROD_MIGRATE=true is explicitly set, which nothing in
// this repo sets automatically.
const isProductionBuild = process.env.VERCEL_ENV === 'production';
const explicitlyAllowed = process.env.ALLOW_PROD_MIGRATE === 'true';

if (isProductionBuild && !explicitlyAllowed) {
  console.warn(
    '[db:migrate] Refusing to run: detected a Vercel production build ' +
      '(VERCEL_ENV=production). Schema migrations must be run manually from ' +
      'a developer machine, never automatically during a production build. ' +
      'If you really need this to run here, set ALLOW_PROD_MIGRATE=true ' +
      'explicitly (not recommended — prefer running `npm run db:migrate` ' +
      'locally against DATABASE_URL instead).'
  );
} else {
  runSqlDirectory(schemaDir, 'migrate').catch((err) => {
    console.warn(`[db:migrate] Unexpected error, continuing anyway: ${err.message}`);
  });
}

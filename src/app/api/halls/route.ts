import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { listHalls } from '@/features/halls/hall-catalog-service';

/**
 * Lists every Hall (Điện) with its deity (Thần) roster + ritual/offering
 * content — for a future hall/deity picker UI (docs/than.md §4's "Bước 1/2:
 * Chọn Điện / Chọn thần"). Halls are DB-backed (public-read RLS policy, see
 * schema/0014_halls_and_deities.sql); deities/rituals/offerings are
 * hardcoded catalogs (deity-catalog.ts / hall-content-catalog.ts) attached
 * in listHalls(). No auth required, no rate limit — this is a small, fully
 * public catalog read with no room for abuse (no user input, no write).
 */
export async function GET() {
  const supabase = await createClient();
  const halls = await listHalls(supabase);

  return NextResponse.json({ halls });
}

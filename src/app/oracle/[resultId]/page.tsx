import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { OracleTier } from '@/features/oracle/types';
import { ORACLE_TIER_LABELS } from '@/features/oracle/types';
import OracleResultView from './OracleResultView';

export const metadata: Metadata = {
  title: 'Quẻ Mệnh Deploy | Đền Cầu Nguyện',
  description: 'Chi tiết quẻ mệnh deploy của lập trình viên.'
};

type Props = {
  params: Promise<{
    resultId: string;
  }>;
};

export default async function OraclePage({ params }: Props) {
  const { resultId } = await params;
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from('oracle_results')
    .select(
      `
        id,
        tier,
        event_type,
        message,
        created_at,
        room:room_id ( title, project_name )
      `
    )
    .eq('id', resultId)
    .maybeSingle();

  if (error || !result) {
    notFound();
  }

  const tier = result.tier as OracleTier;
  const room = Array.isArray(result.room) ? result.room[0] : result.room;
  const projectName = room?.project_name ?? room?.title ?? 'Dự Án';

  return (
    <OracleResultView
      tier={tier}
      tierLabel={ORACLE_TIER_LABELS[tier]}
      message={result.message}
      projectName={projectName}
    />
  );
}

import {
  READINESS_CHECKS,
  type ProjectReadinessCheck,
  type ProjectReadinessSnapshot,
  type ReadinessCheckKey,
  type ReadinessStatus,
} from "./types";

const CHECK_META: Record<ReadinessCheckKey, Pick<ProjectReadinessCheck, "label" | "description">> = {
  ci: { label: "CI", description: "Build, test và kiểm tra bắt buộc" },
  review: { label: "Code review", description: "PR đã được người chịu trách nhiệm duyệt" },
  migration: { label: "Migration", description: "Có kế hoạch backup và rollback dữ liệu" },
  deploy_health: { label: "Deploy health", description: "Monitoring, health check và rollback đã sẵn sàng" },
};

const STATUS_SCORE: Record<ReadinessStatus, number> = { pass: 100, warn: 60, fail: 0, unknown: 0 };

export function buildReadinessSnapshot(
  rows: Array<Partial<ProjectReadinessCheck>>,
  recentRuns: ProjectReadinessSnapshot["recentRuns"] = [],
): ProjectReadinessSnapshot {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const checks = READINESS_CHECKS.map((key) => {
    const row = byKey.get(key);
    return {
      key,
      ...CHECK_META[key],
      status: row?.status ?? "unknown",
      note: row?.note ?? null,
      source: row?.source ?? "system",
      updatedAt: row?.updatedAt ?? null,
      updatedBy: row?.updatedBy ?? null,
    } satisfies ProjectReadinessCheck;
  });
  const score = Math.round(checks.reduce((total, check) => total + STATUS_SCORE[check.status], 0) / checks.length);
  const blockers = checks.filter((check) => check.status === "fail" || check.status === "unknown");
  return { score, verdict: blockers.length ? "blocked" : score < 80 ? "needs_attention" : "ready", checks, blockers, recentRuns };
}

export function isReadinessCheckKey(value: string): value is ReadinessCheckKey {
  return (READINESS_CHECKS as readonly string[]).includes(value);
}

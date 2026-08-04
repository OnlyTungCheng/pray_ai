export const READINESS_CHECKS = ["ci", "review", "migration", "deploy_health"] as const;

export type ReadinessCheckKey = (typeof READINESS_CHECKS)[number];
export type ReadinessStatus = "pass" | "warn" | "fail" | "unknown";

export type ProjectReadinessCheck = {
  key: ReadinessCheckKey;
  label: string;
  description: string;
  status: ReadinessStatus;
  note: string | null;
  source: "manual" | "github" | "system";
  updatedAt: string | null;
  updatedBy: string | null;
};

export type ProjectReadinessSnapshot = {
  score: number;
  verdict: "blocked" | "needs_attention" | "ready";
  checks: ProjectReadinessCheck[];
  blockers: ProjectReadinessCheck[];
  recentRuns: LaunchRitualRun[];
};

export type LaunchRitualRun = {
  id: string;
  createdAt: string;
  initiatedBy: string;
  readinessScore: number;
  riskAccepted: boolean;
  note: string | null;
  oracleResultId: string | null;
  oracleTier: string | null;
};

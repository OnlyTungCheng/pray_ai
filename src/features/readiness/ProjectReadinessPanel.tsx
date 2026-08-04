"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProjectReadinessSnapshot, ReadinessStatus } from "./types";

type Props = { roomId: string; themeMode: "basic" | "remix"; onLaunch: (snapshot: ProjectReadinessSnapshot) => void; onSnapshot?: (snapshot: ProjectReadinessSnapshot) => void };
const statusLabel: Record<ReadinessStatus, string> = { pass: "Sẵn sàng", warn: "Cần lưu ý", fail: "Chặn", unknown: "Chưa xác nhận" };

export default function ProjectReadinessPanel({ roomId, themeMode, onLaunch, onSnapshot }: Props) {
  const [snapshot, setSnapshot] = useState<ProjectReadinessSnapshot | null>(null);
  const [open, setOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const response = await fetch(`/api/rooms/${roomId}/readiness`, { cache: "no-store" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(payload.error === "NOT_A_ROOM_MEMBER" ? "Hãy vào đền trước khi cùng kiểm tra readiness." : "Không thể tải readiness.");
    }
    const nextSnapshot = await response.json() as ProjectReadinessSnapshot;
    setSnapshot(nextSnapshot); onSnapshot?.(nextSnapshot);
  }, [onSnapshot, roomId]);
  useEffect(() => { void load().catch((reason) => setError(reason.message)); }, [load]);
  async function setStatus(checkKey: string, status: ReadinessStatus) {
    setPendingKey(checkKey); setError(null);
    try {
      const response = await fetch(`/api/rooms/${roomId}/readiness`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checkKey, status }) });
      if (!response.ok) throw new Error("Không thể cập nhật check.");
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Có lỗi xảy ra."); }
    finally { setPendingKey(null); }
  }
  const verdict = snapshot?.verdict ?? "blocked";
  return <div className={`readiness-dock ${themeMode === "remix" ? "readiness-dock-remix" : ""}`}>
    <button type="button" onClick={() => setOpen((value) => !value)} className="readiness-dock-trigger" aria-expanded={open}>
      <span>🧭</span><span>Readiness</span><strong className={`readiness-score readiness-${verdict}`}>{snapshot?.score ?? "–"}%</strong>
    </button>
    {open && <section className="readiness-panel" aria-label="Project launch readiness">
      <header><div><p>PROJECT SUCCESS RITUAL</p><h2>{verdict === "ready" ? "Sẵn sàng khai lễ" : verdict === "needs_attention" ? "Cần rà soát thêm" : "Đang bị chặn"}</h2></div><button type="button" onClick={() => void load()}>↻</button></header>
      <div className="readiness-progress"><span style={{ width: `${snapshot?.score ?? 0}%` }} /></div>
      <div className="readiness-checks">
        {snapshot?.checks.map((check) => <article key={check.key} className={`readiness-check status-${check.status}`}>
          <div><strong>{check.label}</strong><p>{check.description}</p></div><span>{statusLabel[check.status]}</span>
          <div className="readiness-actions"><button disabled={pendingKey === check.key} onClick={() => void setStatus(check.key, "pass")}>Pass</button><button disabled={pendingKey === check.key} onClick={() => void setStatus(check.key, "warn")}>Warn</button><button disabled={pendingKey === check.key} onClick={() => void setStatus(check.key, "fail")}>Block</button></div>
        </article>)}
      </div>
      {error && <p className="readiness-error">{error}</p>}
      <button type="button" className="launch-ritual-button" disabled={!snapshot} onClick={() => snapshot && onLaunch(snapshot)}>Cùng khai lễ thành công →</button>
      {snapshot?.recentRuns.length ? <ol className="readiness-timeline">{snapshot.recentRuns.slice(0, 3).map((run) => <li key={run.id}>Lễ {run.readinessScore}% {run.riskAccepted ? "· đã chấp nhận rủi ro" : "· an toàn"}</li>)}</ol> : <p className="readiness-empty">Chưa có lần khai lễ nào.</p>}
    </section>}
  </div>;
}

"use client";

import { useRef, useState } from "react";
import type { ProjectReadinessSnapshot } from "./types";

type Props = { roomId: string; snapshot: ProjectReadinessSnapshot | null; themeMode: "basic" | "remix"; onClose: () => void; onCompleted: (resultId: string) => void };
export default function LaunchRitualModal({ roomId, snapshot, themeMode, onClose, onCompleted }: Props) {
  const [acceptRisk, setAcceptRisk] = useState(false); const [note, setNote] = useState(""); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  const ritualIdRef = useRef(crypto.randomUUID());
  if (!snapshot) return null;
  const blocked = snapshot.blockers.length > 0;
  async function launch() { setLoading(true); setError(null); try { const response = await fetch(`/api/rooms/${roomId}/launch-ritual`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: ritualIdRef.current, riskAccepted: acceptRisk, note: note || null }) }); const payload = await response.json(); if (!response.ok) { setError(payload.error === "READINESS_BLOCKED" ? "Các check chặn vẫn chưa được xác nhận." : "Không thể khai lễ."); return; } onCompleted(payload.result.id); } catch { setError("Kết nối bị gián đoạn."); } finally { setLoading(false); } }
  return <div className="launch-ritual-backdrop" role="presentation"><section className={`launch-ritual-modal ${themeMode === "remix" ? "launch-ritual-remix" : ""}`} role="dialog" aria-modal="true" aria-labelledby="launch-ritual-title"><button className="launch-close" onClick={onClose}>×</button><p>FINAL GATE</p><h2 id="launch-ritual-title">Khai lễ thành công · {snapshot.score}%</h2><p className="launch-copy">Oracle chỉ là nghi thức vui. Readiness snapshot này được lưu cùng lần khai lễ để team có thể đối chiếu sau deploy.</p>{blocked && <><ul>{snapshot.blockers.map((check) => <li key={check.key}>{check.label}: {check.status === "unknown" ? "chưa xác nhận" : "đang chặn"}</li>)}</ul><label className="launch-risk"><input type="checkbox" checked={acceptRisk} onChange={(event) => setAcceptRisk(event.target.checked)} /> Tôi hiểu và chấp nhận rủi ro còn lại.</label></>}<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={280} placeholder="Ghi chú cho lần release (không bắt buộc)" /><button className="launch-confirm" disabled={loading || (blocked && !acceptRisk)} onClick={() => void launch()}>{loading ? "Đang khai lễ…" : "Rút quẻ & lưu snapshot"}</button>{error && <p className="readiness-error">{error}</p>}</section></div>;
}

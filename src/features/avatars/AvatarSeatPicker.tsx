'use client';

import { useMemo, useState } from 'react';
import { CHIBI_AVATARS, type ChibiAvatar } from './avatar-catalog';
import { MAX_SEAT_SLOTS } from '../temple-room/seat-config';
import type { Participant } from '../temple-room/use-temple-room';

type AvatarSeatPickerProps = {
  participants: Participant[];
  userId: string;
  themeMode: string;
  onClaim: (seatSlot: number, avatarId: ChibiAvatar['id']) => Promise<void>;
  onRelease: () => Promise<void>;
  onClose: () => void;
};

export default function AvatarSeatPicker({ participants, userId, themeMode, onClaim, onRelease, onClose }: AvatarSeatPickerProps) {
  const isRemix = themeMode === 'remix';
  const self = participants.find((participant) => participant.userId === userId);
  const [avatarId, setAvatarId] = useState<ChibiAvatar['id']>((self?.avatarId as ChibiAvatar['id']) ?? CHIBI_AVATARS[0].id);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const occupied = useMemo(() => new Map(participants.filter((participant) => participant.seatSlot !== null).map((participant) => [participant.seatSlot!, participant])), [participants]);

  async function claim(seatSlot: number) {
    if (occupied.has(seatSlot) && occupied.get(seatSlot)?.userId !== userId) return;
    setBusy(true); setMessage(null);
    try { await onClaim(seatSlot, avatarId); onClose(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể giữ ghế này.'); }
    finally { setBusy(false); }
  }

  async function release() {
    setBusy(true); setMessage(null);
    try { await onRelease(); onClose(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể rời ghế.'); }
    finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/75 p-4 backdrop-blur-md">
    <section role="dialog" aria-modal="true" aria-label="Chọn avatar và chỗ ngồi" className={`avatar-picker ${isRemix ? 'avatar-picker-remix' : ''}`}>
      <header className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">Room presence</p><h2>{isRemix ? '🪩 Chọn crew & vị trí sàn diễn' : '🪷 Chọn avatar & chỗ ngồi'}</h2></div><button type="button" onClick={onClose} className="avatar-picker-close" aria-label="Đóng">×</button></header>
      <div className="avatar-picker-section"><p>1. Chọn avatar</p><div className="avatar-picker-grid">{CHIBI_AVATARS.map((avatar) => <button key={avatar.id} type="button" disabled={busy} onClick={() => setAvatarId(avatar.id)} aria-pressed={avatarId === avatar.id} className={`avatar-choice${avatarId === avatar.id ? ' is-selected' : ''}`}><img src={avatar.file} alt="" /><span>{avatar.label}</span></button>)}</div></div>
      <div className="avatar-picker-section"><p>2. Chọn một ghế trống</p><div className="seat-picker-grid">{Array.from({ length: MAX_SEAT_SLOTS }, (_, seatSlot) => { const owner = occupied.get(seatSlot); const mine = owner?.userId === userId; return <button key={seatSlot} type="button" disabled={busy || Boolean(owner && !mine)} onClick={() => void claim(seatSlot)} className={`seat-choice${owner ? ' is-occupied' : ''}${mine ? ' is-mine' : ''}`}><span>Ghế {seatSlot + 1}</span><small>{owner ? (mine ? 'Bạn đang ngồi' : owner.displayName) : 'Còn trống'}</small></button>; })}</div></div>
      {message && <p role="alert" className="avatar-picker-message">{message}</p>}
      {self?.seatSlot !== null && self?.seatSlot !== undefined && <button type="button" disabled={busy} onClick={() => void release()} className="avatar-release">Rời ghế hiện tại</button>}
    </section>
  </div>;
}

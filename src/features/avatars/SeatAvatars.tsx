'use client';

import { CHIBI_AVATARS } from './avatar-catalog';
import type { Participant } from '../temple-room/use-temple-room';

type SeatAvatarsProps = { participants: Participant[]; themeMode: string };
const SEAT_POSITIONS = [[15, 68], [29, 76], [42, 80], [58, 80], [71, 76], [85, 68], [24, 55], [76, 55]] as const;

export default function SeatAvatars({ participants, themeMode }: SeatAvatarsProps) {
  const isRemix = themeMode === 'remix';
  return <div className={`seat-avatars${isRemix ? ' seat-avatars-remix' : ''}`} aria-label="Thành viên đang ngồi">
    {participants.filter((participant) => participant.seatSlot !== null && participant.avatarId).map((participant) => {
      const avatar = CHIBI_AVATARS.find((candidate) => candidate.id === participant.avatarId);
      const position = SEAT_POSITIONS[participant.seatSlot ?? 0];
      if (!avatar || !position) return null;
      return <div key={participant.userId} className={`seat-avatar${participant.activity === 'praying' ? ' is-praying' : ''}`} style={{ left: `${position[0]}%`, top: `${position[1]}%` }} title={participant.displayName}><img src={avatar.file} alt="" /><span>{participant.displayName}</span></div>;
    })}
  </div>;
}

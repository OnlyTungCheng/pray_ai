# PRD: Avatar Nhân Vật Chibi (Chỗ Ngồi Tương Tác Ở Nền)

Trạng thái: Draft — tập trung Technical/BE. UI/UX (thiết kế nhân vật, animation chi tiết, layout sân đền) sẽ làm ở giai đoạn sau.

## 1. Mục tiêu

Cho phép mỗi thành viên trong phòng chọn 1 nhân vật chibi có sẵn và **ngồi vào 1 trong các vị trí (slot) cố định** quanh sân đền. Nhân vật hiển thị ở nền cho mọi người trong phòng cùng thấy (giống presence hiện tại, nhưng có hình đại diện + vị trí thay vì chỉ tên), và đổi animation theo trạng thái hoạt động hiện có (`idle` / `praying`). Không di chuyển tự do — vị trí luôn là 1 trong N slot rời rạc định nghĩa trước.

## 2. Phạm vi

**Trong phạm vi:**
- Bộ nhân vật chibi có sẵn (preset), chọn 1 trong vài mẫu.
- N slot cố định mỗi phòng (số lượng giống nhau ở mọi phòng, kể cả sảnh chung).
- Chọn/đổi slot, tranh chấp slot (race condition) được xử lý ở tầng server.
- Avatar + slot chỉ tồn tại trong phạm vi 1 phòng (`room_members`) — không phải hồ sơ user toàn cục. Vào phòng khác phải chọn lại.
- Giải phóng slot tự động khi rời phòng (đóng tab, mất kết nối).
- Đồng bộ realtime cho mọi client trong phòng thấy ai đang ngồi đâu, dùng nhân vật nào.

**Ngoài phạm vi (chưa làm ở giai đoạn này):**
- Di chuyển tự do (toạ độ x/y liên tục, kiểu multiplayer walk-around).
- Character customization (ghép layer tóc/áo/màu).
- Avatar dùng lại xuyên phòng (cross-room profile).
- Chi tiết animation/UI/hình ảnh nhân vật.

## 3. Vấn đề kỹ thuật cốt lõi: giới hạn slot + race condition

Đây là phần khó nhất và trọng tâm của PRD này.

### 3.1. Vì sao không thể xử lý thuần Presence (client-side)

Cơ chế Presence hiện tại (`use-temple-room.ts`) chỉ đồng bộ **state tuỳ ý mỗi client tự khai báo** (`channel.track({...})`) — Supabase Realtime **không có khái niệm "khoá tài nguyên chung"** giữa các client. Nếu để mỗi client tự chọn slot và broadcast/track state đó, 2 người bấm cùng 1 slot trong cùng millisecond sẽ **cả 2 đều thấy mình đã ngồi thành công** cho tới khi state Presence đồng bộ lại — đúng loại race condition mà `apply_room_action` RPC đã được viết ra để tránh cho counters (`incense_count`, v.v.), theo lý do đã ghi trong `schema/0002_apply_room_action_rpc.sql`. Slot cần **1 nguồn sự thật duy nhất ở Postgres**, dùng row-level lock để serialize các lượt giành slot đồng thời — Presence chỉ dùng để *phát* kết quả đã được server xác nhận, không dùng để *quyết định* ai thắng.

### 3.2. Thiết kế: cột slot trên `room_members`, không phải bảng riêng

Vì slot có phạm vi **room** (đúng theo xác nhận của bạn) và mỗi user chỉ có thể ngồi ở đúng 1 slot tại 1 thời điểm trong 1 phòng — quan hệ 1-1 giữa `(room_id, user_id)` và slot khớp tự nhiên với `room_members` (đã có PK `(room_id, user_id)`), không cần bảng riêng.

```sql
alter table public.room_members
  add column if not exists avatar_id text,      -- null = chưa chọn nhân vật
  add column if not exists seat_slot integer;    -- null = chưa ngồi, 0..(N-1) = đang ngồi slot đó

-- Đảm bảo không 2 user cùng ngồi 1 slot trong cùng 1 phòng.
-- Partial unique index (bỏ qua NULL) — chỉ áp dụng khi seat_slot đã được chọn.
create unique index if not exists room_members_room_seat_unique
  on public.room_members (room_id, seat_slot)
  where seat_slot is not null;
```

`avatar_id` tách riêng khỏi `seat_slot` — cho phép chọn nhân vật trước khi có chỗ trống, hoặc đổi nhân vật mà không cần đứng dậy.

### 3.3. RPC atomic để giành slot — chống race condition ở tầng Postgres

```sql
create or replace function public.claim_seat_slot(
  p_room_id uuid,
  p_user_id uuid,
  p_seat_slot integer,
  p_max_slots integer default 8
)
returns table (success boolean, reason text)
language plpgsql
as $$
begin
  if p_seat_slot < 0 or p_seat_slot >= p_max_slots then
    return query select false, 'INVALID_SLOT';
    return;
  end if;

  -- Giải phóng slot cũ của chính user này trước (nếu có) — cho phép "đổi chỗ".
  update public.room_members
    set seat_slot = null
    where room_id = p_room_id and user_id = p_user_id;

  -- Cố giành slot mới. Unique index ở 3.2 là lớp bảo vệ cuối cùng chống
  -- race condition thật (2 request đến đồng thời) — statement dưới đây
  -- có thể match 0 dòng nếu slot vừa bị người khác chiếm ngay trước đó
  -- (giữa lúc kiểm tra và lúc update), nhờ row lock của UPDATE.
  update public.room_members
    set seat_slot = p_seat_slot
    where room_id = p_room_id
      and user_id = p_user_id
      and not exists (
        select 1 from public.room_members m2
        where m2.room_id = p_room_id
          and m2.seat_slot = p_seat_slot
          and m2.user_id <> p_user_id
      );

  if not found then
    return query select false, 'SLOT_TAKEN';
    return;
  end if;

  return query select true, null::text;
end;
$$;
```

Không dùng cách "SELECT kiểm tra trống rồi INSERT/UPDATE riêng" (read-modify-write kinh điển) — dùng **1 câu UPDATE có điều kiện `not exists` ngay trong `WHERE`**, để Postgres tự serialize theo row lock, giống nguyên tắc `apply_room_action` đã áp dụng. Unique index ở 3.2 là lớp an toàn thứ 2 (defense in depth): nếu có race condition hiếm gặp lách qua được logic trên (ví dụ do lỗi tương lai), Postgres sẽ tự chặn ở tầng constraint, insert/update thứ 2 sẽ lỗi `23505` — route handler bắt lỗi này y hệt cách `room_actions.id` đã làm cho idempotency.

### 3.4. Route handler mới

`POST /api/rooms/[roomId]/seat` — theo đúng pattern các route hiện có (`requireUser`, rate-limit, gọi RPC, broadcast).

```
Input: { seatSlot: number, avatarId?: string }
1. requireUser() — xác thực qua room-service.ts pattern hiện có.
2. Kiểm tra user có trong room_members chưa (phải join phòng trước khi ngồi).
3. enforceRateLimit(..., 'rooms:seat', { maxRequests: 10, windowSeconds: 10 })
   — tránh spam đổi chỗ liên tục.
4. Gọi RPC claim_seat_slot(roomId, userId, seatSlot).
5. Nếu reason = 'SLOT_TAKEN' → trả 409 Conflict (không phải 500 — đây là
   tranh chấp bình thường, client nên tự thử slot khác, không phải lỗi hệ thống).
6. Nếu thành công → broadcast qua channel room:<roomId> (giống actions/route.ts),
   event riêng 'seat-update' (không tái dùng 'room-action' vì đây không phải
   1 room_action/room_offering, không cần eventId-based idempotency vì
   claim_seat_slot đã tự idempotent nhờ update-with-condition).
```

### 3.5. Giải phóng slot khi rời phòng

Theo xác nhận của bạn (giải phóng khi rời phòng): có 2 kịch bản rời phòng cần cả 2 đều xử lý đúng:

- **Rời chủ động** (bấm nút "rời phòng", nếu tương lai có) hoặc **đóng tab/mất kết nối**: Presence "leave" event đã tồn tại (`use-temple-room.ts` đã có handler rỗng cho `presence: leave`, chỉ dựa vào "sync" cập nhật lại toàn bộ) — nhưng Presence **không tự động dọn `room_members.seat_slot` trong Postgres**, nó chỉ là state tạm trong bộ nhớ Realtime server. Cần 1 trong 2 cách:
  1. **Client gọi API rời ghế** trước khi unmount (best-effort, có thể miss nếu tab bị đóng cứng, đóng máy đột ngột).
  2. **Coi `seat_slot` là ephemeral theo phiên kết nối, không phải trạng thái DB bền**: khi 1 user disconnect, client khác chờ "sync" event, tự ẩn avatar của user đó khỏi UI (dựa theo Presence, không dựa `room_members.seat_slot`) — nhưng `seat_slot` trong DB thì vẫn "chiếm" cho tới khi có ai dọn.
- **Khuyến nghị**: coi **Presence là nguồn sự thật cho "ai đang online + đang ngồi đâu ngay bây giờ"**, còn `room_members.seat_slot` chỉ là **gợi ý ban đầu để hiển thị đúng khi mới join/reload trang** (trước khi Presence sync lần đầu chạy xong). Cụ thể:
  - `seat_slot` trong Presence payload (`channel.track({..., seatSlot, avatarId})`) là nguồn hiển thị chính khi phòng đang mở — tự dọn theo đúng cơ chế Presence "leave" có sẵn, không cần code gì thêm.
  - `room_members.seat_slot` trong DB chỉ dùng để: (a) chống race condition lúc giành ghế (3.3), (b) hiển thị tạm ngay khi Server Component render trang lần đầu (trước khi Realtime kết nối) để tránh flash "trống" rồi mới có người.
  - Cần 1 cách dọn `room_members.seat_slot` định kỳ cho user đã rời hẳn (không chỉ mất kết nối tạm) — tái dùng cơ chế `pg_cron` đã có (`0009_scheduled_cleanup.sql`): thêm 1 job giải phóng `seat_slot` của các `room_members` không có hoạt động (`room_actions`) trong X phút, hoặc đơn giản hơn: giải phóng khi phòng `expires_at` hết hạn (đã có cơ chế cleanup).

### 3.6. Đồng bộ Realtime — mở rộng Presence payload

```ts
// use-temple-room.ts — mở rộng Participant type hiện có
type Participant = {
  userId: string;
  displayName: string;
  activity: "idle" | "praying";
  joinedAt: string;
  seatSlot: number | null;   // mới
  avatarId: string | null;   // mới
};
```

`updateActivity()` hiện có (gọi `channel.track()`) sẽ được gọi lại mỗi khi seat/avatar đổi — không cần channel/event mới, tái dùng cơ chế Presence sẵn có. Route `POST /api/rooms/[roomId]/seat` xác nhận ở DB xong thì **client tự gọi `channel.track()` lại** với `seatSlot`/`avatarId` mới (giống cách `updateActivity("praying")` đang được gọi sau khi `sendAction("start_praying")` thành công trong `LiveAltarPage.tsx`) — không cần route handler tự broadcast, giữ đúng pattern "Presence do client track, Action/state do server xác nhận" đã nhất quán trong toàn bộ codebase.

## 4. Catalog nhân vật chibi (preset)

Theo đúng pattern `DEVELOPER_OFFERINGS`/`offering-catalog.ts` đã làm cho lễ vật — tạo `src/features/avatars/avatar-catalog.ts` (không `"use client"`, dùng chung server + client):

```ts
export type ChibiAvatar = {
  id: 'dev_1' | 'dev_2' | 'dev_3' | ...;  // số lượng cụ thể chốt ở giai đoạn UI
  label: string;
  file: string;
};

export const CHIBI_AVATARS: ChibiAvatar[] = [ ... ];
export const AVATAR_IDS = CHIBI_AVATARS.map(a => a.id);
export function isValidAvatarId(value: unknown): value is ChibiAvatar['id'] { ... }
```

`avatar_id` trên `room_members` cần `check` constraint đồng bộ với whitelist này (giống cách `room_offerings.offering_id` đã làm) — validate cả ở DB và ở route handler (2 lớp, đúng pattern đã thiết lập cho lễ vật).

## 5. Số lượng slot cố định

Theo xác nhận "hiện tại cố định": 1 hằng số duy nhất, ví dụ `MAX_SEAT_SLOTS = 8`, dùng chung cho mọi phòng (kể cả sảnh chung). Đặt ở `src/features/temple-room/seat-config.ts`, tham chiếu bởi cả route handler (default param của RPC) và client (render đúng N slot trống cố định). Không lưu trong `rooms` table ở giai đoạn này — nếu sau này cần khác nhau theo phòng, thêm cột `rooms.max_seat_slots` là thay đổi tương thích ngược (default = hằng số hiện tại).

## 6. Danh sách file cần tạo/sửa

| File | Việc |
|---|---|
| `supabase/migrations/schema/0013_seat_slots.sql` (mới) | Cột `avatar_id`/`seat_slot` trên `room_members`, unique partial index, RPC `claim_seat_slot`, RPC `release_seat_slot` (dọn khi rời phòng chủ động), mở rộng `check` constraint whitelist avatar. |
| `src/features/avatars/avatar-catalog.ts` (mới) | Danh sách preset nhân vật + validator, theo pattern `offering-catalog.ts`. |
| `src/features/temple-room/seat-config.ts` (mới) | Hằng số `MAX_SEAT_SLOTS`. |
| `src/app/api/rooms/[roomId]/seat/route.ts` (mới) | Route giành/đổi/rời ghế, theo pattern `actions/route.ts`. |
| `src/features/temple-room/use-temple-room.ts` (sửa) | Mở rộng `Participant` type với `seatSlot`/`avatarId`. |
| `src/features/temple-room/room-service.ts` (sửa) | Mở rộng `RoomSummary`/mapper nếu cần hiển thị seat ban đầu từ Server Component. |
| `docs/backend.md` (sửa) | Thêm mục mô tả cơ chế slot + RPC mới, theo đúng chuẩn tài liệu đã có. |

## 7. Rủi ro/câu hỏi mở còn lại (cần chốt trước khi code)

1. **`release_seat_slot` gọi khi nào chính xác?** — nếu chỉ dựa Presence "leave" (không có API call), `room_members.seat_slot` trong DB có thể "kẹt" (chiếm ghế) vô thời hạn nếu user đóng tab mà không có cách nào dọn ngoài `pg_cron`/room-expiry. Cần quyết định: chấp nhận độ trễ dọn dẹp (đơn giản, dùng cron có sẵn) hay cần dọn ngay lập tức (phức tạp hơn — có thể cần Supabase Realtime's presence timeout kết hợp 1 broadcast "user left" kích hoạt gọi API dọn ghế, cần thêm cơ chế webhook/Edge Function ngoài phạm vi hiện có).
2. **Người dùng có bị giới hạn 1 phòng chỉ đổi ghế N lần/phút không** — đã đề xuất rate-limit 10/10s ở 3.4, cần xác nhận số phù hợp khi có UI thật.
3. **Slot hết (N người đã ngồi, người thứ N+1 vào phòng)** — hành vi mong đợi: không được chọn ghế (đứng nền, không avatar) hay phải chờ? PRD hiện giả định "không chọn được, đứng nền không avatar" là hành vi mặc định hợp lý, cần xác nhận khi làm UI.

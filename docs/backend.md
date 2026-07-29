# Backend — Đền Cầu Nguyện

Tài liệu này phản ánh **trạng thái thật của backend đã triển khai**, không phải kế hoạch ban đầu. Nếu có mâu thuẫn với `docs/join_room_features.md` hoặc `docs/den_cau_nguyen_kich_ban_1.md` (2 doc định hướng sản phẩm/thiết kế ban đầu), tài liệu này là nguồn đúng cho code hiện tại.

## 1. Kiến trúc tổng quan

```
Client (browser)
  └─ ensureAnonymousUser() → Supabase Auth (anonymous sign-in)
  └─ fetch('/api/...')       → Next.js Route Handlers (server)
                                   └─ Supabase Postgres (RPC + RLS)
                                   └─ Supabase Realtime (Broadcast/Presence, private channels)
```

- **Không dùng database trigger** để phát broadcast (khác với đề xuất ban đầu trong `join_room_features.md`) — broadcast được gọi trực tiếp từ route handler sau khi RPC atomic-increment hoàn tất, để dễ debug và giữ logic ở một nơi (TypeScript, không phải PL/pgSQL trigger).
- Toàn bộ ghi dữ liệu chính thức (counters, room state) đi qua RPC Postgres, không phải update trực tiếp qua PostgREST — tránh race condition khi nhiều client cùng lúc.

## 2. Xác thực (Auth)

- **Anonymous-first**: mọi user là anonymous Supabase Auth user (`signInAnonymously()`), không cần email/password.
- ⚠️ **Cài đặt bắt buộc trên Dashboard**: Authentication → Providers → **Anonymous Sign-Ins → Enable**. Nếu tắt, mọi lời gọi `ensureAnonymousUser()` sẽ lỗi `AuthApiError: Anonymous sign-ins are disabled`.
- `src/features/auth/ensure-anonymous-user.ts`: gọi `getUser()` trước; nếu lỗi là `AuthSessionMissingError` (dùng helper `isAuthSessionMissingError` từ `@supabase/supabase-js`, **không** so sánh `.name` bằng tay) thì coi là "chưa có session" (bình thường với visitor mới), mới gọi `signInAnonymously()`. Mọi lỗi khác thì throw thật.
- **Quan trọng**: `ensureAnonymousUser()` chỉ chạy trong Client Component (dùng `@/lib/supabase/client`, browser client). Server Component (ví dụ `/` hoặc `/oracle/[resultId]`) **không** có cách nào tự đăng nhập ẩn danh trước khi render lần đầu — đây là lý do RLS trên các bảng public-readable phải cho phép cả role `anon`, không chỉ `authenticated` (xem mục 4).
- **CAPTCHA protection (Cloudflare Turnstile)**: `src/features/auth/anonymous-captcha-gate.tsx` cung cấp hook `useAnonymousSignIn()` — bọc `ensureAnonymousUser()` bằng 1 challenge Turnstile ở mode `invisible` (thường không cần user thấy/tương tác gì). Dùng ở `/pray` và `TempleRoomClientWrapper` (2 nơi gọi sign-in) thay cho gọi `ensureAnonymousUser()` trực tiếp.
  - Nếu `NEXT_PUBLIC_TURNSTILE_SITE_KEY` không được set: hook bỏ qua challenge hoàn toàn, gọi sign-in không kèm token — vẫn hoạt động bình thường **trừ khi** "Enable CAPTCHA protection" đã được bật ở Supabase Dashboard (Auth → Bot and Abuse Protection), lúc đó sign-in sẽ lỗi vì thiếu token.
  - Cần cấu hình ở 2 nơi độc lập: (1) Cloudflare Dashboard → Turnstile → tạo site, lấy Site Key (client) + Secret Key (server); (2) Supabase Dashboard → Auth → Bot and Abuse Protection → chọn provider Turnstile, dán Secret Key.

## 3. Schema Database

Toàn bộ nằm trong `supabase/migrations/`, chạy theo đúng thứ tự số (`0001` → `0009` hiện tại). Không tự động chạy được qua Supabase CLI từ môi trường dev hiện tại (xem mục 7) — **chạy tay qua Supabase Dashboard → SQL Editor**, copy-paste từng file theo thứ tự.

| File | Nội dung |
|---|---|
| `0001_temple_core_schema.sql` | Bảng `rooms`, `room_members`, `room_actions`, `oracle_results`. Trigger `updated_at`. RLS ban đầu (đã bị sửa lại một phần ở `0007`). |
| `0002_apply_room_action_rpc.sql` | RPC `apply_room_action(room_id, action_type)` — tăng counter atomically bằng 1 câu `UPDATE ... SET col = col + delta`, clamp `energy` 0-100, luôn `revision + 1`. |
| `0003_room_action_rate_limit.sql` | RPC `check_room_action_rate_limit(room_id, user_id, min_interval_ms=250)` — chặn user gửi quá nhanh (spam nhiều eventId khác nhau liên tục) trong cùng 1 room. |
| `0004_seed_system_lobby_room.sql` | Seed 1 row cố định `slug='sanh-chung'` — sảnh chung dùng chung cho mọi visitor ở trang chủ. Idempotent (`INSERT ... WHERE NOT EXISTS`). |
| `0005_active_rooms_and_top_rank.sql` | View `active_project_rooms` (phòng dự án chưa hết hạn, loại trừ sảnh chung) và `project_top_rank` (tổng hợp `SUM` theo `project_name`). Cả 2 dùng `security_invoker = true` để tôn trọng RLS đúng theo role gọi, không theo owner view. |
| `0006_generic_api_rate_limit.sql` | Bảng `api_rate_limits` + RPC `check_rate_limit(user_id, endpoint, max_requests=15, window_seconds=60)` — rate limit chung cho mọi API endpoint theo sliding window. |
| `0007_allow_anon_read_rooms.sql` | **Fix quan trọng**: mở `SELECT` trên `rooms`, `oracle_results`, và 2 view ở `0005` cho cả role `anon` (không chỉ `authenticated`). Không có file này, trang chủ/oracle-result sẽ luôn báo "không tìm thấy" dù dữ liệu tồn tại, vì Server Component fetch lần đầu chạy trước khi có session. |
| `0008_realtime_room_channel_authorization.sql` | RLS trên `realtime.messages` cho phép broadcast/presence trên topic `room:{roomId}`, dựa vào việc user có trong `room_members` của room đó hay không. Bắt buộc vì mọi channel được tạo với `config: { private: true }`. |
| `0009_scheduled_cleanup.sql` | Bật extension `pg_cron`, thêm `cleanup_old_room_actions()` (xoá `room_actions` cũ hơn 7 ngày), lên lịch chạy `cleanup_old_room_actions()` + `cleanup_old_rate_limit_entries()` (đã có từ `0006`) hàng ngày lúc 03:00 UTC qua `cron.schedule()`. |

### Bảng chính

- **`rooms`**: `id`, `slug` (unique), `project_name`, `event_type` (`build`/`deploy`/`migration`/`release`), `prayer`, `title`, `description`, `status` (`waiting`/`praying`/`completed`), `incense_count`, `bell_count`, `prayer_count`, `energy` (0-100), `revision`, `created_at`, `updated_at`, `expires_at` (mặc định +24h, sảnh chung là +100 năm).
- **`room_members`**: PK `(room_id, user_id)`, `display_name`, `joined_at`.
- **`room_actions`**: PK `id` = `eventId` do **client** sinh (`crypto.randomUUID()`) — đây là cơ chế chống trùng (idempotency): insert lại cùng `id` sẽ lỗi Postgres `23505`, route handler bắt lỗi này và trả `duplicated: true` thay vì tăng counter lần 2.
- **`oracle_results`**: `id`, `room_id` (nullable), `user_id`, `tier`, `event_type`, `message`, `created_at` — lưu kết quả quẻ để `/oracle/[resultId]` tra cứu được bằng ID thật, không dựa vào query string (chống giả mạo kết quả).
- **`api_rate_limits`**: log mỗi lần gọi API theo `(user_id, endpoint, created_at)`, dùng cho rate limit chung.

## 4. RPC Functions (Postgres)

| RPC | Mục đích | File |
|---|---|---|
| `apply_room_action(p_room_id, p_action_type)` | Tăng counter phòng atomic theo loại action, trả về row `rooms` đã update. | `0002` |
| `check_room_action_rate_limit(p_room_id, p_user_id, p_min_interval_ms=250)` | true/false — user có đang spam quá nhanh trong room này không. | `0003` |
| `check_rate_limit(p_user_id, p_endpoint, p_max_requests=15, p_window_seconds=60)` | true/false — user có vượt quota chung của 1 endpoint trong sliding window không. Luôn ghi log request trước khi trả kết quả (không cho phép "chỉ tính request thành công"). | `0006` |
| `realtime_room_id_from_topic()` | Helper nội bộ, parse `room:{uuid}` topic string → uuid, dùng trong RLS policy của `realtime.messages`. | `0008` |
| `cleanup_old_room_actions()` | Xoá `room_actions` cũ hơn 7 ngày. Chạy tự động hàng ngày qua `pg_cron` (không cần gọi tay). | `0009` |
| `cleanup_old_rate_limit_entries()` | Xoá `api_rate_limits` cũ hơn 1 ngày. Chạy tự động hàng ngày qua `pg_cron`. | `0006`, lên lịch ở `0009` |

## 5. Row Level Security (RLS)

Bật RLS trên toàn bộ bảng `public`. Nguyên tắc chung:
- **Đọc (`SELECT`)**: cho phép cả `anon` và `authenticated` trên `rooms`, `oracle_results`, và 2 view liệt kê phòng/rank — vì đây là nội dung công khai, và Server Component có thể fetch trước khi có session.
- **Viết (`INSERT`/`UPDATE`)**: chỉ `authenticated`, luôn kiểm tra `auth.uid() = user_id` — không cho user giả danh người khác.
- **Không** cho phép client `UPDATE` trực tiếp `rooms.incense_count`/`bell_count`/`energy`/`revision` qua PostgREST — mọi thay đổi phải qua RPC `apply_room_action`.

### Realtime Authorization (khác RLS bảng thường)

Mọi channel Realtime trong app dùng `config: { private: true }` (xem `use-temple-room.ts`, `actions/route.ts`). Cơ chế phân quyền cho private channel **không** dùng RLS của bảng `rooms`/`room_members` — nó dùng RLS riêng trên bảng hệ thống `realtime.messages`, dựa vào hàm `realtime.topic()`. Xem `0008` để biết chi tiết. Nếu thiếu migration này, mọi lần join channel sẽ lỗi:
```
Unauthorized: You do not have permissions to read from this Channel topic: room:<uuid>
```

## 6. API Routes

Tất cả nằm dưới `src/app/api/`. Mọi route (trừ khi ghi rõ) đều: xác thực user qua `supabase.auth.getUser()` trước, sau đó kiểm tra rate limit (`enforceRateLimit`, xem mục dưới), rồi mới thực hiện logic chính.

| Route | Method | Mục đích |
|---|---|---|
| `/api/rooms` | `POST` | Tạo phòng dự án mới (`/pray` flow). Input: `projectName`, `eventType`, `prayer`, `title?`, `description?`. Rate limit: `rooms:create`, 15/phút. |
| `/api/rooms/[roomId]/join` | `POST` | Join phòng, upsert vào `room_members`. Input: `displayName`. Rate limit: `rooms:join`, 15/phút. |
| `/api/rooms/[roomId]/actions` | `POST` | Ghi 1 hành động nghi lễ (thắp hương/gõ chuông/khấn/reaction), tăng counter qua RPC, broadcast kết quả cho mọi client trong room. Input: `eventId` (uuid, client sinh), `type`, `payload`. Có **2 lớp rate limit**: generic (`rooms:actions`, 20/phút) + cooldown riêng 250ms giữa các action khác nhau trong cùng room (`check_room_action_rate_limit`). Cộng thêm idempotency qua PK `eventId`. |
| `/api/oracle` | `POST` | Rút quẻ deploy, lưu vào `oracle_results`, trả về `result.id` để redirect sang `/oracle/[resultId]`. **Không** nhận `tier`/`message` từ client — toàn bộ tính server-side bằng `drawOracle()` (`src/features/oracle/draw-oracle.ts`), tránh giả mạo kết quả qua query string. Rate limit: `oracle:draw`, 15/phút. |

### Service layer (logic chung, không phải route trực tiếp)

- `src/features/temple-room/room-service.ts`: `requireUser()`, `createRoomForUser()`, `joinRoomForUser()`, `getSystemLobbyRoom()` — dùng chung `ROOM_SUMMARY_COLUMNS`/`mapRoomRow()` để tránh lặp code map snake_case → camelCase.
- `src/features/temple-room/room-directory.ts`: `listActiveProjectRooms()`, `getProjectTopRank()` — query 2 view ở `0005`.
- `src/features/temple-room/create-room.ts`: `slugifyProjectName()`, `buildRoomSlug()`, `createRoom()`.
- `src/features/oracle/`: `types.ts` (5 tier, 9 loại event), `messages.ts` (message pool theo tier × event type), `draw-oracle.ts` (`drawOracle()` — random có trọng số, có bias "lời nguyền thứ Sáu sau 16h" theo đúng ví dụ trong doc gốc).
- `src/lib/rate-limit.ts`: `enforceRateLimit()` — helper dùng chung cho mọi route, gọi RPC `check_rate_limit`, **fail open** khi RPC lỗi (ví dụ migration chưa chạy) để không làm sập API vì lỗi hạ tầng phụ.

## 7. Vấn đề hạ tầng đã gặp (để tránh lặp lại)

- **Không thể chạy migration qua kết nối Postgres trực tiếp từ môi trường agent này**: host `db.<ref>.supabase.co:5432` chỉ resolve IPv6, môi trường dev không có route IPv6 thật ra internet (xác nhận bằng `Test-NetConnection`, lỗi "lack of resources" khi ping IPv6 bất kỳ, không riêng Supabase). Pooler Supavisor (IPv4) kết nối TCP được nhưng trả lỗi `tenant/user not found` — chưa rõ nguyên nhân (có thể do tier/region project). **Kết luận: phải chạy SQL tay qua Dashboard SQL Editor**, không tự động hoá được từ agent trong điều kiện hiện tại.
- **RLS mặc định quá chặt cho luồng anonymous-first**: các policy ban đầu ở `0001` chỉ cho `authenticated` đọc — nhưng trang chủ/oracle-result là Server Component fetch **trước** khi có session, nên luôn chạy dưới role `anon`. Phải nới ở `0007`.
- **Realtime private channel cần RLS riêng trên `realtime.messages`**, không tự động suy ra từ RLS của `rooms`/`room_members`. Dễ quên vì đây là schema hệ thống Supabase khoá lại, không thể tạo bảng/hàm mới trong `realtime` schema.

## 8. Checklist setup Supabase project mới (theo đúng thứ tự)

1. Tạo project Supabase, lấy `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, điền vào `.env`.
2. **Authentication → Providers → Anonymous Sign-Ins → Enable.**
3. SQL Editor → chạy lần lượt `supabase/migrations/0001_*.sql` → `0009_*.sql` theo đúng thứ tự số.
4. (Khuyến nghị, không bắt buộc để chạy được app) Tạo site Cloudflare Turnstile, điền `NEXT_PUBLIC_TURNSTILE_SITE_KEY` vào `.env`, và bật "Enable CAPTCHA protection" ở Supabase Dashboard (Auth → Bot and Abuse Protection) với Secret Key tương ứng — chống bot tạo hàng loạt anonymous user.
5. Reload app, kiểm tra: trang chủ hiện sảnh chung + danh sách phòng + top rank (không lỗi "chưa khởi tạo"); vào 1 phòng dự án, nhập nickname, thắp hương/gõ chuông thấy broadcast tới các tab khác; hoàn thành khấn nguyện redirect sang `/oracle/<uuid>` hiện đúng quẻ.

## 9. Việc chưa làm / giới hạn hiện tại

- `legacy/App.tsx` + `app/legacy-client.tsx` (bridge SPA cũ sang Next.js) hiện không còn được tham chiếu từ đâu sau khi trang chủ được viết lại — code chết, chưa xoá vì không được yêu cầu.
- `src/screens/AltarPage.tsx` (bản không-realtime, dùng localStorage) vẫn còn trong codebase nhưng không route nào trỏ tới; `LiveAltarPage.tsx` là bản thật đang dùng.
- CAPTCHA (mục 2) yêu cầu cấu hình Secret Key thủ công ở Supabase Dashboard — không có gì trong migration SQL tự bật được việc này, cần người vận hành làm tay theo checklist ở mục 8.

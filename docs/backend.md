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

Chia rõ 2 loại migration, nằm ở 2 thư mục riêng vì bản chất và tần suất chạy khác nhau:

- **`supabase/migrations/schema/`** — DDL: tạo bảng, RPC, RLS policy, view, extension. Chỉ cần chạy **một lần** khi setup project mới hoặc sau khi clear DB — không cần chạy lại mỗi lần dev, dù các file đều idempotent (`create or replace`, `if not exists`) nên chạy lại vẫn an toàn. Gọi tay bằng `npm run db:migrate`.
- **`supabase/migrations/seed/`** — dữ liệu cần tồn tại để app chạy đúng (hiện tại: sảnh chung `sanh-chung`). Viết idempotent (`insert ... where not exists`), **tự động chạy mỗi lần** `npm run dev`/`npm run build` (qua hook `predev`/`prebuild`) — nếu ai lỡ xoá row seed trong lúc test, nó tự được tạo lại ở lần dev tiếp theo mà không cần nhớ chạy gì thủ công.

### Tự động hoá

`scripts/lib/run-sql-directory.mjs` là runner chung, dùng bởi cả `scripts/migrate.mjs` (đọc `schema/`) và `scripts/seed.mjs` (đọc `seed/`). Cả 2 kết nối bằng `DATABASE_URL` (connection string Postgres trực tiếp — **khác** `NEXT_PUBLIC_SUPABASE_URL`, xem `.env.example`) và **không bao giờ làm fail** `npm run dev`/`build` dù thiếu env var, mất kết nối, hay 1 file SQL lỗi — chỉ log cảnh báo rồi tiếp tục (xem mục 7 vì sao môi trường dev có thể không kết nối được).

| Lệnh | Chạy khi nào | Đọc thư mục |
|---|---|---|
| `npm run db:migrate` | Gọi tay — sau khi thêm file schema mới, hoặc setup project mới/sau khi clear DB. | `schema/` |
| `npm run db:seed` | Tự động mỗi lần `npm run dev`/`npm run build` (qua `predev`/`prebuild`), hoặc gọi tay. | `seed/` |

Nếu `DATABASE_URL` không set hoặc kết nối thất bại: cả 2 lệnh tự bỏ qua, không có gì hỏng — chạy tay qua Supabase Dashboard → SQL Editor như bình thường (copy từng file trong `schema/` rồi `seed/`, theo đúng thứ tự số trong mỗi thư mục).

### An toàn khi deploy (Vercel)

`npm run db:seed` tự chạy trên **mọi** environment kể cả production (qua `prebuild`) — chủ đích, vì file seed chỉ `insert ... where not exists`, chạy lại vô hại. Ngược lại, `npm run db:migrate` (DDL/schema) **không** nằm trong `predev`/`prebuild` — chỉ chạy khi gọi tay. Ngoài ra `scripts/migrate.mjs` có 1 lớp phòng vệ chủ động: nếu phát hiện `VERCEL_ENV=production` (biến Vercel tự set, không cần bạn khai báo) mà không có `ALLOW_PROD_MIGRATE=true` được set rõ ràng, script sẽ **từ chối chạy** (log cảnh báo, exit 0 — không làm fail build) — đảm bảo dù sau này có ai vô tình thêm `db:migrate` vào build hook, production cũng không tự áp schema change ngoài ý muốn. Migration schema luôn phải chạy tay từ máy dev, nhắm đúng `DATABASE_URL` mong muốn.

### `supabase/migrations/schema/` (chạy 1 lần / khi cần)

| File | Nội dung |
|---|---|
| `schema/0001_temple_core_schema.sql` | Bảng `rooms`, `room_members`, `room_actions`, `oracle_results`. Trigger `updated_at`. RLS ban đầu (đã bị sửa lại một phần ở `0007`). |
| `schema/0002_apply_room_action_rpc.sql` | RPC `apply_room_action(room_id, action_type)` — tăng counter atomically bằng 1 câu `UPDATE ... SET col = col + delta`, clamp `energy` 0-100, luôn `revision + 1`. |
| `schema/0003_room_action_rate_limit.sql` | RPC `check_room_action_rate_limit(room_id, user_id, min_interval_ms=250)` — chặn user gửi quá nhanh (spam nhiều eventId khác nhau liên tục) trong cùng 1 room. |
| `schema/0005_active_rooms_and_top_rank.sql` | View `active_project_rooms` (phòng dự án chưa hết hạn, loại trừ sảnh chung) và `project_top_rank` (tổng hợp `SUM` theo `project_name`). Cả 2 dùng `security_invoker = true` để tôn trọng RLS đúng theo role gọi, không theo owner view. |
| `schema/0006_generic_api_rate_limit.sql` | Bảng `api_rate_limits` + RPC `check_rate_limit(user_id, endpoint, max_requests=15, window_seconds=60)` — rate limit chung cho mọi API endpoint theo sliding window. |
| `schema/0007_allow_anon_read_rooms.sql` | **Fix quan trọng**: mở `SELECT` trên `rooms`, `oracle_results`, và 2 view ở `0005` cho cả role `anon` (không chỉ `authenticated`). Không có file này, trang chủ/oracle-result sẽ luôn báo "không tìm thấy" dù dữ liệu tồn tại, vì Server Component fetch lần đầu chạy trước khi có session. |
| `schema/0008_realtime_room_channel_authorization.sql` | RLS trên `realtime.messages` cho phép broadcast/presence trên topic `room:{roomId}`, dựa vào việc user có trong `room_members` của room đó hay không. Bắt buộc vì mọi channel được tạo với `config: { private: true }`. |
| `schema/0009_scheduled_cleanup.sql` | Bật extension `pg_cron`, thêm `cleanup_old_room_actions()` (xoá `room_actions` cũ hơn 7 ngày), lên lịch chạy `cleanup_old_room_actions()` + `cleanup_old_rate_limit_entries()` (đã có từ `0006`) hàng ngày lúc 03:00 UTC qua `cron.schedule()`. |
| `schema/0010_fix_rooms_update_policy.sql` | **Fix quan trọng**: `0001` chưa từng có policy `UPDATE` cho `rooms` — với RLS bật, không có policy nghĩa là chặn hoàn toàn, không phải cho phép ngầm. `apply_room_action()` không phải `security definer` nên `UPDATE` bên trong nó bị RLS chặn âm thầm (match 0 dòng), khiến RPC luôn raise `ROOM_NOT_FOUND` dù room có tồn tại, và route trả `ROOM_UPDATE_FAILED` ra client. Thêm policy cho phép member của room (`room_members`) update chính room đó. |
| `schema/0011_offering_counter.sql` | Thêm `rooms.offering_count`, bảng `room_offerings` (log riêng từng lần dâng lễ vật, whitelist qua `check` constraint), nâng `apply_room_action` lên chữ ký 3 tham số (`p_offering_id text default null`) — **drop hàm 2 tham số cũ trước khi tạo hàm mới** (đổi số tham số trong Postgres tạo overload mới, không thay thế hàm cũ, nếu không drop trước sẽ có 2 bản định nghĩa lệch nhau tồn tại song song). Cập nhật `active_project_rooms`/`project_top_rank` (từ `0005`) để cộng `offering_count`/`total_offerings` — dùng `drop view` + `create view` (không phải `create or replace view`) vì Postgres từ chối đổi/xoá cột của view đã tồn tại. |
| `schema/0012_clear_incense_action.sql` | Thêm `'clear_incense'` vào whitelist `room_actions.action_type` — cho phép hành động "Dọn bát hương" persist bền (không tự khôi phục khi người khác reload/reconnect). |
| `schema/0013_seat_slots.sql` | Chỗ ngồi chibi avatar (xem §10 chi tiết): `room_members.avatar_id`/`seat_slot`, whitelist + bounds qua `check` constraint, unique partial index chống trùng ghế, RPC `claim_seat_slot`/`release_seat_slot`. |
| `schema/0014_halls_and_deities.sql` | Bảng `halls` (Điện — vẫn ở DB), cột `rooms.hall_id`/`primary_deity_id`/`support_deity_ids`. **Lưu ý**: file này ban đầu cũng tạo bảng `deities`, nhưng bảng đó đã bị `0016` xoá và revert sang hardcode — xem §11. Cũng sửa lại `active_project_rooms` để cấp lại quyền `anon` đã bị mất từ `0011` (xem ghi chú trong file). |
| `schema/0016_deities_hardcode_migration.sql` | **Revert theo quyết định sản phẩm** ("thần không cần BE đâu, hardcode là được" — xem §11): xoá bảng `deities` + trigger cũ dựa trên FK, đổi kiểu `rooms.primary_deity_id` (`uuid`→`text`) và `support_deity_ids` (`uuid[]`→`text[]`) để lưu **slug thần** thay vì id bảng. Tạo lại trigger `check_room_deities_belong_to_hall` kiểm tra theo whitelist slug hardcode trong SQL (phải đồng bộ tay với `deity-catalog.ts`). Phải `drop view` `active_project_rooms` trước khi đổi kiểu cột (Postgres không cho đổi kiểu cột đang được 1 view tham chiếu), rồi tạo lại view + re-grant `anon`+`authenticated`. |
| `schema/0017_expand_halls_and_deities.sql` | Mở rộng lên đủ 6 Điện, thêm Trí Tuệ/Thiên Vân/Minh Giám và cập nhật trigger whitelist lên 18 thần. Idempotent qua `on conflict (slug) do update` và `create or replace function`. |

### `supabase/migrations/seed/` (tự động chạy mỗi lần dev/build)

| File | Nội dung |
|---|---|
| `seed/0001_seed_system_lobby_room.sql` | Seed 1 row cố định `slug='sanh-chung'` — sảnh chung dùng chung cho mọi visitor ở trang chủ. Idempotent (`INSERT ... WHERE NOT EXISTS`), nên tự chạy lại mỗi lần dev/build không sao — nếu row đã tồn tại thì không làm gì. |
| `seed/0002_seed_halls_and_deities.sql` | Seed 6 Điện (`khai-trien`, `hop-nhat`, `du-hai`, `tri-tue`, `thien-van`, `minh-giam`). Idempotent qua kiểm tra `slug` đã tồn tại chưa. Không còn seed Thần (đã hardcode, xem §11). |

### Bảng chính

- **`rooms`**: `id`, `slug` (unique), `project_name`, `event_type` (`build`/`deploy`/`migration`/`release`), `prayer`, `title`, `description`, `status` (`waiting`/`praying`/`completed`), `incense_count`, `bell_count`, `prayer_count`, `offering_count`, `energy` (0-100), `revision`, `created_at`, `updated_at`, `expires_at` (mặc định +24h, sảnh chung là +100 năm), `hall_id` (nullable, FK `halls`), `primary_deity_id` (nullable, **`text`** — slug thần từ catalog hardcode, không phải FK), `support_deity_ids` (**`text[]`**, tối đa 2 — xem §11).
- **`halls`** (Điện): `id`, `slug` (unique), `name`, `description`, `sort_order`. Catalog đọc-công-khai, vẫn ở DB (danh sách Điện có thể mở rộng không cần deploy code). Không có policy write cho client, chỉ migration ghi được.
- **`room_members`**: PK `(room_id, user_id)`, `display_name`, `joined_at`, `avatar_id` (nullable, whitelist qua `check` constraint), `seat_slot` (nullable, 0-7, unique per phòng qua partial index — chỗ ngồi chibi avatar, xem §10).
- **`room_actions`**: PK `id` = `eventId` do **client** sinh (`crypto.randomUUID()`) — đây là cơ chế chống trùng (idempotency): insert lại cùng `id` sẽ lỗi Postgres `23505`, route handler bắt lỗi này và trả `duplicated: true` thay vì tăng counter lần 2.
- **`room_offerings`**: log chi tiết mỗi lần "dâng lễ vật" — PK `id` = cùng `eventId` với `room_actions` tương ứng (cùng cơ chế chống trùng qua `23505`), `room_id`, `user_id`, `offering_id` (whitelist qua `check` constraint: `laptop`/`keyboard`/`coffee`/`rubber_duck`/`config_scroll`/`ci_lantern`, phải đồng bộ với `src/features/offerings/offering-catalog.ts`). Tách riêng khỏi `room_actions` (dù về bản chất dâng lễ vật vẫn là 1 `action_type='reaction'` với `payload.offering=<id>`) để có thể `GROUP BY offering_id` tính "lễ vật phổ biến nhất" mà không phải parse JSON `payload` của `room_actions`.
- **`oracle_results`**: `id`, `room_id` (nullable), `user_id`, `tier`, `event_type`, `message`, `created_at` — lưu kết quả quẻ để `/oracle/[resultId]` tra cứu được bằng ID thật, không dựa vào query string (chống giả mạo kết quả).

### Oracle result UI (`/oracle/[resultId]`)

- `src/app/oracle/[resultId]/page.tsx` (Server Component): fetch `oracle_results` theo `resultId`, join `rooms` để lấy `project_name` hiển thị tiêu đề. `notFound()` nếu không tìm thấy — không có fallback "quẻ giả" hiển thị khi id sai.
- `src/app/oracle/[resultId]/OracleResultView.tsx` (Client Component): render kết quả. `TIER_CARD_ASSETS` map `OracleTier` → 1 trong 5 ảnh minh hoạ (`public/oracle-cards-v1/oracle-card-1.png` … `oracle-card-5.png`, xem `docs/generated-image-assets.md` §Oracle tier mapping). Chữ quẻ/lời phán (`message`) vẫn render bằng HTML/CSS thường (`<p>`), không nằm trong ảnh — tránh vấn đề chữ bị vẽ cứng vào raster khó đổi/khó đọc trên màn nhỏ.
- `public/oracle-cards-v1/oracle-card-6.png` (card-back, "Indigo circuit talisman") **đã có asset nhưng chưa được tham chiếu ở đâu trong code** — dự phòng cho hiệu ứng lật thẻ (xem thẻ mặt sau trước, lật sang mặt kết quả) dự kiến làm sau, chưa phải phần đang hoạt động.
- **Còn thiếu (chưa làm)**: `generateMetadata()` của trang này chỉ có title/description tĩnh, không sinh OpenGraph image động theo tier (khác với `/temple/[roomId]` đã làm điều này cho phòng — xem `temple-og-preview-v1.png`). Nếu dán link `/oracle/<uuid>` vào Slack/Discord, card preview sẽ không hiện đúng ảnh quẻ/tier tương ứng.
- **`api_rate_limits`**: log mỗi lần gọi API theo `(user_id, endpoint, created_at)`, dùng cho rate limit chung.

## 4. RPC Functions (Postgres)

| RPC | Mục đích | File |
|---|---|---|
| `apply_room_action(p_room_id, p_action_type, p_offering_id=null)` | Tăng counter phòng atomic theo loại action, trả về row `rooms` đã update. Tham số thứ 3 (`0011`): nếu `p_action_type='reaction'` và `p_offering_id` không null, tăng thêm `offering_count` (không chỉ `energy` như reaction thường) — kiểm tra whitelist ngay trong hàm, raise exception nếu id không hợp lệ. | `0002`, `0011` |
| `check_room_action_rate_limit(p_room_id, p_user_id, p_min_interval_ms=250)` | true/false — user có đang spam quá nhanh trong room này không. | `0003` |
| `check_rate_limit(p_user_id, p_endpoint, p_max_requests=15, p_window_seconds=60)` | true/false — user có vượt quota chung của 1 endpoint trong sliding window không. Luôn ghi log request trước khi trả kết quả (không cho phép "chỉ tính request thành công"). | `0006` |
| `realtime_room_id_from_topic()` | Helper nội bộ, parse `room:{uuid}` topic string → uuid, dùng trong RLS policy của `realtime.messages`. | `0008` |
| `cleanup_old_room_actions()` | Xoá `room_actions` cũ hơn 7 ngày. Chạy tự động hàng ngày qua `pg_cron` (không cần gọi tay). | `0009` |
| `cleanup_old_rate_limit_entries()` | Xoá `api_rate_limits` cũ hơn 1 ngày. Chạy tự động hàng ngày qua `pg_cron`. | `0006`, lên lịch ở `0009` |
| `claim_seat_slot(p_room_id, p_user_id, p_seat_slot, p_max_slots=8)` | Giành/đổi chỗ ngồi chibi avatar, atomic — giải phóng ghế cũ của user rồi thử giành ghế mới trong 1 câu `UPDATE ... WHERE ... AND NOT EXISTS (...)`, dựa vào row lock của Postgres để 2 request đồng thời không thể cùng "thắng" 1 ghế (cùng nguyên tắc `apply_room_action`). Trả về `(success, reason)` — `reason` là `'INVALID_SLOT'` hoặc `'SLOT_TAKEN'` khi thất bại. | `0013` |
| `release_seat_slot(p_room_id, p_user_id)` | Đứng dậy — xoá `seat_slot` và `avatar_id` của user trong phòng. Gọi khi rời phòng chủ động (best-effort, xem §10). | `0013` |
| `check_room_deities_belong_to_hall()` | Trigger function (`before insert or update` trên `rooms`) — không phải RPC gọi trực tiếp từ client, nhưng đóng vai trò tương tự (validation ở tầng DB). Chặn insert/update nếu `primary_deity_id`/`support_deity_ids` (giờ là **slug thần dạng text**, không phải FK uuid) không thuộc `hall_id` của room theo whitelist hardcode trong SQL, hoặc nếu có thần mà `hall_id` là null. Lớp phòng vệ thứ 2 sau `validateDeitySelection()` ở tầng route (xem §11). | `0017` (mở rộng bản `0016`, vốn viết lại từ `0014`) |

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
| `/api/rooms` | `POST` | Tạo phòng dự án mới (`/pray` flow). Input: `projectName`, `eventType`, `prayer`, `title?`, `description?`, `hallId?`, `primaryDeityId?` (slug thần, xem §11), `supportDeityIds?`. **Không bắt buộc chọn Điện** — nếu bỏ trống `hallId` (không gửi field, không phải gửi `null`), server tự gán Điện mặc định (§11). Nếu client có gửi `hallId`, validate qua `validateDeitySelection()` trước khi insert (400 nếu sai). Rate limit: `rooms:create`, 15/phút. |
| `/api/rooms/[roomId]/join` | `POST` | Join phòng, upsert vào `room_members`. Input: `displayName`. Rate limit: `rooms:join`, 15/phút. |
| `/api/rooms/[roomId]/actions` | `POST` | Ghi 1 hành động nghi lễ (thắp hương/gõ chuông/khấn/reaction), tăng counter qua RPC, broadcast kết quả cho mọi client trong room. Input: `eventId` (uuid, client sinh), `type`, `payload`. Có **2 lớp rate limit chung**: generic (`rooms:actions`, 20/phút) + cooldown riêng 250ms giữa các action khác nhau trong cùng room (`check_room_action_rate_limit`). Cộng thêm idempotency qua PK `eventId`. **"Dâng lễ vật"** (`type='reaction'` + `payload.offering=<id>`): id được validate server-side theo whitelist (`isValidOfferingId`, 400 `INVALID_OFFERING_ID` nếu sai), có thêm rate limit riêng `rooms:offer` (10 lần/10s, tách khỏi `rooms:actions`), và ghi thêm 1 row vào `room_offerings` (cùng `eventId`, không hoàn toàn atomic với RPC nhưng an toàn khi retry nhờ PK trùng). |
| `/api/oracle` | `POST` | Rút quẻ deploy, lưu vào `oracle_results`, trả về `result.id` để redirect sang `/oracle/[resultId]`. **Không** nhận `tier`/`message` từ client — toàn bộ tính server-side bằng `drawOracle()` (`src/features/oracle/draw-oracle.ts`), tránh giả mạo kết quả qua query string. Rate limit: `oracle:draw`, 15/phút. |
| `/api/rooms/[roomId]/seat` | `POST`/`DELETE` | Giành/đổi chỗ ngồi chibi avatar (`POST`, gọi RPC `claim_seat_slot`, 409 nếu ghế đã bị chiếm) hoặc đứng dậy (`DELETE`, gọi `release_seat_slot`). Yêu cầu đã là `room_members` (đã join phòng) — 403 `NOT_A_ROOM_MEMBER` nếu chưa. Rate limit riêng: `rooms:seat`, 10 lần/10s. Xem §10. |
| `/api/halls` | `GET` | Liệt kê toàn bộ Điện kèm danh sách Thần — cho UI chọn Điện/Thần khi tạo phòng (xem §11). Public, không auth/rate-limit (chỉ đọc catalog tĩnh, không có input từ client). |
| `/api/rooms/[roomId]/hall` | `PATCH` | Đổi Điện (+ Chủ thần/Hộ thần) cho phòng đã tạo — dành cho action "chuyển Điện" ở Header (xem §11). Input: `hallId` (bắt buộc, uuid thật), `primaryDeityId?`/`supportDeityIds?` (slug thần từ catalog hardcode, không phải uuid). Yêu cầu đã là `room_members`. Validate qua `validateDeitySelection()` (400 nếu sai) + trigger DB (400 `HALL_SWITCH_REJECTED` nếu 2 lớp lệch nhau). Rate limit riêng: `rooms:switch-hall`, 10 lần/60s. |

### Service layer (logic chung, không phải route trực tiếp)

- `src/features/temple-room/room-service.ts`: `requireUser()`, `createRoomForUser()`, `joinRoomForUser()`, `getSystemLobbyRoom()` — dùng chung `ROOM_SUMMARY_COLUMNS`/`mapRoomRow()` để tránh lặp code map snake_case → camelCase.
- `src/features/temple-room/room-directory.ts`: `listActiveProjectRooms()`, `getProjectTopRank()` — query 2 view ở `0005`.
- `src/features/temple-room/create-room.ts`: `slugifyProjectName()`, `buildRoomSlug()`, `createRoom()`.
- `src/features/oracle/`: `types.ts` (5 tier, 9 loại event), `messages.ts` (message pool theo tier × event type), `draw-oracle.ts` (`drawOracle()` — random có trọng số, có bias "lời nguyền thứ Sáu sau 16h" theo đúng ví dụ trong doc gốc).
- `src/features/offerings/offering-catalog.ts`: `DEVELOPER_OFFERINGS` (6 lễ vật cố định) + `isValidOfferingId()` — module không phải `"use client"`, dùng chung bởi cả `OfferingTray.tsx` (client, hiện UI) và `actions/route.ts` (server, validate whitelist trước khi ghi DB). Whitelist ở đây **phải khớp** `check` constraint của `room_offerings.offering_id` trong `0011`.
- `src/features/halls/deity-catalog.ts`, `src/features/halls/hall-content-catalog.ts`: catalog hardcode cho Thần + nội dung theo Điện (xem §11) — cùng pattern `offering-catalog.ts`, không phải `"use client"`.
- `src/lib/rate-limit.ts`: `enforceRateLimit()` — helper dùng chung cho mọi route, gọi RPC `check_rate_limit`, **fail open** khi RPC lỗi (ví dụ migration chưa chạy) để không làm sập API vì lỗi hạ tầng phụ.

## 7. Vấn đề hạ tầng đã gặp (để tránh lặp lại)

- **~~Không thể chạy migration qua kết nối Postgres trực tiếp từ môi trường agent này~~ — đã giải quyết được từ máy dev thật (không phải môi trường agent)**: host `db.<ref>.supabase.co:5432` chỉ resolve IPv6 và môi trường agent không route được IPv6 ra internet — vẫn đúng, agent không tự chạy migration được. Nhưng từ **máy dev của người dùng** (có network bình thường), pooler Supavisor connect thành công với connection string đúng: `postgresql://postgres.<project-ref>:<url-encoded-password>@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`. Lưu ý 2 điểm dễ sai:
  - **Region + số hiệu pooler (`aws-0` vs `aws-1`) không đoán được từ project ref** — phải copy chính xác từ Supabase Dashboard → Connect → "Transaction pooler". Với project hiện tại là `aws-1-ap-south-1`, không phải `aws-0-ap-southeast-1` như agent từng đoán thử (dẫn đến lỗi `tenant/user not found` — hoá ra là sai region/pooler-node, không phải project chưa provision Supavisor như agent từng nghi ngờ).
  - **`.env` không hỗ trợ cú pháp template `{VAR}`** để nội suy biến khác trong cùng file (đó là tính năng của Docker Compose/1 số framework, không phải chuẩn dotenv). Phải điền password thật trực tiếp vào `DATABASE_URL`, và **percent-encode ký tự đặc biệt** (ví dụ `@` → `%40`) vì nó nằm trong URL.
- **RLS mặc định quá chặt cho luồng anonymous-first**: các policy ban đầu ở `0001` chỉ cho `authenticated` đọc — nhưng trang chủ/oracle-result là Server Component fetch **trước** khi có session, nên luôn chạy dưới role `anon`. Phải nới ở `0007`.
- **Realtime private channel cần RLS riêng trên `realtime.messages`**, không tự động suy ra từ RLS của `rooms`/`room_members`. Dễ quên vì đây là schema hệ thống Supabase khoá lại, không thể tạo bảng/hàm mới trong `realtime` schema.
- **RLS: thiếu policy cho 1 command = chặn hoàn toàn command đó, không phải "cho phép ngầm"**. Đây là mẫu lỗi đã lặp lại nhiều lần (anon SELECT ở `0007`, Realtime ở `0008`, và `UPDATE` trên `rooms` ở `0010`) — mỗi khi thêm 1 đường ghi/đọc dữ liệu mới (RPC, route, hay Realtime), phải tự hỏi: "role nào sẽ thực thi câu lệnh này, và bảng đó đã có policy cho đúng command + đúng role đó chưa?". RPC không có `security definer` chạy dưới quyền caller, nên vẫn bị RLS chi phối như PostgREST bình thường.
- **Migration đổi tên policy phải `drop` cả tên cũ VÀ tên mới, không chỉ tên cũ** — nếu file migration từng được chạy 1 lần rồi (ví dụ qua SQL Editor tay), lần chạy lại sau (qua `db:migrate`) sẽ thấy policy tên mới đã tồn tại từ lần trước, `create policy` lỗi vì trùng tên. `0007` đã gặp lỗi này và được sửa để tự-idempotent (drop cả 2 tên trước khi create).
- **`create or replace view` không cho đổi/xoá/chèn-giữa cột output của view đã tồn tại** — Postgres coi đây là đổi "shape" của view, không phải chỉ đổi nội dung query. 2 hệ quả gặp thực tế khi làm `0011` (thêm `offering_count` vào 2 view có sẵn từ `0005`): (1) chèn cột mới **vào giữa** danh sách `select` bị hiểu nhầm thành "đổi tên" cột ngay sau nó → lỗi `cannot change name of view column`; (2) sau khi `0011` đã chạy 1 lần (thêm cột thành công), chạy lại `0005` (không đổi gì, đúng như file gốc) sẽ bị lỗi `cannot drop columns from view` — vì `0005` không biết cột mới đã tồn tại, coi như đang "xoá" nó. Sửa bằng 2 nguyên tắc: **luôn thêm cột mới ở cuối** danh sách `select`, và **dùng `drop view if exists` + `create view` thay cho `create or replace view`** cho bất kỳ view có thể bị migration sau này mở rộng thêm cột — áp dụng cho cả `0005` và `0011` để cả 2 file an toàn khi chạy lại theo bất kỳ thứ tự nào.

## 8. Checklist setup Supabase project mới (theo đúng thứ tự)

1. Tạo project Supabase, lấy `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, điền vào `.env`.
2. **Authentication → Providers → Anonymous Sign-Ins → Enable.**
3. Chạy **schema** (1 lần, DDL): điền `DATABASE_URL` vào `.env` rồi `npm run db:migrate`, hoặc nếu không kết nối được (xem mục 7), chạy tay: SQL Editor → chạy lần lượt `supabase/migrations/schema/0001_*.sql` → `schema/0013_*.sql` theo đúng thứ tự số.
4. **Seed** không cần làm gì thêm ở bước setup — `npm run dev`/`npm run build` sẽ tự chạy `supabase/migrations/seed/*.sql` mỗi lần (miễn `DATABASE_URL` vẫn còn trong `.env`). Nếu không có `DATABASE_URL`, chạy tay 1 lần: SQL Editor → `supabase/migrations/seed/0001_*.sql`.
5. (Khuyến nghị, không bắt buộc để chạy được app) Tạo site Cloudflare Turnstile, điền `NEXT_PUBLIC_TURNSTILE_SITE_KEY` vào `.env`, và bật "Enable CAPTCHA protection" ở Supabase Dashboard (Auth → Bot and Abuse Protection) với Secret Key tương ứng — chống bot tạo hàng loạt anonymous user.
6. Reload app, kiểm tra: trang chủ hiện sảnh chung + danh sách phòng + top rank (không lỗi "chưa khởi tạo"); vào 1 phòng dự án, nhập nickname, thắp hương/gõ chuông thấy broadcast tới các tab khác; hoàn thành khấn nguyện redirect sang `/oracle/<uuid>` hiện đúng quẻ.

**Sau khi clear DB / reset project**: chạy lại từ bước 3 (schema trước, seed sau — seed cần bảng `rooms` đã tồn tại).
**Khi thêm 1 file schema mới sau này**: chạy `npm run db:migrate` tay 1 lần (không tự động, vì đây là thay đổi cấu trúc, không phải dữ liệu runtime).

## 9. Việc chưa làm / giới hạn hiện tại

- `legacy/App.tsx` + `app/legacy-client.tsx` (bridge SPA cũ sang Next.js) hiện không còn được tham chiếu từ đâu sau khi trang chủ được viết lại — code chết, chưa xoá vì không được yêu cầu.
- `src/screens/AltarPage.tsx` (bản không-realtime, dùng localStorage) vẫn còn trong codebase nhưng không route nào trỏ tới; `LiveAltarPage.tsx` là bản thật đang dùng.
- CAPTCHA (mục 2) yêu cầu cấu hình Secret Key thủ công ở Supabase Dashboard — không có gì trong migration SQL tự bật được việc này, cần người vận hành làm tay theo checklist ở mục 8.
- **Dâng lễ vật**: backend đã có `offering_count`/`room_offerings`/whitelist/rate-limit riêng (`0011`), nhưng **UI hiện chưa hiển thị** `room.offeringCount` hay thống kê "lễ vật phổ biến nhất" ở đâu cả — `LiveAltarPage.tsx` chỉ hiện toast "Lễ vật gần nhất: ..." tạm thời, không đọc `room.offeringCount` hay query `room_offerings` để tổng hợp. Cũng chưa có UI hiển thị `total_offerings` trong bảng Top Rank ở trang chủ dù view đã trả về cột này.
- **Chỗ ngồi chibi avatar** (§10): backend (migration, RPC, route, Presence type) đã implement và test đầy đủ, nhưng **hoàn toàn chưa có UI** — không có avatar picker, không có sân đền hiển thị slot, không có character art thật (catalog hiện chỉ có 6 id placeholder `dev_1`..`dev_6` trỏ tới đường dẫn ảnh chưa tồn tại). `LiveAltarPage.tsx`/`CenserSection.tsx` chưa gọi `/api/rooms/[roomId]/seat` ở đâu cả.
- **Hệ thống Điện/Thần** (§11): backend và UI đổi Điện đã được nối đầy đủ. Header gọi `GET /api/halls` và `PATCH .../hall`; scene hiển thị ba sprite thần tương ứng. Catalog hiện có đủ 6 Điện/18 thần cùng nội dung nghi lễ-cúng dường. Chưa có hệ thống multi-currency energy hay state machine 5-phase; phiên bản hiện tại vẫn tái dùng `rooms.energy`/`rooms.status`.

## 11. Hệ thống Điện (Hall) / Thần (Deity)

Xem `docs/than.md` cho toàn bộ ý tưởng gốc — mục này chỉ ghi lại phần **đã thực sự implement** ở phiên bản hiện tại (backend và UI đổi Điện/Thần đã được nối — xem mục 9). Phạm vi cắt giảm/thiết kế có chủ đích so với doc gốc:

- Đã seed đủ **6 Điện** và hardcode 18 thần; mỗi Điện có đúng ba thần.
- **Không** xây hệ thống multi-currency (Build Energy/Stability/Community riêng biệt từng thanh) — tái dùng `rooms.energy` (1 thanh, 0-100) đã có sẵn.
- **Không** xây state machine 5-phase (Chuẩn bị → Cúng dường → Thỉnh thần → Ban kết quả → Ghi công đức) — tái dùng `rooms.status` (`waiting`/`praying`/`completed`) đã có sẵn.
- **Điện (Hall) ở DB, Thần (Deity) + nội dung theo Điện (rituals/offerings) hardcode trong code** — quyết định sản phẩm rõ ràng: "thần không cần BE đâu, hardcode là được". Bản đầu (`schema/0014`) từng làm cả 2 là bảng DB (kèm FK + trigger), sau đó **revert Thần về hardcode** ở `schema/0016` (xem "Lịch sử revert" dưới).

### Luồng chọn Điện (theo `than.md` §4 bản đã sửa)

**Tạo phòng không bắt buộc chọn Điện.** Form tạo phòng chỉ cần `projectName`/`eventType`/`prayer` — nếu client không gửi `hallId` (không có field, khác với gửi `hallId: null` một cách chủ ý), `createRoomForUser()` (`room-service.ts`) tự gọi `getDefaultHall()` (Điện có `sort_order` thấp nhất — hiện là `khai-trien`) và gán luôn Điện đó + thần đầu tiên (`sortOrder` thấp nhất trong catalog hardcode, theo Điện đó) làm Chủ thần, để phòng luôn có Điện hiển thị ngay từ đầu. Nếu chưa chạy seed (không có Điện nào trong DB), phòng vẫn được tạo bình thường với `hall_id = null` — hệ thống Điện là tính năng cộng thêm, không phải điều kiện bắt buộc để `/pray` hoạt động.

**Đổi Điện sau khi đã tạo phòng** qua route `PATCH /api/rooms/[roomId]/hall` — dành cho action "chuyển Điện" dự kiến đặt ở Header phòng. Route này **luôn yêu cầu `hallId`** (không có khái niệm "bỏ Điện" — ngoại lệ duy nhất là sảnh chung, được seed trực tiếp bằng SQL, không đi qua route nào).

### Mô hình dữ liệu

- **`halls` (Điện) — bảng DB thật.** `id`, `slug` (unique), `name`, `description`, `sort_order`. Danh sách Điện dự kiến mở rộng theo thời gian mà không cần deploy code, nên vẫn ở DB.
- **Thần (Deity) — hardcode, không có bảng.** `src/features/halls/deity-catalog.ts`: constant `DEITIES` (9 thần cố định, mỗi thần có `id` (chỉ để trace/log, không dùng làm khoá), `slug` (giá trị thật sự lưu vào `rooms.primary_deity_id`/`support_deity_ids`), `hallSlug` (liên kết tới Điện bằng **slug**, không phải id — vì Điện vẫn còn ở DB, cần cách nối 2 nguồn dữ liệu khác nhau), `name`, `toolName`, `description`, `imageKey` (placeholder text, chưa có ảnh thật)) + `isValidDeitySlug()`, `getDeityBySlug()`, `getDeitiesForHall(hallSlug)`. Cùng pattern với `offering-catalog.ts`/`avatar-catalog.ts`.
- **Nội dung theo Điện (Loại nghi lễ + Cơ chế cúng dường riêng) — cũng hardcode.** `src/features/halls/hall-content-catalog.ts`: `HALL_RITUALS` (12 nghi lễ, 4/Điện — vd Điện Khai Triển: "Build production", "Deploy release"...) + `HALL_OFFERINGS` (12 hành động cúng dường riêng, 4/Điện — vd "Dâng Preview", "Dâng .env"...), mỗi entry có `id` riêng để trace + `imageKey` placeholder. `getRitualsForHall(hallSlug)`/`getOfferingsForHall(hallSlug)`. **Khác** `room_offerings` (bảng log lễ vật thật đã dâng, `0011`) — đây chỉ là *catalog nội dung hiển thị*, chưa có bảng log riêng cho việc dùng các action này (chưa cần, chưa có UI gọi tới).
- **`rooms.hall_id`/`primary_deity_id`/`support_deity_ids`**: `hall_id` là uuid thật (FK `halls`). `primary_deity_id`/`support_deity_ids` giờ là **`text`/`text[]`** lưu **slug thần** từ catalog hardcode (ví dụ `'vercel'`), không phải uuid tham chiếu bảng nào — vì không còn bảng `deities`.

`hall-catalog-service.ts` là tầng nối 2 nguồn: đọc `halls` từ DB, rồi gắn `deities`/`rituals`/`offerings` vào mỗi Hall bằng cách khớp `hall.slug` với catalog hardcode (`getDeitiesForHall`/`getRitualsForHall`/`getOfferingsForHall`). Khi đổi `rooms.hall_id` (qua route `PATCH .../hall`), nội dung liên quan (rituals/offerings hiển thị cho Điện đó) tự đổi theo ngay khi FE query lại Hall mới — không cần bước "chuyển nội dung" riêng.

### Validate 2 lớp (giống pattern race-condition ở §10)

1. **Tầng route** (`validateDeitySelection()` trong `hall-catalog-service.ts`, gọi từ `POST /api/rooms` khi client có chọn Điện, và luôn gọi từ `PATCH /api/rooms/[roomId]/hall`): Hall được kiểm tra tồn tại qua query DB; slug thần được kiểm tra qua `isValidDeitySlug()` + so khớp `hallSlug` trong catalog hardcode, không query DB. Trả lỗi 400 rõ ràng (`HALL_NOT_FOUND`, `UNKNOWN_DEITY_SLUG`, `PRIMARY_DEITY_NOT_IN_HALL`, `SUPPORT_DEITY_NOT_IN_HALL`, `TOO_MANY_SUPPORT_DEITIES`, `PRIMARY_DEITY_DUPLICATED_IN_SUPPORT`, `DEITIES_WITHOUT_HALL`). Khi tạo phòng mà không chọn Điện (auto-default), bước này **được bỏ qua** vì `getDefaultHall()` tự đảm bảo Điện/thần trả về luôn hợp lệ.
2. **Tầng DB** (trigger `check_room_deities_belong_to_hall`, mở rộng ở `0017`, chạy `before insert or update` trên `rooms`, cộng thêm `check` constraint giới hạn tối đa 2 hộ thần): phòng vệ cuối cùng, đảm bảo dữ liệu không thể sai dù có đường ghi khác bỏ qua tầng route. Vì không còn bảng `deities`, trigger kiểm tra theo **whitelist slug hardcode ngay trong SQL** (`jsonb` map slug→hall_slug) — **phải đồng bộ tay với `deity-catalog.ts`** mỗi khi thêm/xoá/đổi thần, viết migration mới để cập nhật cả 2 phía (không có nguồn sự thật chung giữa TypeScript và SQL cho whitelist này, cùng đánh đổi đã chấp nhận ở `room_offerings.offering_id`/`room_members.avatar_id`).

### Lịch sử revert (Thần: DB table → hardcode)

Bản đầu (`schema/0014`) làm `deities` là bảng DB thật (FK tới `halls`, trigger kiểm tra qua `exists`/join, `rooms.primary_deity_id`/`support_deity_ids` là `uuid`/`uuid[]`), đã implement và test đầy đủ (kể cả phát hiện + sửa 1 bug logic trigger thật lúc đó — xem lịch sử migration `0014`). Sau khi triển khai xong, có quyết định sản phẩm rõ ràng là Thần không cần backing DB — `schema/0016` revert lại: xoá bảng `deities` + trigger cũ, đổi kiểu 2 cột `rooms` sang `text`/`text[]`, viết trigger mới dùng whitelist hardcode. Điểm kỹ thuật đáng chú ý khi làm revert này: **phải `drop view` `active_project_rooms` trước khi đổi kiểu cột** `primary_deity_id` — Postgres từ chối `alter column ... type` trên cột đang bị 1 view tham chiếu (`cannot alter type of a column used by a view or rule`), dù có `using` cast rõ ràng. Fix bằng cách `drop view` ngay trước đoạn `alter table`, rồi `create view` lại ở cuối file `0016` với đúng cột cũ + re-grant cả `anon`/`authenticated` (theo đúng bài học ở mục dưới).

### Regression phát hiện trong lúc làm việc này (từ `0011`, vẫn còn liên quan)

`0011_offering_counter.sql` (từ trước) `drop view` + `create view` lại `active_project_rooms` để thêm cột `offering_count`, nhưng chỉ `grant select ... to authenticated`, làm mất quyền `anon` mà `0007_allow_anon_read_rooms.sql` đã cấp trước đó (GRANT gắn với view object, mất theo khi `drop view`). Cả `0014` và `0016` đều phải cấp lại cả 2 role mỗi khi recreate view — bài học chung: **bất kỳ migration nào `drop view` + `create view` lại phải re-grant đầy đủ mọi role đã từng được cấp trước đó**, không chỉ role migration đó quan tâm. Đây đã xảy ra 2 lần liên tiếp (`0014`, `0016`) cho cùng 1 view — nếu có migration thứ 3 đổi `active_project_rooms` trong tương lai, nhớ kiểm tra lại bước re-grant này.

## 10. Chỗ ngồi chibi avatar (Seat Slots)

Xem `docs/prd-chibi-avatar-seats.md` cho toàn bộ phân tích/thiết kế gốc — mục này chỉ ghi lại phần **đã thực sự implement** (chỉ backend, chưa có UI — xem mục 9).

### Vì sao cần xử lý ở server, không thể xử lý thuần Presence

Presence (`channel.track()`) không có khái niệm khoá tài nguyên chung giữa các client — nếu để client tự chọn slot rồi track state đó, 2 người bấm cùng 1 slot cùng lúc sẽ **cả 2 đều thấy mình ngồi thành công** cho tới khi Presence đồng bộ lại. Slot cần 1 nguồn sự thật duy nhất ở Postgres, dùng row lock để serialize — đúng nguyên tắc `apply_room_action` đã áp dụng cho counters.

### Thiết kế

- Slot có phạm vi **room** (1 user chỉ ngồi 1 chỗ trong 1 phòng tại 1 thời điểm) → thêm cột `avatar_id`/`seat_slot` trực tiếp vào `room_members` (không tạo bảng riêng, vì quan hệ 1-1 với PK `(room_id, user_id)` đã có).
- Số slot cố định toàn hệ thống: `MAX_SEAT_SLOTS = 8` (`src/features/temple-room/seat-config.ts`), dùng cho mọi phòng kể cả sảnh chung.
- Unique partial index `(room_id, seat_slot) WHERE seat_slot IS NOT NULL` — lớp bảo vệ cuối cùng ở tầng constraint, đề phòng logic RPC có lỗi tương lai.
- RPC `claim_seat_slot(room_id, user_id, seat_slot, max_slots=8)`: giải phóng ghế cũ của user (nếu có) rồi thử giành ghế mới trong **1 câu `UPDATE ... WHERE ... AND NOT EXISTS (...)`** — không phải "SELECT kiểm tra trống rồi UPDATE riêng" (read-modify-write kinh điển gây race condition). Trả `(success, reason)`, `reason` là `'INVALID_SLOT'`/`'SLOT_TAKEN'` khi thất bại.
- RPC `release_seat_slot(room_id, user_id)`: xoá cả `seat_slot` và `avatar_id`.
- Route `POST /api/rooms/[roomId]/seat`: validate whitelist avatar + bounds slot (2 lớp, giống pattern lễ vật), kiểm tra đã là `room_members` chưa (403 nếu chưa join), rate-limit riêng `rooms:seat` (10/10s), map `SLOT_TAKEN` → HTTP 409 (tranh chấp bình thường, không phải lỗi hệ thống — client nên tự thử slot khác).
- Route `DELETE /api/rooms/[roomId]/seat`: gọi `release_seat_slot`.

### Presence vs. DB — ai là nguồn sự thật

Theo đúng nguyên tắc đã nhất quán trong toàn bộ codebase ("Presence do client track sau khi server đã xác nhận, không dùng Presence để tự quyết định kết quả"):

- **Presence** (`Participant.seatSlot`/`avatarId` trong `use-temple-room.ts`) là nguồn hiển thị **realtime, đang mở phòng** — tự dọn khi mất kết nối qua cơ chế "leave" có sẵn, không cần code thêm.
- **`room_members.seat_slot` trong DB** chỉ dùng để (a) chống tranh chấp lúc giành ghế ở RPC, (b) hiển thị tạm lúc Server Component render lần đầu, **trước khi** Realtime kết nối xong (`listSeatedMembers()` trong `room-service.ts`) — tránh flash "trống" rồi mới có người.
- **Hệ quả cần biết**: nếu user đóng tab đột ngột (không gọi `DELETE /seat`), `room_members.seat_slot` trong DB sẽ **kẹt** (vẫn coi như đã chiếm ghế) cho tới khi có cơ chế dọn định kỳ — hiện **chưa có cron job dọn seat_slot cũ** (khác với `room_actions`/`api_rate_limits` đã có `pg_cron` cleanup ở `0009`). Vì Presence là nguồn hiển thị chính khi phòng đang mở, việc này không gây bug hiển thị ngay lập tức, nhưng nếu không dọn, DB sẽ dần có nhiều `seat_slot` "ma" (users đã rời từ lâu) — cần thêm 1 job cleanup tương tự `0009` nếu vấn đề này trở nên đáng kể (chưa làm, ghi nhận là nợ kỹ thuật).

### Client sync (Presence payload)

`use-temple-room.ts` có `ownPresenceRef` giữ `activity`/`seatSlot`/`avatarId` hiện tại của chính client, dùng lại mỗi lần `channel.track()` được gọi (kể cả reconnect) — cần thiết vì `track()` **thay thế toàn bộ** state Presence của client đó, không phải cập nhật từng phần; nếu không giữ ref này, gọi `updateActivity()` sau khi đã ngồi sẽ vô tình reset `seatSlot` về `null`. Hàm mới `updateSeat(seatSlot, avatarId)` gọi `channel.track()` lại sau khi route `/seat` đã xác nhận thành công ở server — client không tự quyết định, chỉ phát lại kết quả đã được xác nhận.

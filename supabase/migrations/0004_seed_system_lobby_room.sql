-- Đền Cầu Nguyện — system lobby room.
--
-- PRD 3.2: "Cho phép người dùng vãng lai thực hiện thắp nhang chung, gõ chuông
-- chung trực tiếp tại sảnh chính (lưu vào một phòng sảnh chung hệ thống)."
--
-- This is a single, well-known room row that every visitor to `/` shares —
-- not a per-user or per-project room. We seed it with a fixed, predictable
-- slug so application code can look it up deterministically instead of
-- needing to create-or-fetch it on every request.

insert into public.rooms (
  slug,
  project_name,
  event_type,
  prayer,
  title,
  description,
  status,
  expires_at
)
select
  'sanh-chung',
  'Đền Cầu Nguyện',
  'release',
  'Cầu cho mọi lượt build, deploy, migration của cả cộng đồng dev đều bình an.',
  'Sảnh Chung',
  'Không gian tương tác chung cho mọi lập trình viên vãng lai.',
  'praying',
  -- The system lobby is permanent, unlike per-project rooms which expire in
  -- 24h by default — push its expiry far into the future.
  now() + interval '100 years'
where not exists (
  select 1 from public.rooms where slug = 'sanh-chung'
);

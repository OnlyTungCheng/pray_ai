-- Đền Cầu Nguyện — seed the six public Điện (Hall).
--
-- Keep all 6 Halls from docs/than.md available in fresh and existing environments.
-- Idempotent: keyed off each hall's unique slug, safe to re-run.
--
-- NOTE: this file previously also seeded a `deities` table. Per explicit
-- product decision ("thần không cần BE đâu, hardcode là được"), Deity moved
-- to a hardcoded catalog (src/features/halls/deity-catalog.ts) and the
-- `deities` table was dropped in schema/0016_deities_hardcode_migration.sql
-- — there is nothing left to seed for deities. The slugs used below
-- All Hall slugs below must stay in sync with
-- deity-catalog.ts's `hallSlug` values.

insert into public.halls (slug, name, description, sort_order)
select 'khai-trien', 'Điện Vạn Sự Khai Triển', 'Điện thờ các thần bảo trợ build, deploy, preview và domain.', 1
where not exists (select 1 from public.halls where slug = 'khai-trien');

insert into public.halls (slug, name, description, sort_order)
select 'hop-nhat', 'Điện Hợp Nhất Vạn Nhánh', 'Điện thờ các thần bảo trợ commit, pull request và merge.', 2
where not exists (select 1 from public.halls where slug = 'hop-nhat');

insert into public.halls (slug, name, description, sort_order)
select 'du-hai', 'Điện Dữ Hải Trường Tồn', 'Điện thờ các thần bảo trợ database, migration và realtime.', 3
where not exists (select 1 from public.halls where slug = 'du-hai');

insert into public.halls (slug, name, description, sort_order)
select 'tri-tue', 'Điện Trí Tuệ Vạn Lời', 'Điện thờ các thần bảo trợ prompt, context, reasoning và tool calling.', 4
where not exists (select 1 from public.halls where slug = 'tri-tue');

insert into public.halls (slug, name, description, sort_order)
select 'thien-van', 'Điện Thiên Vân Vạn Tượng', 'Điện thờ các thần bảo trợ cloud, compute, storage và networking.', 5
where not exists (select 1 from public.halls where slug = 'thien-van');

insert into public.halls (slug, name, description, sort_order)
select 'minh-giam', 'Điện Minh Giám Vạn Log', 'Điện thờ các thần bảo trợ monitoring, error tracking và observability.', 6
where not exists (select 1 from public.halls where slug = 'minh-giam');

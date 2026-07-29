-- Expand the public Hall catalog from the 3-Hall MVP to all 6 Halls in
-- docs/than.md, and keep the database deity guard in sync with
-- src/features/halls/deity-catalog.ts.

insert into public.halls (slug, name, description, sort_order)
values
  ('tri-tue', 'Điện Trí Tuệ Vạn Lời', 'Điện thờ các thần bảo trợ prompt, context, reasoning và tool calling.', 4),
  ('thien-van', 'Điện Thiên Vân Vạn Tượng', 'Điện thờ các thần bảo trợ cloud, compute, storage và networking.', 5),
  ('minh-giam', 'Điện Minh Giám Vạn Log', 'Điện thờ các thần bảo trợ monitoring, error tracking và observability.', 6)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

create or replace function public.check_room_deities_belong_to_hall()
returns trigger
language plpgsql
as $$
declare
  hall_slug_for_deity jsonb := '{
    "vercel": "khai-trien", "netlify": "khai-trien", "cloudflare": "khai-trien",
    "github": "hop-nhat", "gitlab": "hop-nhat", "bitbucket": "hop-nhat",
    "supabase": "du-hai", "firebase": "du-hai", "postgresql": "du-hai",
    "openai": "tri-tue", "claude": "tri-tue", "gemini": "tri-tue",
    "aws": "thien-van", "gcp": "thien-van", "azure": "thien-van",
    "sentry": "minh-giam", "datadog": "minh-giam", "grafana": "minh-giam"
  }'::jsonb;
  room_hall_slug text;
  bad_slug text;
begin
  if new.hall_id is null then
    if new.primary_deity_id is not null or coalesce(array_length(new.support_deity_ids, 1), 0) > 0 then
      raise exception 'A room with no hall_id cannot have a primary or support deity';
    end if;
    return new;
  end if;

  select slug into room_hall_slug
  from public.halls
  where id = new.hall_id;

  if new.primary_deity_id is not null then
    if not (hall_slug_for_deity ? new.primary_deity_id) then
      raise exception 'primary_deity_id % is not a known deity slug', new.primary_deity_id;
    end if;

    if (hall_slug_for_deity ->> new.primary_deity_id) is distinct from room_hall_slug then
      raise exception 'primary_deity_id % does not belong to hall %', new.primary_deity_id, room_hall_slug;
    end if;
  end if;

  if new.support_deity_ids is not null and array_length(new.support_deity_ids, 1) > 0 then
    select deity_slug.value into bad_slug
    from unnest(new.support_deity_ids) as deity_slug(value)
    where
      not (hall_slug_for_deity ? deity_slug.value)
      or (hall_slug_for_deity ->> deity_slug.value) is distinct from room_hall_slug
    limit 1;

    if bad_slug is not null then
      raise exception 'support_deity_ids contains a deity (%) not belonging to hall %', bad_slug, room_hall_slug;
    end if;
  end if;

  return new;
end;
$$;

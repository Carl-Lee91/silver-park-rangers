-- 풋살 팀 나누기 (docs/PLAN.md §6 "풋살")
--
-- 매치마다 종류(축구 · 풋살 5:5 · 풋살 6:6)를 둔다. 풋살은 쿼터 · 스쿼드 대신 참석자를 2 · 3팀으로 나눠
-- 하루 동안 고정한다. 공개(squad_published_at)는 축구 스쿼드와 같이 쓴다.

create type public.match_format as enum ('football', 'futsal5', 'futsal6');

alter table public.matches
  add column format public.match_format not null default 'football',
  add column team_count smallint not null default 2 check (team_count between 2 and 3);

-- 풋살 팀 명단. 공개 전에는 관리자만 본다(축구 스쿼드와 같다).
create table public.futsal_team_members (
  match_id uuid not null references public.matches (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  team_number smallint not null check (team_number between 1 and 3),
  primary key (match_id, member_id)
);

alter table public.futsal_team_members enable row level security;

create policy futsal_team_members_select on public.futsal_team_members for select to authenticated
  using (public.is_admin() or (public.is_approved() and public.squad_published(match_id)));
create policy futsal_team_members_admin_write on public.futsal_team_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 팀을 한 번에 저장한다(명단을 통째로 바꾼다). 실패하면 전의 팀이 그대로 남는다.
create function public.save_futsal_teams(target uuid, teams integer, members jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_format public.match_format;
begin
  if not public.is_admin() then
    raise exception 'only managers can save teams' using errcode = '42501';
  end if;

  select format into target_format from public.matches where id = target;
  if not found then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if target_format = 'football' then
    raise exception 'teams are for futsal matches' using errcode = '22023';
  end if;
  if teams not between 2 and 3 then
    raise exception 'team count must be 2 or 3' using errcode = '22023';
  end if;
  if jsonb_typeof(members) is distinct from 'array' then
    raise exception 'members must be an array' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(members) as item
    where (item ->> 'team_number')::int not between 1 and teams
  ) then
    raise exception 'team number out of range' using errcode = '22023';
  end if;

  delete from public.futsal_team_members where match_id = target;
  insert into public.futsal_team_members (match_id, member_id, team_number)
  select target, (item ->> 'member_id')::uuid, (item ->> 'team_number')::smallint
    from jsonb_array_elements(members) as item;
  update public.matches set team_count = teams where id = target;
end
$$;

revoke execute on function public.save_futsal_teams(uuid, integer, jsonb) from public, anon;
grant execute on function public.save_futsal_teams(uuid, integer, jsonb) to authenticated;

-- 공유 링크(/s/[token]): 공개된 풋살 매치의 팀 명단. 이름 · 등번호만 준다(멤버 id · 용병 구분 · 능력치 없음).
create function public.shared_teams(token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'match_date', m.match_date,
    'starts_at', m.starts_at,
    'ends_at', m.ends_at,
    'venue', m.venue,
    'opponent', m.opponent,
    'format', m.format,
    'team_count', m.team_count,
    'members', coalesce((
      select jsonb_agg(
        jsonb_build_object('team_number', t.team_number, 'name', member.real_name, 'jersey_number', member.jersey_number)
        order by t.team_number, member.real_name
      )
      from public.futsal_team_members t
      join public.members member on member.id = t.member_id
      where t.match_id = m.id
    ), '[]'::jsonb)
  )
  from public.matches m
  where m.share_token = token and m.squad_published_at is not null and m.format <> 'football'
$$;

revoke execute on function public.shared_teams(uuid) from public;
grant execute on function public.shared_teams(uuid) to anon, authenticated;

-- 경기 결과 기록 (docs/PLAN.md §10 이후 계획 → 지금)
--
-- 하루에 쿼터(경기)를 여러 번 하므로 결과도 쿼터마다 남긴다.
--   우리 점수 = 그 쿼터의 골 기록 수 (득점자를 모르거나 상대 자책골이면 scorer_id 가 비어 있다)
--   상대 점수 = match_quarter_results.their_score
-- quarters 표는 스쿼드를 저장할 때마다 지웠다 다시 만들어지므로(save_squad) 거기에 두지 않는다.
--
-- 승인된 사람은 모두 보고, 관리자 이상만 쓴다.

create table public.match_quarter_results (
  match_id uuid not null references public.matches (id) on delete cascade,
  number smallint not null check (number >= 1),
  their_score smallint not null default 0 check (their_score between 0 and 99),
  updated_at timestamptz not null default now(),
  primary key (match_id, number)
);

create table public.match_goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  quarter_number smallint not null check (quarter_number >= 1),
  -- 비어 있으면 득점자 모름(또는 상대 자책골)
  scorer_id uuid references public.members (id) on delete set null,
  assist_id uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now(),
  check (scorer_id is null or assist_id is null or scorer_id <> assist_id)
);

create index match_goals_match_id_idx on public.match_goals (match_id);
create index match_goals_scorer_id_idx on public.match_goals (scorer_id);
create index match_goals_assist_id_idx on public.match_goals (assist_id);

create trigger match_quarter_results_touch before update on public.match_quarter_results
  for each row execute function public.touch_updated_at();

-- 쿼터 번호는 그 매치의 쿼터 수 안이어야 한다. 다른 표를 봐야 해서 CHECK 대신 트리거로 막는다.
-- 두 표의 쿼터 번호 컬럼 이름이 달라서 트리거 인자(tg_argv[0])로 받는다.
create function public.guard_quarter_number()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  quarter_value smallint := (to_jsonb(new) ->> tg_argv[0])::smallint;
begin
  if not exists (
    select 1 from public.matches where id = new.match_id and quarter_value <= quarter_count
  ) then
    raise exception 'quarter number out of range' using errcode = '22023';
  end if;
  return new;
end
$$;

create trigger match_quarter_results_guard before insert or update on public.match_quarter_results
  for each row execute function public.guard_quarter_number('number');
create trigger match_goals_guard before insert or update on public.match_goals
  for each row execute function public.guard_quarter_number('quarter_number');

alter table public.match_quarter_results enable row level security;
alter table public.match_goals enable row level security;

create policy match_quarter_results_select on public.match_quarter_results for select to authenticated
  using (public.is_approved());
create policy match_quarter_results_admin_write on public.match_quarter_results for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy match_goals_select on public.match_goals for select to authenticated
  using (public.is_approved());
create policy match_goals_admin_write on public.match_goals for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 통계 원본에 득점·도움을 더한다(20261019050000 의 함수를 바꾼다).
create or replace function public.admin_stats_source(from_date date, to_date date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'only managers can read stats' using errcode = '42501';
  end if;

  with picked as (
    select id, match_date, opponent
      from public.matches
     where match_date between from_date and to_date
       and match_date < today
  ),
  played as (
    select q.match_id,
           s.member_id,
           count(*) filter (where s.position <> 'GK') as field_quarters,
           count(*) filter (where s.position = 'GK') as keeper_quarters,
           coalesce(array_agg(s.position::text) filter (where s.position <> 'GK'), '{}') as positions
      from public.quarters q
      join public.quarter_slots s on s.quarter_id = q.id
     where q.match_id in (select id from picked)
       and s.member_id is not null
     group by q.match_id, s.member_id
  ),
  voted as (
    select match_id, member_id, response, attended
      from public.match_attendance
     where match_id in (select id from picked)
  ),
  scored as (
    select match_id, member_id, sum(goals)::int as goals, sum(assists)::int as assists
      from (
        select match_id, scorer_id as member_id, 1 as goals, 0 as assists
          from public.match_goals where scorer_id is not null and match_id in (select id from picked)
        union all
        select match_id, assist_id, 0, 1
          from public.match_goals where assist_id is not null and match_id in (select id from picked)
      ) events
     group by match_id, member_id
  ),
  base as (
    select coalesce(v.match_id, p.match_id) as match_id,
           coalesce(v.member_id, p.member_id) as member_id,
           v.response,
           v.attended,
           coalesce(p.field_quarters, 0) as field_quarters,
           coalesce(p.keeper_quarters, 0) as keeper_quarters,
           coalesce(p.positions, '{}') as positions
      from voted v
      full outer join played p on p.match_id = v.match_id and p.member_id = v.member_id
  ),
  entries as (
    select coalesce(b.match_id, g.match_id) as match_id,
           coalesce(b.member_id, g.member_id) as member_id,
           b.response,
           b.attended,
           coalesce(b.field_quarters, 0) as field_quarters,
           coalesce(b.keeper_quarters, 0) as keeper_quarters,
           coalesce(b.positions, '{}') as positions,
           coalesce(g.goals, 0) as goals,
           coalesce(g.assists, 0) as assists
      from base b
      full outer join scored g on g.match_id = b.match_id and g.member_id = b.member_id
  ),
  quarter_scores as (
    select r.match_id, r.number, r.their_score,
           (select count(*) from public.match_goals g
             where g.match_id = r.match_id and g.quarter_number = r.number)::int as our_score
      from public.match_quarter_results r
     where r.match_id in (select id from picked)
  )
  select jsonb_build_object(
    'matches', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'match_date', m.match_date,
        'opponent', m.opponent,
        'confirmed', exists (select 1 from voted v where v.match_id = m.id and v.attended is not null),
        'has_squad', exists (select 1 from public.quarters q where q.match_id = m.id),
        'quarter_scores', coalesce((
          select jsonb_agg(jsonb_build_object('number', s.number, 'ours', s.our_score, 'theirs', s.their_score) order by s.number)
            from quarter_scores s where s.match_id = m.id
        ), '[]'::jsonb)
      ) order by m.match_date)
      from picked m
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', mem.id,
        'real_name', mem.real_name,
        'status', mem.status,
        'member_type', coalesce(info.member_type::text, 'member'),
        'preferred_positions', to_jsonb(mem.preferred_positions::text[]),
        'joined_on', (coalesce(mem.approved_at, mem.created_at) at time zone 'Asia/Seoul')::date
      ) order by mem.real_name)
      from public.members mem
      left join public.member_admin_info info on info.member_id = mem.id
      where mem.status in ('approved', 'inactive')
    ), '[]'::jsonb),
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object(
        'match_id', e.match_id,
        'member_id', e.member_id,
        'response', e.response,
        'attended', e.attended,
        'field_quarters', e.field_quarters,
        'keeper_quarters', e.keeper_quarters,
        'positions', to_jsonb(e.positions),
        'goals', e.goals,
        'assists', e.assists
      ))
      from entries e
    ), '[]'::jsonb)
  ) into result;

  return result;
end
$$;

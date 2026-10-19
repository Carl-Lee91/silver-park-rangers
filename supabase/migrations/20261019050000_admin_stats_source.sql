-- 관리자 통계의 원본 (docs/PLAN.md §10 2차)
--
-- 계산은 앱(TypeScript)이 한다 — 정의를 단위 테스트로 못 박기 위해서다. 여기서는 기간 안의
-- 지난 매치와, 매치 × 멤버마다 투표·출석·출전 쿼터를 한 덩어리(jsonb)로 준다.
--
-- 한 덩어리로 주는 이유: PostgREST 는 표를 한 번에 1000행까지만 준다. 매치 50개 × 멤버 30명이면
-- 참석 행만 1500개라 잘린다. 함수가 jsonb 하나를 돌려주면 그 제한을 받지 않는다.
--
-- 지난 매치만 본다(한국 날짜로 오늘 이전). 관리자 이상만 부른다.

create function public.admin_stats_source(from_date date, to_date date)
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
  entries as (
    select coalesce(v.match_id, p.match_id) as match_id,
           coalesce(v.member_id, p.member_id) as member_id,
           v.response,
           v.attended,
           coalesce(p.field_quarters, 0) as field_quarters,
           coalesce(p.keeper_quarters, 0) as keeper_quarters,
           coalesce(p.positions, '{}') as positions
      from voted v
      full outer join played p on p.match_id = v.match_id and p.member_id = v.member_id
  )
  select jsonb_build_object(
    'matches', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'match_date', m.match_date,
        'opponent', m.opponent,
        'confirmed', exists (select 1 from voted v where v.match_id = m.id and v.attended is not null),
        'has_squad', exists (select 1 from public.quarters q where q.match_id = m.id)
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
        'positions', to_jsonb(e.positions)
      ))
      from entries e
    ), '[]'::jsonb)
  ) into result;

  return result;
end
$$;

revoke execute on function public.admin_stats_source(date, date) from public, anon;
grant execute on function public.admin_stats_source(date, date) to authenticated;

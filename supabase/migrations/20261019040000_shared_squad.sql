-- 카톡 공유용 공개 스쿼드 (docs/PLAN.md §8)
--
-- /s/[share_token] 은 로그인 없이 열린다(카카오 미리보기 수집기도 로그인하지 않는다).
-- 그래서 표를 직접 열지 않고, 이 함수 하나만 anon 에게 연다.
--
-- 내주는 것: 매치 날짜·시간·장소·상대, 쿼터별 포메이션과 자리, 자리에 앉은 사람의 실명
-- 내주지 않는 것: 멤버/용병 구분, 참석 명단, 카카오 정보, 멤버 id
--   — 같은 사람을 쿼터끼리 묶을 수 있게 매치마다 다른 가짜 키(member_key)만 준다.
--
-- 스쿼드를 공개하지 않은 매치나 틀린 토큰이면 null 이다.

create function public.shared_squad(token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'match_id', m.id,
    'match_date', m.match_date,
    'starts_at', m.starts_at,
    'ends_at', m.ends_at,
    'quarter_count', m.quarter_count,
    'venue', m.venue,
    'opponent', m.opponent,
    'quarters', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'number', q.number,
          'formation_name', q.formation_name,
          'slots', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'slot_index', s.slot_index,
                'position', s.position,
                'x', s.x,
                'y', s.y,
                'member_key', case when s.member_id is null then null
                                   else left(md5(s.member_id::text || m.share_token::text), 12) end,
                'name', member.real_name
              )
              order by s.slot_index
            )
            from public.quarter_slots s
            left join public.members member on member.id = s.member_id
            where s.quarter_id = q.id
          ), '[]'::jsonb)
        )
        order by q.number
      )
      from public.quarters q
      where q.match_id = m.id
    ), '[]'::jsonb)
  )
  from public.matches m
  where m.share_token = token and m.squad_published_at is not null
$$;

grant execute on function public.shared_squad(uuid) to anon, authenticated;

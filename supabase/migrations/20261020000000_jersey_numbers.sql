-- 등번호 (docs/PLAN.md §5)
--
-- 0~99, 선택. 본인이 /me 에서 고른다. 같은 번호는 한 사람만 쓴다.
-- 팀원용 쿼터 보드와 공유 이미지는 동그라미에 번호를 넣는다(번호가 없으면 포지션 코드).

alter table public.members
  add column jersey_number smallint check (jersey_number between 0 and 99);

create unique index members_jersey_number_key on public.members (jersey_number)
  where jersey_number is not null;

-- 공유 링크에도 번호를 준다(20261019040000 의 함수를 바꾼다).
create or replace function public.shared_squad(token uuid)
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
                'name', member.real_name,
                'jersey_number', member.jersey_number
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


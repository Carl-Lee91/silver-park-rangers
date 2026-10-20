-- 투표 마감을 따로 정하지 않은 매치는 매치 시작 시각(한국 시간)에 마감한다.
-- 전에는 마감이 없으면 매치가 끝난 뒤에도 투표할 수 있었다.
--
-- 🔴 entities/match 의 votingClosesAt 과 같은 정의다.

create or replace function public.voting_open(target uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.matches
    where id = target
      and now() < coalesce(vote_deadline, (match_date + starts_at) at time zone 'Asia/Seoul')
  )
$$;

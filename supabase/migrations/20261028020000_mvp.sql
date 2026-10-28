-- 경기 후 MVP 투표 (docs/PLAN.md §10 "MVP 투표 · 경기 리포트")
--
-- 매치가 끝나고 이틀 동안, 그 매치에 뛴 사람이 뛴 사람 중 한 명을 뽑는다(자기 자신 빼고). 바꿀 수 있다.
-- 마감 전에는 몇 명이 투표했는지만 보이고, 결과는 마감 뒤에 모두에게 보인다 — 쏠리지 않게.
-- 🔴 기간 계산은 entities/mvp 의 mvpPhase 와 같다(한국 시각, 끝나고 2일).

-- 매치가 끝나는 순간(한국 시각)
create function public.match_ends_at(target uuid)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select (m.match_date + m.ends_at) at time zone 'Asia/Seoul' from public.matches m where m.id = target
$$;

create function public.mvp_open(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(now() >= public.match_ends_at(target) and now() < public.match_ends_at(target) + interval '2 days', false)
$$;

create function public.mvp_closed(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(now() >= public.match_ends_at(target) + interval '2 days', false)
$$;

-- 그 매치에 뛴 사람: 실제 출석이 "왔음"이거나, 출석을 안 정했으면 참석으로 투표한 사람
create function public.played_in(target_match uuid, target_member uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.match_attendance a
     where a.match_id = target_match
       and a.member_id = target_member
       and (a.attended = true or (a.attended is null and a.response = 'yes'))
  )
$$;

create table public.mvp_votes (
  match_id uuid not null references public.matches (id) on delete cascade,
  voter_id uuid not null references public.members (id) on delete cascade,
  candidate_id uuid not null references public.members (id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (match_id, voter_id),
  check (voter_id <> candidate_id)
);

create index mvp_votes_candidate_idx on public.mvp_votes (candidate_id);

alter table public.mvp_votes enable row level security;

-- 내 표만 본다(남이 누구를 뽑았는지는 안 보인다). 쓰기는 여는 동안, 뛴 사람이 뛴 사람에게만.
create policy mvp_votes_select_own on public.mvp_votes for select to authenticated
  using (voter_id = (select auth.uid()));
create policy mvp_votes_insert on public.mvp_votes for insert to authenticated
  with check (
    voter_id = (select auth.uid())
    and public.is_approved()
    and public.mvp_open(match_id)
    and public.played_in(match_id, voter_id)
    and public.played_in(match_id, candidate_id)
  );
create policy mvp_votes_update on public.mvp_votes for update to authenticated
  using (voter_id = (select auth.uid()) and public.mvp_open(match_id))
  with check (
    voter_id = (select auth.uid())
    and public.is_approved()
    and public.mvp_open(match_id)
    and public.played_in(match_id, candidate_id)
  );
create policy mvp_votes_delete on public.mvp_votes for delete to authenticated
  using (voter_id = (select auth.uid()) and public.mvp_open(match_id));

-- 몇 명이 투표했는지(여는 중에도 본다)
create function public.mvp_voter_count(target uuid)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_approved() then
    raise exception 'only team members can read mvp votes' using errcode = '42501';
  end if;
  return (select count(*) from public.mvp_votes where match_id = target);
end
$$;

-- 결과(마감 뒤에만). 많이 받은 순, 같으면 이름순. 볼 수 있는 이름만 준다(멤버/용병 구분은 없다).
create function public.mvp_results(target uuid)
returns table (candidate_id uuid, real_name text, jersey_number smallint, votes integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_approved() then
    raise exception 'only team members can read mvp votes' using errcode = '42501';
  end if;
  if not public.mvp_closed(target) then
    return;
  end if;
  return query
    select v.candidate_id, m.real_name, m.jersey_number, count(*)::integer
      from public.mvp_votes v
      join public.members m on m.id = v.candidate_id
     where v.match_id = target
     group by v.candidate_id, m.real_name, m.jersey_number
     order by count(*) desc, m.real_name;
end
$$;

revoke execute on function public.mvp_voter_count(uuid) from public, anon;
revoke execute on function public.mvp_results(uuid) from public, anon;
grant execute on function public.mvp_voter_count(uuid) to authenticated;
grant execute on function public.mvp_results(uuid) to authenticated;

-- 선수 능력치 (docs/PLAN.md §5 "능력치")
--
-- 관리자가 선수마다 1~10 으로 매긴다. 매기지 않은 칸은 null(0 이 아니다). 골키퍼는 키퍼를 볼 수 있는 사람만 매긴다.
-- 관리자 이상만 읽고 쓴다 — 일반 멤버는 자기 능력치도 못 본다. members 는 승인된 팀원 모두가 읽으므로
-- 표를 나눈다(RLS 는 행 단위라 컬럼만 숨길 수 없다).

create table public.member_ratings (
  member_id uuid primary key references public.members (id) on delete cascade,
  pace smallint check (pace between 1 and 10),
  shooting smallint check (shooting between 1 and 10),
  passing smallint check (passing between 1 and 10),
  dribbling smallint check (dribbling between 1 and 10),
  defending smallint check (defending between 1 and 10),
  physical smallint check (physical between 1 and 10),
  goalkeeping smallint check (goalkeeping between 1 and 10),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger member_ratings_touch before update on public.member_ratings
  for each row execute function public.touch_updated_at();

alter table public.member_ratings enable row level security;

create policy member_ratings_admin on public.member_ratings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 선수별 특이사항 (docs/PLAN.md §10 이후 계획 → 지금)
--
-- 매치마다 따로 쓰고, 관리자 이상만 본다. 예: "이번 주 무릎 안 좋음 — 수비만", "2쿼터부터 옴(지각)".
-- match_attendance 는 승인된 팀원 모두가 읽으므로 거기 두지 않고 표를 나눈다(RLS 는 행 단위라
-- 컬럼만 숨길 수 없다).

create table public.match_notes (
  match_id uuid not null references public.matches (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  note text not null check (char_length(btrim(note)) between 1 and 200),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (match_id, member_id)
);

create trigger match_notes_touch before update on public.match_notes
  for each row execute function public.touch_updated_at();

alter table public.match_notes enable row level security;

create policy match_notes_admin on public.match_notes for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

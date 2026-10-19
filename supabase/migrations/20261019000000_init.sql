-- 초기 스키마: 멤버 · 매치 · 참석 · 포메이션 · 쿼터 (docs/PLAN.md §3, §4, §9)
--
-- 🔴 모든 테이블에 RLS 를 켠다. anon key 는 브라우저에 공개되므로 누구든 API 를 직접
--    부를 수 있다. 화면 가드가 아니라 여기 정책이 실제 접근 통제다.
--
-- 권한 요약
--   승인 전(가입 대기·거절·휴면) : 자기 멤버 행만 본다
--   승인된 사람                   : 승인된 멤버, 매치, 참석, 포메이션, 공개된 스쿼드를 본다
--                                  자기 참석 투표만 쓴다(마감 전)
--   운영진                        : 전부 본다·쓴다. 멤버/용병 구분(member_admin_info)은 운영진만 본다

-- ── 타입 ─────────────────────────────────────────────────────────────

create type public.foot as enum ('left', 'right');
-- 기획의 포지션 7개(PLAN.md §5). `position` 은 SQL 함수 이름과 겹쳐서 피한다.
create type public.player_position as enum ('FW', 'AM', 'WG', 'MF', 'WB', 'CB', 'GK');
create type public.member_role as enum ('admin', 'user');
create type public.member_status as enum ('pending', 'approved', 'rejected', 'inactive');
create type public.member_type as enum ('member', 'guest');
create type public.attendance_response as enum ('yes', 'no', 'maybe');

-- 배열에 같은 값이 두 번 들어가지 않았는지. CHECK 안에서는 부분 질의를 못 써서 함수로 뺀다.
create function public.has_no_duplicates(items anyarray)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select count(distinct item) = count(*) from unnest(items) as item
$$;

-- ── 테이블 ───────────────────────────────────────────────────────────

create table public.members (
  id uuid primary key references auth.users (id) on delete cascade,
  real_name text not null check (char_length(btrim(real_name)) between 1 and 20),
  -- 운영진이 본인 확인할 때 보는 카카오 프로필. 클라이언트가 보낸 값은 쓰지 않고
  -- 트리거가 auth.users 에서 채운다(members_fill_profile).
  kakao_nickname text,
  avatar_url text,
  feet public.foot[] not null
    check (cardinality(feet) between 1 and 2 and public.has_no_duplicates(feet)),
  -- 순서가 우선순위다. 1순위가 GK 면 전담 키퍼(PLAN.md §6).
  preferred_positions public.player_position[] not null
    check (cardinality(preferred_positions) between 1 and 3 and public.has_no_duplicates(preferred_positions)),
  role public.member_role not null default 'user',
  status public.member_status not null default 'pending',
  approved_by uuid references public.members (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 🔴 멤버/용병 구분은 운영진만 본다(PLAN.md §3). members 에 두면 승인된 사람 모두가
--    읽게 되므로 테이블을 나눈다. RLS 는 행 단위라 컬럼만 숨길 수 없다.
create table public.member_admin_info (
  member_id uuid primary key references public.members (id) on delete cascade,
  member_type public.member_type not null default 'member',
  updated_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  match_date date not null,
  starts_at time not null default '10:00',
  ends_at time not null default '13:00',
  quarter_count smallint not null default 6 check (quarter_count between 1 and 12),
  venue text,
  opponent text,
  vote_deadline timestamptz,
  -- null 이면 스쿼드가 공개 전이다. 공개 전에는 운영진만 쿼터를 본다.
  squad_published_at timestamptz,
  -- 카톡 공유용 공개 경로(/s/[share_token])에 쓰는 추측할 수 없는 값(PLAN.md §8)
  share_token uuid not null unique default gen_random_uuid(),
  created_by uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.match_attendance (
  match_id uuid not null references public.matches (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  -- 운영진이 출석만 확정한 사람은 투표가 없을 수 있다.
  response public.attendance_response,
  -- 쿼터 번호가 아니라 시각으로 둔다. 매치 시간을 바꿔도 "12시에 간다"가 그대로 남는다.
  arrive_at time,
  leave_at time,
  -- 매치 후 운영진이 확정한다. null 이면 미확정. 투표와 따로 둬야 노쇼율을 낼 수 있다.
  attended boolean,
  updated_at timestamptz not null default now(),
  primary key (match_id, member_id),
  check (arrive_at is null or leave_at is null or arrive_at < leave_at)
);

create index match_attendance_member_id_idx on public.match_attendance (member_id);

create table public.formations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 30),
  -- 4-3-3 · 4-4-2 기본값. 운영진도 고치거나 지울 수 없다.
  is_preset boolean not null default false,
  -- [{ "position": "GK", "x": 50, "y": 92 }, …] — x·y 는 경기장 안 위치(0~100, y=0 이 상대 골문)
  slots jsonb not null check (jsonb_typeof(slots) = 'array' and jsonb_array_length(slots) between 1 and 11),
  created_by uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.quarters (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  -- 1부터 센다. 화면의 "1쿼터"와 같다.
  number smallint not null check (number >= 1),
  formation_name text not null,
  unique (match_id, number)
);

-- 포메이션 좌표를 쿼터마다 복사해 둔다. 원본 포메이션을 고쳐도 지난 매치는 그대로다.
-- position = 'GK' 인 칸이 키퍼다. 키퍼 쿼터는 출전 수에서 뺀다(PLAN.md §6).
create table public.quarter_slots (
  quarter_id uuid not null references public.quarters (id) on delete cascade,
  slot_index smallint not null check (slot_index >= 0),
  position public.player_position not null,
  x real not null check (x between 0 and 100),
  y real not null check (y between 0 and 100),
  member_id uuid references public.members (id) on delete set null,
  primary key (quarter_id, slot_index),
  unique (quarter_id, member_id)
);

create index quarter_slots_member_id_idx on public.quarter_slots (member_id);

-- ── 판단 함수 ────────────────────────────────────────────────────────
-- 🔴 정의를 entities/member 의 판단 함수와 같게 유지한다(CLAUDE.md "사용자 판단 기준").

create function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members
    where id = (select auth.uid()) and status = 'approved'
  )
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members
    where id = (select auth.uid()) and status = 'approved' and role = 'admin'
  )
$$;

create function public.voting_open(target uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.matches
    where id = target and (vote_deadline is null or now() < vote_deadline)
  )
$$;

create function public.squad_published(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.matches
    where id = target and squad_published_at is not null
  )
$$;

-- ── 트리거 ───────────────────────────────────────────────────────────

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create trigger members_touch before update on public.members
  for each row execute function public.touch_updated_at();
create trigger member_admin_info_touch before update on public.member_admin_info
  for each row execute function public.touch_updated_at();
create trigger matches_touch before update on public.matches
  for each row execute function public.touch_updated_at();
create trigger match_attendance_touch before update on public.match_attendance
  for each row execute function public.touch_updated_at();

-- 카카오 닉네임·사진은 클라이언트가 보낸 값을 믿지 않고 로그인 정보에서 채운다.
-- 운영진은 이 값으로 본인 확인을 하므로 가짜로 넣을 수 있으면 안 된다.
create function public.fill_member_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb;
begin
  select raw_user_meta_data into meta from auth.users where id = new.id;
  new.kakao_nickname := coalesce(
    meta ->> 'name', meta ->> 'full_name', meta ->> 'user_name',
    meta ->> 'preferred_username', meta ->> 'nickname'
  );
  new.avatar_url := coalesce(meta ->> 'avatar_url', meta ->> 'picture');
  new.real_name := btrim(new.real_name);
  return new;
end
$$;

create trigger members_fill_profile before insert on public.members
  for each row execute function public.fill_member_profile();

-- 🔴 본인이 자기 역할·상태를 바꾸지 못하게 막는다. RLS 는 "어느 행"만 정하고 "어느 컬럼"은
--    못 정해서 트리거로 막는다. 운영진의 API 요청과 SQL 편집기(postgres)는 통과한다.
create function public.guard_member_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'member id cannot change' using errcode = '42501';
  end if;
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;
  if (new.role, new.status, new.approved_by, new.approved_at,
      new.real_name, new.kakao_nickname, new.avatar_url)
     is distinct from
     (old.role, old.status, old.approved_by, old.approved_at,
      old.real_name, old.kakao_nickname, old.avatar_url) then
    raise exception 'only admins can change role, status or name' using errcode = '42501';
  end if;
  return new;
end
$$;

create trigger members_guard before update on public.members
  for each row execute function public.guard_member_update();

-- 실제 출석(attended)은 운영진만 정한다. 본인은 투표만 한다.
create function public.guard_attendance_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.attended is not null then
      raise exception 'only admins can confirm attendance' using errcode = '42501';
    end if;
  elsif (new.attended, new.match_id, new.member_id)
        is distinct from (old.attended, old.match_id, old.member_id) then
    raise exception 'only admins can confirm attendance' using errcode = '42501';
  end if;
  return new;
end
$$;

create trigger match_attendance_guard before insert or update on public.match_attendance
  for each row execute function public.guard_attendance_write();

-- ── RLS ──────────────────────────────────────────────────────────────

alter table public.members enable row level security;
alter table public.member_admin_info enable row level security;
alter table public.matches enable row level security;
alter table public.match_attendance enable row level security;
alter table public.formations enable row level security;
alter table public.quarters enable row level security;
alter table public.quarter_slots enable row level security;

-- members: 자기 행은 항상 본다(가입 대기 화면). 승인된 사람은 승인된 멤버만, 운영진은 전부.
create policy members_select on public.members for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_admin()
    or (public.is_approved() and status = 'approved')
  );

-- 온보딩: 자기 행 하나를 "가입 대기·일반"으로만 만든다.
create policy members_insert_self on public.members for insert to authenticated
  with check (
    id = (select auth.uid())
    and role = 'user'
    and status = 'pending'
    and approved_by is null
    and approved_at is null
  );

-- 본인은 주발·선호 포지션을 고친다(나머지는 members_guard 가 막는다). 운영진은 누구든.
create policy members_update on public.members for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

create policy member_admin_info_admin on public.member_admin_info for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy matches_select on public.matches for select to authenticated
  using (public.is_approved());
create policy matches_admin_insert on public.matches for insert to authenticated
  with check (public.is_admin());
create policy matches_admin_update on public.matches for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy matches_admin_delete on public.matches for delete to authenticated
  using (public.is_admin());

-- 참석: 승인된 사람은 모두의 투표를 본다(참석자 목록). 쓰기는 마감 전 자기 것만.
create policy match_attendance_select on public.match_attendance for select to authenticated
  using (public.is_approved());
create policy match_attendance_insert on public.match_attendance for insert to authenticated
  with check (
    public.is_admin()
    or (member_id = (select auth.uid()) and public.is_approved() and public.voting_open(match_id))
  );
create policy match_attendance_update on public.match_attendance for update to authenticated
  using (
    public.is_admin()
    or (member_id = (select auth.uid()) and public.is_approved() and public.voting_open(match_id))
  )
  with check (
    public.is_admin()
    or (member_id = (select auth.uid()) and public.is_approved() and public.voting_open(match_id))
  );
create policy match_attendance_admin_delete on public.match_attendance for delete to authenticated
  using (public.is_admin());

create policy formations_select on public.formations for select to authenticated
  using (public.is_approved());
create policy formations_admin_insert on public.formations for insert to authenticated
  with check (public.is_admin() and not is_preset);
create policy formations_admin_update on public.formations for update to authenticated
  using (public.is_admin() and not is_preset)
  with check (public.is_admin() and not is_preset);
create policy formations_admin_delete on public.formations for delete to authenticated
  using (public.is_admin() and not is_preset);

-- 쿼터: 스쿼드를 공개하기 전에는 운영진만 본다.
create policy quarters_select on public.quarters for select to authenticated
  using (public.is_admin() or (public.is_approved() and public.squad_published(match_id)));
create policy quarters_admin_write on public.quarters for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy quarter_slots_select on public.quarter_slots for select to authenticated
  using (
    public.is_admin()
    or (
      public.is_approved()
      and exists (
        select 1 from public.quarters q
        where q.id = quarter_id and public.squad_published(q.match_id)
      )
    )
  );
create policy quarter_slots_admin_write on public.quarter_slots for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── 운영진 RPC ───────────────────────────────────────────────────────

-- 가입 승인. 상태 변경과 멤버/용병 지정을 한 번에 한다(둘 중 하나만 되면 안 된다).
create function public.approve_member(target uuid, kind public.member_type)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'only admins can approve members' using errcode = '42501';
  end if;

  update public.members
     set status = 'approved', approved_by = (select auth.uid()), approved_at = now()
   where id = target and status = 'pending';
  if not found then
    raise exception 'member is not waiting for approval' using errcode = 'P0002';
  end if;

  insert into public.member_admin_info (member_id, member_type)
  values (target, kind)
  on conflict (member_id) do update set member_type = excluded.member_type;
end
$$;

create function public.reject_member(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'only admins can reject members' using errcode = '42501';
  end if;

  update public.members set status = 'rejected'
   where id = target and status = 'pending';
  if not found then
    raise exception 'member is not waiting for approval' using errcode = 'P0002';
  end if;
end
$$;

revoke execute on function public.approve_member(uuid, public.member_type) from public, anon;
revoke execute on function public.reject_member(uuid) from public, anon;
grant execute on function public.approve_member(uuid, public.member_type) to authenticated;
grant execute on function public.reject_member(uuid) to authenticated;

-- ── 기본 포메이션 (PLAN.md §5) ───────────────────────────────────────

insert into public.formations (name, is_preset, slots) values
  ('4-3-3', true, '[
    {"position": "GK", "x": 50, "y": 92},
    {"position": "WB", "x": 12, "y": 72},
    {"position": "CB", "x": 37, "y": 78},
    {"position": "CB", "x": 63, "y": 78},
    {"position": "WB", "x": 88, "y": 72},
    {"position": "MF", "x": 25, "y": 52},
    {"position": "MF", "x": 50, "y": 58},
    {"position": "MF", "x": 75, "y": 52},
    {"position": "WG", "x": 15, "y": 25},
    {"position": "FW", "x": 50, "y": 18},
    {"position": "WG", "x": 85, "y": 25}
  ]'),
  ('4-4-2', true, '[
    {"position": "GK", "x": 50, "y": 92},
    {"position": "WB", "x": 12, "y": 72},
    {"position": "CB", "x": 37, "y": 78},
    {"position": "CB", "x": 63, "y": 78},
    {"position": "WB", "x": 88, "y": 72},
    {"position": "WG", "x": 12, "y": 48},
    {"position": "MF", "x": 37, "y": 52},
    {"position": "MF", "x": 63, "y": 52},
    {"position": "WG", "x": 88, "y": 48},
    {"position": "FW", "x": 37, "y": 20},
    {"position": "FW", "x": 63, "y": 20}
  ]');

-- 어드민 전용 계정 + 관리자 지정 (docs/PLAN.md §3)
--
-- 권한은 세 단계다.
--   어드민(owners)  : 선수가 아닌 전용 계정. 관리자가 하는 일 전부 + 관리자 지정·해제
--   관리자(admin)   : 멤버 중에서 어드민이 지정한다. 가입 승인·거절, 멤버/용병 구분, 휴면 처리
--   일반(user)      : 참석 투표, 스쿼드 보기
--
-- 어드민 계정은 members 에 넣지 않는다. 선수가 아니므로 멤버 목록·참석·스쿼드에 나오면 안 되고,
-- 실명·주발·포지션도 없다. 그래서 owners 테이블에 인증 id 만 둔다.

-- ── 어드민 계정 ──────────────────────────────────────────────────────

create table public.owners (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 🔴 쓰기 정책이 없다. 어드민은 SQL Editor 에서만 추가한다(docs/SETUP.md §4).
alter table public.owners enable row level security;
create policy owners_select_self on public.owners for select to authenticated
  using (user_id = (select auth.uid()));

create function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.owners where user_id = (select auth.uid()))
$$;

-- 어드민은 승인된 사람이자 관리자로 본다. 그래야 모든 정책을 그대로 통과한다.
-- 🔴 정의를 entities/member 의 gate 와 같게 유지한다.
create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_owner() or exists (
    select 1 from public.members
    where id = (select auth.uid()) and status = 'approved'
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_owner() or exists (
    select 1 from public.members
    where id = (select auth.uid()) and status = 'approved' and role = 'admin'
  )
$$;

-- 어드민은 members 에 없으므로 "누가 했는지"는 members 가 아니라 인증 사용자를 가리킨다.
alter table public.members drop constraint members_approved_by_fkey;
alter table public.members add constraint members_approved_by_fkey
  foreign key (approved_by) references auth.users (id) on delete set null;
alter table public.matches drop constraint matches_created_by_fkey;
alter table public.matches add constraint matches_created_by_fkey
  foreign key (created_by) references auth.users (id) on delete set null;
alter table public.formations drop constraint formations_created_by_fkey;
alter table public.formations add constraint formations_created_by_fkey
  foreign key (created_by) references auth.users (id) on delete set null;

-- ── 게이트가 읽는 값 ─────────────────────────────────────────────────

-- proxy 가 요청마다 부른다. 멤버 상태·역할과 어드민 여부를 한 번에 돌려준다.
-- 멤버 행이 없으면 status·role 은 null 이다(온보딩 전 또는 어드민 계정).
create function public.my_access()
returns table (status public.member_status, role public.member_role, is_owner boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select m.status, m.role, public.is_owner()
  from (select 1) as one
  left join public.members m on m.id = (select auth.uid())
$$;

revoke execute on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;

-- ── 멤버 행 보호 ─────────────────────────────────────────────────────

-- 역할은 어드민만, 상태·이름은 관리자 이상만 바꾼다. 관리자의 상태는 어드민만 바꾼다
-- (관리자끼리 서로 휴면시키지 못하게). SQL Editor(postgres)와 RPC 안은 통과한다 —
-- RPC 는 스스로 권한을 검사한다.
create or replace function public.guard_member_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'member id cannot change' using errcode = '42501';
  end if;
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_owner() then
    raise exception 'only the admin account can change roles' using errcode = '42501';
  end if;
  if (new.status, new.approved_by, new.approved_at,
      new.real_name, new.kakao_nickname, new.avatar_url)
     is distinct from
     (old.status, old.approved_by, old.approved_at,
      old.real_name, old.kakao_nickname, old.avatar_url) then
    if not public.is_admin() then
      raise exception 'only managers can change status or name' using errcode = '42501';
    end if;
    if old.role = 'admin' and new.status is distinct from old.status and not public.is_owner() then
      raise exception 'only the admin account can change a manager''s status' using errcode = '42501';
    end if;
  end if;
  return new;
end
$$;

-- ── 관리 RPC ─────────────────────────────────────────────────────────

-- 거절한 사람도 다시 승인할 수 있다(잘못 거절했을 때).
create or replace function public.approve_member(target uuid, kind public.member_type)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'only managers can approve members' using errcode = '42501';
  end if;

  update public.members
     set status = 'approved', approved_by = (select auth.uid()), approved_at = now()
   where id = target and status in ('pending', 'rejected');
  if not found then
    raise exception 'member is not waiting for approval' using errcode = 'P0002';
  end if;

  insert into public.member_admin_info (member_id, member_type)
  values (target, kind)
  on conflict (member_id) do update set member_type = excluded.member_type;
end
$$;

-- 멤버 ↔ 용병
create function public.set_member_type(target uuid, kind public.member_type)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'only managers can change member type' using errcode = '42501';
  end if;
  if not exists (select 1 from public.members where id = target and status in ('approved', 'inactive')) then
    raise exception 'member is not approved' using errcode = 'P0002';
  end if;

  insert into public.member_admin_info (member_id, member_type)
  values (target, kind)
  on conflict (member_id) do update set member_type = excluded.member_type;
end
$$;

-- 휴면 ↔ 복귀. 승인·거절은 approve_member · reject_member 가 한다.
create function public.set_member_status(target uuid, next public.member_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_role_value public.member_role;
begin
  if not public.is_admin() then
    raise exception 'only managers can change member status' using errcode = '42501';
  end if;
  if next not in ('approved', 'inactive') then
    raise exception 'use approve_member or reject_member' using errcode = '22023';
  end if;

  select role into current_role_value
    from public.members
   where id = target and status in ('approved', 'inactive');
  if not found then
    raise exception 'member is not approved' using errcode = 'P0002';
  end if;
  if current_role_value = 'admin' and not public.is_owner() then
    raise exception 'only the admin account can change a manager''s status' using errcode = '42501';
  end if;

  update public.members set status = next where id = target;
end
$$;

-- 관리자 지정·해제. 어드민만 한다.
create function public.set_member_role(target uuid, next public.member_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception 'only the admin account can change roles' using errcode = '42501';
  end if;

  update public.members set role = next where id = target and status = 'approved';
  if not found then
    raise exception 'member is not approved' using errcode = 'P0002';
  end if;
end
$$;

revoke execute on function public.set_member_type(uuid, public.member_type) from public, anon;
revoke execute on function public.set_member_status(uuid, public.member_status) from public, anon;
revoke execute on function public.set_member_role(uuid, public.member_role) from public, anon;
grant execute on function public.set_member_type(uuid, public.member_type) to authenticated;
grant execute on function public.set_member_status(uuid, public.member_status) to authenticated;
grant execute on function public.set_member_role(uuid, public.member_role) to authenticated;

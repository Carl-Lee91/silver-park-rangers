-- 카카오 로그인 → 이메일 가입 신청 (docs/PLAN.md §2, §4, §5)
--
-- 가입 신청 화면이 이메일·비밀번호와 프로필을 한 번에 보낸다. 프로필은 계정의 메타데이터
-- (raw_user_meta_data)로 실려 오고, 계정을 만드는 순간 트리거가 멤버 행을 만든다. 그래서
-- "계정만 있고 신청은 없는" 상태가 생기지 않는다.
--
-- 메일은 보내지 않는다(이메일 확인 끔). 비밀번호를 잊으면 관리자가 임시 비밀번호를 만든다.

-- ── 카카오 프로필 걷어내기 ────────────────────────────────────────────

-- 카카오 닉네임·사진을 채우던 트리거가 실명 공백도 다듬었다. 그 일만 남긴다.
drop trigger members_fill_profile on public.members;
drop function public.fill_member_profile();

create function public.trim_member_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.real_name := btrim(new.real_name);
  return new;
end
$$;

create trigger members_trim_name before insert or update of real_name on public.members
  for each row execute function public.trim_member_name();

-- 20261019010000 의 판단은 그대로, 카카오 컬럼만 뺀다.
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
  if (new.status, new.approved_by, new.approved_at, new.real_name)
     is distinct from
     (old.status, old.approved_by, old.approved_at, old.real_name) then
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

alter table public.members drop column kakao_nickname, drop column avatar_url;

-- ── 선호 포지션: 3개, 1순위가 GK 면 GK 하나 ──────────────────────────
-- 1순위 GK 는 전담 키퍼라 필드를 뛰지 않는다(PLAN.md §6). 그래서 다른 포지션을 받지 않는다.
alter table public.members drop constraint members_preferred_positions_check;
alter table public.members add constraint members_preferred_positions_check check (
  public.has_no_duplicates(preferred_positions)
  and (
    (cardinality(preferred_positions) = 3 and preferred_positions[1] <> 'GK')
    or preferred_positions = '{GK}'::public.player_position[]
  )
);

-- ── 가입 신청 = 계정 + 멤버 행 ────────────────────────────────────────

-- 신청 화면이 보낸 메타데이터로 멤버 행을 만든다. 상태·역할은 받지 않는다(기본값: 승인 대기·일반).
-- 값이 규칙에 안 맞으면 여기서 오류가 나고 계정도 만들어지지 않는다.
-- 실명이 없는 계정(대시보드에서 만든 어드민 계정 등)은 건너뛴다.
create function public.create_member_from_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}');
begin
  if not meta ? 'real_name' then
    return new;
  end if;

  insert into public.members (id, real_name, feet, preferred_positions, jersey_number)
  values (
    new.id,
    meta ->> 'real_name',
    array(select jsonb_array_elements_text(coalesce(meta -> 'feet', '[]')))::public.foot[],
    -- 순서가 우선순위다. 보낸 순서를 그대로 지킨다.
    array(select item.value
            from jsonb_array_elements_text(coalesce(meta -> 'preferred_positions', '[]')) with ordinality as item(value, ord)
           order by item.ord)::public.player_position[],
    (meta ->> 'jersey_number')::smallint
  );
  return new;
end
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.create_member_from_signup();

-- ── 등번호 고르기 ────────────────────────────────────────────────────

-- 이미 누가 쓰는 번호. 가입 신청 화면(로그인 전)도 부르므로 번호만 준다. 내 번호는 뺀다.
create function public.taken_jersey_numbers()
returns smallint[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(jersey_number order by jersey_number), '{}')
    from public.members
   where jersey_number is not null
     and id is distinct from (select auth.uid())
$$;

grant execute on function public.taken_jersey_numbers() to anon, authenticated;

-- ── 관리자용: 로그인 이메일 · 임시 비밀번호 ───────────────────────────

-- 이메일은 auth.users 에만 있다. members 에 옮기면 승인된 사람 모두가 읽게 되므로 함수로 준다.
create function public.member_emails()
returns table (member_id uuid, email text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'only managers can read emails' using errcode = '42501';
  end if;
  return query
    select m.id, u.email::text
      from public.members m
      join auth.users u on u.id = m.id;
end
$$;

-- 비밀번호를 잊은 사람에게 임시 비밀번호를 만들어 준다(메일을 보내지 않으므로).
-- 관리자의 것은 어드민만 만든다 — 관리자끼리 서로의 계정에 들어가지 못하게.
-- 로그인 서버(GoTrue)는 bcrypt 해시를 읽는다. pgcrypto 의 bf 가 같은 형식이다.
create function public.reset_member_password(target uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role public.member_role;
  temporary text := encode(extensions.gen_random_bytes(5), 'hex');
begin
  if not public.is_admin() then
    raise exception 'only managers can reset passwords' using errcode = '42501';
  end if;

  select m.role into target_role
    from public.members m
    join auth.users u on u.id = m.id
   where m.id = target;
  if not found then
    raise exception 'member has no account' using errcode = 'P0002';
  end if;
  if target_role = 'admin' and target <> (select auth.uid()) and not public.is_owner() then
    raise exception 'only the admin account can reset a manager''s password' using errcode = '42501';
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(temporary, extensions.gen_salt('bf')),
         updated_at = now()
   where id = target;
  return temporary;
end
$$;

revoke execute on function public.member_emails() from public, anon;
revoke execute on function public.reset_member_password(uuid) from public, anon;
grant execute on function public.member_emails() to authenticated;
grant execute on function public.reset_member_password(uuid) to authenticated;

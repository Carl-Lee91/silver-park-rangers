-- 가입 없는 참여: 선수 등록 · 개인 링크 (docs/PLAN.md §4 "관리자 등록 · 개인 링크")
--
-- 이메일 · 비밀번호 가입이 어려운 팀원은 관리자가 명단에 넣고(계정 없는 멤버 행), 개인 링크를 보낸다.
-- 링크를 열면 서버가 서버 전용 키로 로그인 계정을 멤버 id 그대로 만들고 세션을 연다 — 그래서 RLS 의
-- "id = auth.uid()" 가 그대로 맞는다. 이 파일은 DB 쪽(명단 · 링크 · 관리 화면 표시)만 맡는다.

-- ── 선수 등록 ────────────────────────────────────────────────────────

-- 그날 용병(add_match_guest)과 같지만 매치에 묶이지 않는다. 바로 승인된 멤버이고 구분을 고른다.
create function public.register_member(
  member_name text,
  member_feet public.foot[],
  member_positions public.player_position[],
  member_number integer,
  kind public.member_type
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid := gen_random_uuid();
begin
  if not public.is_admin() then
    raise exception 'only managers can register members' using errcode = '42501';
  end if;

  insert into public.members (id, real_name, feet, preferred_positions, jersey_number, status, approved_by, approved_at)
  values (new_id, member_name, member_feet, member_positions, member_number, 'approved', (select auth.uid()), now());
  insert into public.member_admin_info (member_id, member_type) values (new_id, kind);
  return new_id;
end
$$;

-- ── 개인 링크 ────────────────────────────────────────────────────────

-- 링크 = 그 사람의 열쇠. 사람마다 하나이고, 새로 만들면 바뀐다(예전 링크는 더 안 열린다).
-- 관리자가 다시 복사할 수 있게 값 그대로 둔다(공유 링크 share_token 과 같다). 관리자만 읽는다.
create table public.member_links (
  member_id uuid primary key references public.members (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.member_links enable row level security;
create policy member_links_admin_select on public.member_links for select to authenticated
  using (public.is_admin());

-- 만들기 · 새로 만들기. 승인된 사람만(그날 용병은 빼고). 관리자의 링크는 어드민만 만든다 —
-- 임시 비밀번호(reset_member_password)와 같은 이유로, 관리자끼리 서로의 계정에 들어가지 못하게.
create function public.issue_member_link(target uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_status public.member_status;
  target_role public.member_role;
  issued uuid := gen_random_uuid();
begin
  if not public.is_admin() then
    raise exception 'only managers can issue member links' using errcode = '42501';
  end if;

  select status, role into target_status, target_role from public.members where id = target;
  if not found or target_status <> 'approved' or public.is_match_guest(target) then
    raise exception 'only approved members get a link' using errcode = 'P0002';
  end if;
  if target_role = 'admin' and target <> (select auth.uid()) and not public.is_owner() then
    raise exception 'only the admin account can issue a manager''s link' using errcode = '42501';
  end if;

  insert into public.member_links (member_id, token, created_by)
  values (target, issued, (select auth.uid()))
  on conflict (member_id) do update
    set token = excluded.token, created_by = excluded.created_by, created_at = now();
  return issued;
end
$$;

-- 링크의 주인. 로그인 전(링크 화면)에도 부른다 — 맞는 링크를 가진 사람에게만 이름 · 등번호를 준다.
-- 휴면 · 거절된 사람의 링크는 열리지 않는다(복귀하면 같은 링크가 다시 열린다).
create function public.link_member(link_token uuid)
returns table (id uuid, real_name text, jersey_number smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.real_name, m.jersey_number
    from public.member_links l
    join public.members m on m.id = l.member_id
   where l.token = link_token
     and m.status = 'approved'
$$;

revoke execute on function public.register_member(text, public.foot[], public.player_position[], integer, public.member_type) from public, anon;
revoke execute on function public.issue_member_link(uuid) from public, anon;
grant execute on function public.register_member(text, public.foot[], public.player_position[], integer, public.member_type) to authenticated;
grant execute on function public.issue_member_link(uuid) to authenticated;
grant execute on function public.link_member(uuid) to anon, authenticated;

-- ── 관리 화면: 링크 계정은 이메일 대신 "링크" ─────────────────────────

-- 링크로 만든 계정은 app_metadata.link_login 이 참이다. 이메일 칸의 표시용 주소(<id>@link.invalid)는
-- 메일이 가지 않으므로 관리 화면에 보이지 않는다. 반환 모양이 바뀌어서 지우고 다시 만든다.
create function public.is_link_account(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select (u.raw_app_meta_data ->> 'link_login')::boolean from auth.users u where u.id = target), false)
$$;

revoke execute on function public.is_link_account(uuid) from public, anon, authenticated;

drop function public.member_emails();
create function public.member_emails()
returns table (member_id uuid, email text, via_link boolean)
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
    select m.id,
           case when public.is_link_account(m.id) then null else u.email::text end,
           public.is_link_account(m.id)
      from public.members m
      join auth.users u on u.id = m.id;
end
$$;

revoke execute on function public.member_emails() from public, anon;
grant execute on function public.member_emails() to authenticated;

-- 링크 계정은 비밀번호로 들어오지 않는다(이메일도 표시용이다). 잃어버리면 새 링크를 보낸다.
-- 20261021000000 의 판단은 그대로, 링크 계정만 막는다.
create or replace function public.reset_member_password(target uuid)
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
  if not found or public.is_link_account(target) then
    raise exception 'member has no password account' using errcode = 'P0002';
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

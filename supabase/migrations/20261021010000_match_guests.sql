-- 그날 용병 (docs/PLAN.md §4)
--
-- 한 번 뛰고 마는 용병은 가입시키지 않고 관리자가 매치에 넣는다. 계정이 없다.
--
-- 🔴 그날 용병도 members 의 평범한 행이다. 참석·스쿼드·골·특이사항·공유 링크가 전부 members 를
--    가리키므로 그대로 쓰인다. "그날 용병인지"는 관리자만 읽는 match_guests 에만 남긴다 —
--    members 에 표시 컬럼을 두면 승인된 사람 모두가 읽는다(member_type 과 같은 이유, PLAN.md §3).

-- ── 계정 없는 멤버 행을 허용한다 ─────────────────────────────────────

-- 가입한 사람은 여전히 id = 계정 id 다(members_insert_self 가 auth.uid() 만 받는다).
-- 외래 키가 하던 "계정을 지우면 멤버 행도 지운다"는 트리거가 맡는다.
alter table public.members drop constraint members_id_fkey;
alter table public.members alter column id set default gen_random_uuid();

create function public.delete_member_of_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.members where id = old.id;
  return old;
end
$$;

create trigger on_auth_user_deleted after delete on auth.users
  for each row execute function public.delete_member_of_user();

-- ── 그날 용병 표 ─────────────────────────────────────────────────────

create table public.match_guests (
  member_id uuid primary key references public.members (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index match_guests_match_id_idx on public.match_guests (match_id);

-- 관리자만 읽는다. 쓰기는 아래 RPC 로만 한다(멤버 행과 같이 바뀌어야 해서).
alter table public.match_guests enable row level security;
create policy match_guests_admin_select on public.match_guests for select to authenticated
  using (public.is_admin());

-- 매치를 지우면 표의 행이 지워지고(cascade), 그때 멤버 행도 지운다. 그날 용병은 그 매치에만 있다.
create function public.delete_guest_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.members where id = old.member_id;
  return old;
end
$$;

create trigger match_guests_delete_member after delete on public.match_guests
  for each row execute function public.delete_guest_member();

create function public.is_match_guest(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.match_guests where member_id = target)
$$;

revoke execute on function public.is_match_guest(uuid) from public, anon, authenticated;

-- ── 등번호: 그날 용병은 겹쳐도 된다 ──────────────────────────────────

-- 유니크 인덱스는 다른 표(match_guests)를 볼 수 없어서 트리거로 바꾼다.
-- 동시에 같은 번호를 고르는 경우를 막으려고 번호 검사를 한 줄로 세운다(advisory lock).
-- 일반 사용자는 RLS 때문에 다른 사람 행을 다 못 보므로 security definer 로 본다.
drop index public.members_jersey_number_key;

create function public.guard_jersey_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.jersey_number is null or public.is_match_guest(new.id) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('public.members.jersey_number'));
  if exists (
    select 1 from public.members m
     where m.jersey_number = new.jersey_number
       and m.id <> new.id
       and not public.is_match_guest(m.id)
  ) then
    raise exception 'jersey number % is taken', new.jersey_number using errcode = '23505';
  end if;
  return new;
end
$$;

create trigger members_guard_jersey before insert or update of jersey_number on public.members
  for each row execute function public.guard_jersey_number();

-- 그날 용병의 번호는 "사용 중"으로 치지 않는다(20261021000000 의 함수를 바꾼다).
create or replace function public.taken_jersey_numbers()
returns smallint[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(m.jersey_number order by m.jersey_number), '{}')
    from public.members m
   where m.jersey_number is not null
     and m.id is distinct from (select auth.uid())
     and not public.is_match_guest(m.id)
$$;

-- ── 관리자 RPC ───────────────────────────────────────────────────────

-- 넣으면 그 매치에 참석으로 들어간다. 관리 화면에서는 용병으로 보인다(member_admin_info).
create function public.add_match_guest(
  target_match uuid,
  guest_name text,
  guest_feet public.foot[],
  guest_positions public.player_position[],
  guest_number integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest_id uuid := gen_random_uuid();
begin
  if not public.is_admin() then
    raise exception 'only managers can add match guests' using errcode = '42501';
  end if;
  if not exists (select 1 from public.matches where id = target_match) then
    raise exception 'match not found' using errcode = 'P0002';
  end if;

  insert into public.members (id, real_name, feet, preferred_positions, status, approved_by, approved_at)
  values (guest_id, guest_name, guest_feet, guest_positions, 'approved', (select auth.uid()), now());
  insert into public.match_guests (member_id, match_id, created_by)
  values (guest_id, target_match, (select auth.uid()));
  insert into public.member_admin_info (member_id, member_type) values (guest_id, 'guest');
  -- 번호는 match_guests 에 들어간 뒤에 넣는다. 그래야 번호 검사가 그날 용병으로 알아본다.
  update public.members set jersey_number = guest_number where id = guest_id;
  insert into public.match_attendance (match_id, member_id, response)
  values (target_match, guest_id, 'yes');

  return guest_id;
end
$$;

create function public.update_match_guest(
  target uuid,
  guest_name text,
  guest_feet public.foot[],
  guest_positions public.player_position[],
  guest_number integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'only managers can edit match guests' using errcode = '42501';
  end if;
  if not public.is_match_guest(target) then
    raise exception 'not a match guest' using errcode = 'P0002';
  end if;

  update public.members
     set real_name = guest_name,
         feet = guest_feet,
         preferred_positions = guest_positions,
         jersey_number = guest_number
   where id = target;
end
$$;

-- 빼면 멤버 행이 지워진다(트리거). 참석·특이사항은 같이 지워지고, 스쿼드 자리는 빈칸,
-- 골 기록은 "모름"이 된다(각 표의 외래 키).
create function public.remove_match_guest(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'only managers can remove match guests' using errcode = '42501';
  end if;
  delete from public.match_guests where member_id = target;
  if not found then
    raise exception 'not a match guest' using errcode = 'P0002';
  end if;
end
$$;

revoke execute on function public.add_match_guest(uuid, text, public.foot[], public.player_position[], integer) from public, anon;
revoke execute on function public.update_match_guest(uuid, text, public.foot[], public.player_position[], integer) from public, anon;
revoke execute on function public.remove_match_guest(uuid) from public, anon;
grant execute on function public.add_match_guest(uuid, text, public.foot[], public.player_position[], integer) to authenticated;
grant execute on function public.update_match_guest(uuid, text, public.foot[], public.player_position[], integer) to authenticated;
grant execute on function public.remove_match_guest(uuid) to authenticated;

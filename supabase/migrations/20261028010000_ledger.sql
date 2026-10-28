-- 회비 · 벌금 장부 (docs/PLAN.md §10 "회비 · 벌금 장부")
--
-- 총무가 엑셀 · 메모로 하던 일: 누가 회비를 냈나, 용병 경기비 · 노쇼 벌금, 구장비 같은 지출, 잔액.
-- 돈은 지금 쓰는 모임통장으로 받는다. 앱은 "누가 냈나"와 장부만 맡는다.
--
-- 🔴 받을 사람(이번 달 회비를 낼 멤버, 용병 참석자, 노쇼)은 저장하지 않고 화면이 계산한다. 저장하는 것은
--    받은 돈과 쓴 돈(장부 한 줄)뿐이다 — 그래서 "받을 것"과 "받은 것"이 어긋나지 않는다.

create type public.ledger_category as enum (
  'dues',          -- 월회비(멤버)
  'match_fee',     -- 경기비(용병). 화면에는 "경기비"로만 보인다 — 멤버/용병 구분은 관리자 전용(PLAN.md §3)
  'fine',          -- 벌금(노쇼)
  'other_income',  -- 기타 수입
  'field',         -- 구장비
  'gear',          -- 용품(공 · 조끼 · 음료)
  'other_expense'  -- 기타 지출
);

-- 수입인지. 화면(entities/ledger 의 CATEGORIES)과 같게 둔다.
create function public.is_income(category public.ledger_category)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select category in ('dues', 'match_fee', 'fine', 'other_income')
$$;

-- 금액 설정은 한 줄이다. 0 이면 그 항목은 받지 않는다.
create table public.dues_settings (
  id boolean primary key default true check (id),
  monthly_fee integer not null default 0 check (monthly_fee between 0 and 1000000),
  match_fee integer not null default 0 check (match_fee between 0 and 1000000),
  no_show_fine integer not null default 0 check (no_show_fine between 0 and 1000000),
  updated_at timestamptz not null default now()
);
insert into public.dues_settings default values;

-- 장부 한 줄. 사람 · 매치를 지워도 받은 돈은 남아야 해서 외래 키는 set null 이고, 낸 사람 이름을 같이 남긴다.
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default (now() at time zone 'Asia/Seoul')::date,
  category public.ledger_category not null,
  amount integer not null check (amount between 1 and 10000000),
  member_id uuid references public.members (id) on delete set null,
  match_id uuid references public.matches (id) on delete set null,
  -- 월회비가 어느 달 몫인지(그 달 1일)
  dues_month date check (dues_month is null or extract(day from dues_month) = 1),
  payer_name text check (payer_name is null or char_length(payer_name) <= 20),
  memo text check (memo is null or char_length(memo) <= 100),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((category = 'dues') = (dues_month is not null))
);

create index ledger_entries_date_idx on public.ledger_entries (entry_date);
create index ledger_entries_member_idx on public.ledger_entries (member_id);
-- 같은 달 회비 · 같은 매치 경기비 · 벌금은 한 번만 받는다.
create unique index ledger_entries_dues_once on public.ledger_entries (member_id, dues_month) where category = 'dues';
create unique index ledger_entries_match_once on public.ledger_entries (member_id, match_id, category)
  where category in ('match_fee', 'fine');

alter table public.dues_settings enable row level security;
alter table public.ledger_entries enable row level security;

create policy dues_settings_admin_select on public.dues_settings for select to authenticated using (public.is_admin());
create policy dues_settings_admin_update on public.dues_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 관리자는 모두 읽고 적고 지운다(고치기는 지우고 다시 적는다). 팀원은 지출과 내 납부만 본다 —
-- 다른 사람의 납부를 보이면 누가 경기비를 내는지(용병인지)가 드러난다.
create policy ledger_entries_select on public.ledger_entries for select to authenticated
  using (
    public.is_admin()
    or (public.is_approved() and (member_id = (select auth.uid()) or not public.is_income(category)))
  );
create policy ledger_entries_admin_insert on public.ledger_entries for insert to authenticated
  with check (public.is_admin());
create policy ledger_entries_admin_delete on public.ledger_entries for delete to authenticated
  using (public.is_admin());

-- 받음(월회비 · 경기비 · 벌금). 금액은 설정에서, 이름은 지금 이름을 남긴다. 금액이 0 인 항목은 받지 않는다.
create function public.record_payment(
  kind public.ledger_category,
  target_member uuid,
  target_match uuid,
  target_month date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.dues_settings;
  fee integer;
  payer text;
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'only managers can record payments' using errcode = '42501';
  end if;
  if kind not in ('dues', 'match_fee', 'fine') then
    raise exception 'not a payment' using errcode = '22023';
  end if;
  if kind = 'dues' and target_month is null or kind <> 'dues' and target_match is null then
    raise exception 'payment needs a month or a match' using errcode = '22023';
  end if;

  select * into settings from public.dues_settings;
  fee := case kind when 'dues' then settings.monthly_fee when 'match_fee' then settings.match_fee else settings.no_show_fine end;
  if coalesce(fee, 0) = 0 then
    raise exception 'fee is not set' using errcode = 'P0002';
  end if;

  select real_name into payer from public.members where id = target_member;
  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  insert into public.ledger_entries (category, amount, member_id, match_id, dues_month, payer_name, created_by)
  values (
    kind,
    fee,
    target_member,
    case when kind = 'dues' then null else target_match end,
    case when kind = 'dues' then date_trunc('month', target_month)::date end,
    payer,
    (select auth.uid())
  )
  returning id into new_id;
  return new_id;
end
$$;

-- 팀 수입 · 지출 · 잔액(장부 공개). 팀원은 다른 사람의 납부 줄을 못 보므로 합계는 함수로 준다.
create function public.team_ledger_summary()
returns table (income bigint, expense bigint, balance bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_approved() then
    raise exception 'only team members can read the ledger' using errcode = '42501';
  end if;
  return query
    select coalesce(sum(amount) filter (where public.is_income(category)), 0)::bigint,
           coalesce(sum(amount) filter (where not public.is_income(category)), 0)::bigint,
           coalesce(sum(case when public.is_income(category) then amount else -amount end), 0)::bigint
      from public.ledger_entries;
end
$$;

revoke execute on function public.record_payment(public.ledger_category, uuid, uuid, date) from public, anon;
revoke execute on function public.team_ledger_summary() from public, anon;
grant execute on function public.record_payment(public.ledger_category, uuid, uuid, date) to authenticated;
grant execute on function public.team_ledger_summary() to authenticated;

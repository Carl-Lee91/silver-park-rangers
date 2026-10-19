-- RLS 시나리오. 기획(PLAN.md §3·§4)의 권한이 DB 에서 실제로 지켜지는지 본다.
-- run.sh 가 스텁과 마이그레이션을 깐 뒤 실행한다. 하나라도 어기면 그 자리에서 멈춘다.

create schema verify;
grant usage on schema verify to anon, authenticated;

create function verify.ok(condition boolean, label text)
returns void
language plpgsql
as $$
begin
  if condition is not true then
    raise exception 'FAIL: %', label;
  end if;
  raise notice 'ok - %', label;
end
$$;

-- 막혀야 하는 문장을 실행해 보고, 오류가 나면 통과다.
-- 🔴 RLS 의 USING 에 걸린 UPDATE·DELETE 는 오류 없이 0행이 된다. 그런 경우는 결과를 따로 확인한다.
create function verify.fails(statement text, label text)
returns void
language plpgsql
as $$
begin
  begin
    execute statement;
  exception when others then
    raise notice 'ok - % (%)', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL: % — 막혀야 하는데 성공했다', label;
end
$$;

create function verify.login(user_id uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, false);
$$;

grant execute on all functions in schema verify to anon, authenticated;

-- 등장인물
--   …01 관리자   …02 멤버   …03 가입 대기   …04 로그인만 한 외부인   …05 용병   …06 거절될 사람
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', '{"name": "관리자카톡", "avatar_url": "https://example.com/a.png"}'),
  ('00000000-0000-0000-0000-000000000002', '{"name": "멤버카톡"}'),
  ('00000000-0000-0000-0000-000000000003', '{"name": "대기카톡"}'),
  ('00000000-0000-0000-0000-000000000004', '{"name": "외부인카톡"}'),
  ('00000000-0000-0000-0000-000000000005', '{"name": "용병카톡"}'),
  ('00000000-0000-0000-0000-000000000006', '{"name": "거절카톡"}');

-- ── 로그인 안 한 사람 ────────────────────────────────────────────────
set role anon;
select verify.ok((select count(*) from public.formations) = 0, '로그인 안 하면 포메이션을 못 본다');
select verify.ok((select count(*) from public.members) = 0, '로그인 안 하면 멤버를 못 본다');
select verify.fails($$select public.approve_member('00000000-0000-0000-0000-000000000003', 'member')$$,
  '로그인 안 하면 승인 함수를 못 부른다');
reset role;

-- ── 온보딩 ───────────────────────────────────────────────────────────
set role authenticated;

select verify.login('00000000-0000-0000-0000-000000000001');
insert into public.members (id, real_name, feet, preferred_positions, kakao_nickname, avatar_url)
values ('00000000-0000-0000-0000-000000000001', '  김운영 ', '{right}', '{MF,CB}', '가짜닉네임', 'https://evil.example');
select verify.ok((select kakao_nickname from public.members where id = '00000000-0000-0000-0000-000000000001') = '관리자카톡',
  '카카오 닉네임은 보낸 값이 아니라 로그인 정보로 채운다');
select verify.ok((select avatar_url from public.members where id = '00000000-0000-0000-0000-000000000001') = 'https://example.com/a.png',
  '카카오 사진도 로그인 정보로 채운다');
select verify.ok((select real_name from public.members where id = '00000000-0000-0000-0000-000000000001') = '김운영',
  '실명 앞뒤 공백을 지운다');
select verify.ok((select status from public.members where id = '00000000-0000-0000-0000-000000000001') = 'pending',
  '가입하면 승인 대기 상태다');
select verify.fails($$insert into public.members (id, real_name, feet, preferred_positions)
  values ('00000000-0000-0000-0000-000000000004', '남의행', '{left}', '{FW}')$$,
  '남의 멤버 행은 만들 수 없다');

select verify.login('00000000-0000-0000-0000-000000000004');
select verify.fails($$insert into public.members (id, real_name, feet, preferred_positions, status)
  values ('00000000-0000-0000-0000-000000000004', '셀프승인', '{left}', '{FW}', 'approved')$$,
  '스스로 승인 상태로 가입할 수 없다');
select verify.fails($$insert into public.members (id, real_name, feet, preferred_positions, role)
  values ('00000000-0000-0000-0000-000000000004', '셀프운영', '{left}', '{FW}', 'admin')$$,
  '스스로 관리자로 가입할 수 없다');
select verify.fails($$insert into public.members (id, real_name, feet, preferred_positions)
  values ('00000000-0000-0000-0000-000000000004', '욕심쟁이', '{left}', '{FW,CB,MF,WB}')$$,
  '선호 포지션은 3개까지다');
select verify.fails($$insert into public.members (id, real_name, feet, preferred_positions)
  values ('00000000-0000-0000-0000-000000000004', '중복', '{left}', '{FW,FW}')$$,
  '선호 포지션은 겹칠 수 없다');
select verify.fails($$insert into public.members (id, real_name, feet, preferred_positions)
  values ('00000000-0000-0000-0000-000000000004', '발없음', '{}', '{FW}')$$,
  '주발은 하나 이상 고른다');
select verify.fails($$insert into public.members (id, real_name, feet, preferred_positions)
  values ('00000000-0000-0000-0000-000000000004', '   ', '{left}', '{FW}')$$,
  '실명은 비울 수 없다');
select verify.ok((select count(*) from public.members) = 0, '가입 안 한 사람은 아무 멤버도 못 본다');

select verify.login('00000000-0000-0000-0000-000000000002');
insert into public.members (id, real_name, feet, preferred_positions)
values ('00000000-0000-0000-0000-000000000002', '이멤버', '{left,right}', '{FW}');
select verify.login('00000000-0000-0000-0000-000000000003');
insert into public.members (id, real_name, feet, preferred_positions)
values ('00000000-0000-0000-0000-000000000003', '박대기', '{right}', '{GK}');
select verify.login('00000000-0000-0000-0000-000000000005');
insert into public.members (id, real_name, feet, preferred_positions)
values ('00000000-0000-0000-0000-000000000005', '최용병', '{left}', '{WG,FW}');
select verify.login('00000000-0000-0000-0000-000000000006');
insert into public.members (id, real_name, feet, preferred_positions)
values ('00000000-0000-0000-0000-000000000006', '정거절', '{right}', '{CB}');

-- ── 가입 대기 중 ─────────────────────────────────────────────────────
select verify.login('00000000-0000-0000-0000-000000000003');
select verify.ok((select count(*) from public.members) = 1, '가입 대기 중엔 자기 행만 본다');
select verify.ok((select count(*) from public.formations) = 0, '가입 대기 중엔 포메이션을 못 본다');
select verify.fails($$update public.members set status = 'approved' where id = '00000000-0000-0000-0000-000000000003'$$,
  '스스로 승인할 수 없다');
select verify.fails($$update public.members set role = 'admin' where id = '00000000-0000-0000-0000-000000000003'$$,
  '스스로 관리자가 될 수 없다');
select verify.fails($$update public.members set real_name = '바꾼이름' where id = '00000000-0000-0000-0000-000000000003'$$,
  '실명은 스스로 못 바꾼다');
update public.members set feet = '{left}' where id = '00000000-0000-0000-0000-000000000003';
select verify.ok((select feet from public.members where id = '00000000-0000-0000-0000-000000000003') = '{left}',
  '주발은 스스로 바꾼다');
select verify.fails($$select public.approve_member('00000000-0000-0000-0000-000000000003', 'member')$$,
  '관리자가 아니면 승인할 수 없다');
reset role;

-- ── 첫 관리자는 SQL 편집기(postgres)에서 지정한다 ─────────────────────
update public.members set role = 'admin', status = 'approved'
 where id = '00000000-0000-0000-0000-000000000001';

-- ── 관리자 승인 · 거절 ───────────────────────────────────────────────
set role authenticated;
select verify.login('00000000-0000-0000-0000-000000000001');
select verify.ok((select count(*) from public.members) = 5, '관리자는 가입 대기 중인 사람까지 모두 본다');
select public.approve_member('00000000-0000-0000-0000-000000000002', 'member');
select public.approve_member('00000000-0000-0000-0000-000000000005', 'guest');
select public.reject_member('00000000-0000-0000-0000-000000000006');
select verify.ok((select status from public.members where id = '00000000-0000-0000-0000-000000000002') = 'approved',
  '승인하면 승인 상태가 된다');
select verify.ok((select approved_by from public.members where id = '00000000-0000-0000-0000-000000000002') = '00000000-0000-0000-0000-000000000001',
  '누가 승인했는지 남는다');
select verify.ok((select member_type from public.member_admin_info where member_id = '00000000-0000-0000-0000-000000000005') = 'guest',
  '승인하면서 용병으로 지정한다');
select verify.fails($$select public.approve_member('00000000-0000-0000-0000-000000000002', 'member')$$,
  '이미 승인된 사람은 다시 승인하지 않는다');

-- ── 승인된 일반 멤버 ─────────────────────────────────────────────────
select verify.login('00000000-0000-0000-0000-000000000002');
select verify.ok((select count(*) from public.members) = 3, '승인된 사람은 승인된 멤버만 본다');
select verify.ok((select count(*) from public.member_admin_info) = 0, '멤버/용병 구분은 관리자만 본다');
select verify.ok((select count(*) from public.formations where is_preset) = 2, '기본 포메이션 두 개를 본다');
select verify.fails($$insert into public.matches (match_date) values ('2026-10-25')$$,
  '일반 멤버는 매치를 못 만든다');
select verify.fails($$insert into public.formations (name, slots) values ('3-5-2', '[{"position":"GK","x":50,"y":92}]')$$,
  '일반 멤버는 포메이션을 못 만든다');
select verify.fails($$select public.approve_member('00000000-0000-0000-0000-000000000003', 'member')$$,
  '일반 멤버는 승인할 수 없다');
select verify.fails($$update public.members set role = 'admin' where id = '00000000-0000-0000-0000-000000000002'$$,
  '승인된 뒤에도 스스로 관리자가 될 수 없다');

-- ── 매치와 참석 투표 ─────────────────────────────────────────────────
select verify.login('00000000-0000-0000-0000-000000000001');
insert into public.matches (id, match_date, vote_deadline) values
  ('10000000-0000-0000-0000-000000000001', '2026-10-25', now() + interval '1 day'),
  ('10000000-0000-0000-0000-000000000002', '2026-10-18', now() - interval '1 day');

select verify.login('00000000-0000-0000-0000-000000000002');
insert into public.match_attendance (match_id, member_id, response, leave_at)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'yes', '12:00');
update public.match_attendance set response = 'maybe'
 where match_id = '10000000-0000-0000-0000-000000000001' and member_id = '00000000-0000-0000-0000-000000000002';
select verify.ok((select response from public.match_attendance
  where match_id = '10000000-0000-0000-0000-000000000001' and member_id = '00000000-0000-0000-0000-000000000002') = 'maybe',
  '마감 전에는 자기 투표를 하고 바꾼다');
select verify.fails($$insert into public.match_attendance (match_id, member_id, response)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'yes')$$,
  '남의 투표는 못 한다');
select verify.fails($$insert into public.match_attendance (match_id, member_id, response)
  values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'yes')$$,
  '마감이 지나면 투표하지 못한다');
select verify.fails($$update public.match_attendance set attended = true
  where match_id = '10000000-0000-0000-0000-000000000001' and member_id = '00000000-0000-0000-0000-000000000002'$$,
  '실제 출석은 스스로 정하지 못한다');

select verify.login('00000000-0000-0000-0000-000000000005');
select verify.fails($$insert into public.match_attendance (match_id, member_id, response, attended)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'yes', true)$$,
  '투표하면서 출석을 확정하지 못한다');
select verify.fails($$insert into public.match_attendance (match_id, member_id, response, arrive_at, leave_at)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'yes', '12:00', '11:00')$$,
  '도착이 떠나는 시간보다 늦을 수 없다');

select verify.login('00000000-0000-0000-0000-000000000003');
select verify.ok((select count(*) from public.matches) = 0, '가입 대기 중엔 매치를 못 본다');
select verify.fails($$insert into public.match_attendance (match_id, member_id, response)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'yes')$$,
  '승인 전에는 투표하지 못한다');

select verify.login('00000000-0000-0000-0000-000000000001');
update public.match_attendance set attended = true
 where match_id = '10000000-0000-0000-0000-000000000001' and member_id = '00000000-0000-0000-0000-000000000002';
select verify.ok((select attended from public.match_attendance
  where match_id = '10000000-0000-0000-0000-000000000001' and member_id = '00000000-0000-0000-0000-000000000002'),
  '관리자는 실제 출석을 확정한다');
insert into public.match_attendance (match_id, member_id, attended)
values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', true);
select verify.ok((select count(*) from public.match_attendance
  where match_id = '10000000-0000-0000-0000-000000000002') = 1,
  '관리자는 마감 뒤에도 투표 안 한 사람의 출석을 기록한다');

-- ── 스쿼드 공개 전후 ─────────────────────────────────────────────────
insert into public.quarters (id, match_id, number, formation_name)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, '4-3-3');
insert into public.quarter_slots (quarter_id, slot_index, position, x, y, member_id) values
  ('20000000-0000-0000-0000-000000000001', 0, 'GK', 50, 92, null),
  ('20000000-0000-0000-0000-000000000001', 1, 'FW', 50, 18, '00000000-0000-0000-0000-000000000002');
select verify.fails($$insert into public.quarter_slots (quarter_id, slot_index, position, x, y, member_id)
  values ('20000000-0000-0000-0000-000000000001', 2, 'WG', 15, 25, '00000000-0000-0000-0000-000000000002')$$,
  '한 쿼터에 같은 사람을 두 번 넣을 수 없다');

select verify.login('00000000-0000-0000-0000-000000000002');
select verify.ok((select count(*) from public.quarters) = 0, '공개 전에는 쿼터를 못 본다');
select verify.ok((select count(*) from public.quarter_slots) = 0, '공개 전에는 배치를 못 본다');

select verify.login('00000000-0000-0000-0000-000000000001');
update public.matches set squad_published_at = now() where id = '10000000-0000-0000-0000-000000000001';

select verify.login('00000000-0000-0000-0000-000000000002');
select verify.ok((select count(*) from public.quarters) = 1, '공개 후에는 쿼터를 본다');
select verify.ok((select count(*) from public.quarter_slots) = 2, '공개 후에는 배치를 본다');
select verify.fails($$insert into public.quarter_slots (quarter_id, slot_index, position, x, y)
  values ('20000000-0000-0000-0000-000000000001', 3, 'CB', 37, 78)$$,
  '일반 멤버는 배치를 못 고친다');

-- ── 포메이션 ─────────────────────────────────────────────────────────
select verify.login('00000000-0000-0000-0000-000000000001');
insert into public.formations (name, slots) values ('3-5-2', '[{"position": "GK", "x": 50, "y": 92}]');
select verify.ok((select count(*) from public.formations) = 3, '관리자는 커스텀 포메이션을 저장한다');
update public.formations set name = '4-3-3 수정' where name = '4-3-3';
select verify.ok(exists (select 1 from public.formations where name = '4-3-3'),
  '기본 포메이션은 관리자도 못 고친다');
delete from public.formations where name = '4-4-2';
select verify.ok(exists (select 1 from public.formations where name = '4-4-2'),
  '기본 포메이션은 관리자도 못 지운다');
select verify.fails($$insert into public.formations (name, is_preset, slots) values ('가짜기본', true, '[{"position":"GK","x":50,"y":92}]')$$,
  '기본 포메이션을 새로 만들 수 없다');

-- ── 거절 · 휴면 ──────────────────────────────────────────────────────
select verify.login('00000000-0000-0000-0000-000000000006');
select verify.ok((select status from public.members where id = '00000000-0000-0000-0000-000000000006') = 'rejected',
  '거절된 사람도 자기 상태는 본다');
select verify.ok((select count(*) from public.matches) = 0, '거절된 사람은 매치를 못 본다');

select verify.login('00000000-0000-0000-0000-000000000001');
update public.members set status = 'inactive' where id = '00000000-0000-0000-0000-000000000005';
select verify.login('00000000-0000-0000-0000-000000000005');
select verify.ok((select count(*) from public.matches) = 0, '휴면 처리되면 매치를 못 본다');

reset role;

-- ── 어드민 전용 계정 · 관리자 지정 (20261019010000) ──────────────────
--   …07 어드민 계정(멤버 행이 없다)
insert into auth.users (id, raw_user_meta_data) values ('00000000-0000-0000-0000-000000000007', '{}');
insert into public.owners (user_id) values ('00000000-0000-0000-0000-000000000007');

set role authenticated;
select verify.login('00000000-0000-0000-0000-000000000007');
select verify.ok((select is_owner from public.my_access()), '어드민 계정은 my_access 에서 어드민으로 나온다');
select verify.ok((select status from public.my_access()) is null, '어드민 계정은 멤버 행이 없다');
select verify.ok((select count(*) from public.members) = 5, '어드민은 모든 멤버를 본다');
select verify.ok((select count(*) from public.member_admin_info) = 2, '어드민은 멤버/용병 구분을 본다');
select public.set_member_role('00000000-0000-0000-0000-000000000002', 'admin');
select verify.ok((select role from public.members where id = '00000000-0000-0000-0000-000000000002') = 'admin',
  '어드민은 관리자를 지정한다');
select verify.fails($$select public.set_member_role('00000000-0000-0000-0000-000000000003', 'admin')$$,
  '승인 전인 사람은 관리자로 지정할 수 없다');
select public.approve_member('00000000-0000-0000-0000-000000000006', 'member');
select verify.ok((select status from public.members where id = '00000000-0000-0000-0000-000000000006') = 'approved',
  '거절한 사람도 다시 승인할 수 있다');
insert into public.matches (match_date, created_by)
values ('2026-11-01', '00000000-0000-0000-0000-000000000007');
select verify.ok(exists (select 1 from public.matches where created_by = '00000000-0000-0000-0000-000000000007'),
  '어드민은 매치를 만든다 — 만든 사람은 멤버가 아니라 인증 사용자를 가리킨다');

-- 어드민이 지정한 관리자(…02)
select verify.login('00000000-0000-0000-0000-000000000002');
select verify.ok(not (select is_owner from public.my_access()) and (select role from public.my_access()) = 'admin',
  '관리자는 my_access 에서 관리자로 나오고 어드민은 아니다');
select verify.fails($$select public.set_member_role('00000000-0000-0000-0000-000000000006', 'admin')$$,
  '관리자는 다른 사람을 관리자로 지정할 수 없다');
select verify.fails($$update public.members set role = 'admin' where id = '00000000-0000-0000-0000-000000000006'$$,
  '관리자도 역할을 직접 바꿀 수 없다');
select verify.fails($$select public.set_member_status('00000000-0000-0000-0000-000000000001', 'inactive')$$,
  '관리자는 다른 관리자를 휴면 처리할 수 없다');
select verify.fails($$update public.members set status = 'inactive' where id = '00000000-0000-0000-0000-000000000001'$$,
  '관리자는 다른 관리자의 상태를 직접 바꿀 수 없다');
select public.set_member_status('00000000-0000-0000-0000-000000000006', 'inactive');
select verify.ok((select status from public.members where id = '00000000-0000-0000-0000-000000000006') = 'inactive',
  '관리자는 일반 멤버를 휴면 처리한다');
select public.set_member_status('00000000-0000-0000-0000-000000000006', 'approved');
select verify.ok((select status from public.members where id = '00000000-0000-0000-0000-000000000006') = 'approved',
  '휴면에서 복귀시킨다');
select public.set_member_type('00000000-0000-0000-0000-000000000006', 'guest');
select verify.ok((select member_type from public.member_admin_info where member_id = '00000000-0000-0000-0000-000000000006') = 'guest',
  '관리자는 멤버/용병 구분을 바꾼다');
select verify.fails($$select public.set_member_status('00000000-0000-0000-0000-000000000003', 'approved')$$,
  '가입 대기는 휴면 함수로 승인할 수 없다');
select verify.fails($$select public.set_member_status('00000000-0000-0000-0000-000000000006', 'pending')$$,
  '휴면 함수로 대기 상태로 되돌릴 수 없다');
select verify.fails($$insert into public.owners (user_id) values ('00000000-0000-0000-0000-000000000002')$$,
  '스스로 어드민 계정이 될 수 없다');
select verify.ok((select count(*) from public.owners) = 0, '어드민 목록은 본인 것만 보인다');

-- 일반 멤버(…06)는 관리 함수를 하나도 못 쓴다
select verify.login('00000000-0000-0000-0000-000000000006');
select verify.fails($$select public.set_member_type('00000000-0000-0000-0000-000000000006', 'member')$$,
  '일반 멤버는 멤버/용병 구분을 못 바꾼다');
select verify.fails($$select public.set_member_status('00000000-0000-0000-0000-000000000005', 'approved')$$,
  '일반 멤버는 휴면을 못 푼다');

-- 어드민은 관리자도 휴면 처리하고 해제한다
select verify.login('00000000-0000-0000-0000-000000000007');
select public.set_member_status('00000000-0000-0000-0000-000000000001', 'inactive');
select verify.ok((select status from public.members where id = '00000000-0000-0000-0000-000000000001') = 'inactive',
  '어드민은 관리자를 휴면 처리한다');
select public.set_member_status('00000000-0000-0000-0000-000000000001', 'approved');
select public.set_member_role('00000000-0000-0000-0000-000000000002', 'user');
select verify.ok((select role from public.members where id = '00000000-0000-0000-0000-000000000002') = 'user',
  '어드민은 관리자를 해제한다');

-- 가입 안 한 외부인
select verify.login('00000000-0000-0000-0000-000000000004');
select verify.ok((select status from public.my_access()) is null and not (select is_owner from public.my_access()),
  '가입 안 한 사람은 멤버도 어드민도 아니다');

reset role;

-- ── 투표 마감 기본값 (20261019020000) ────────────────────────────────
-- 마감을 정하지 않으면 매치 시작(한국 시간)에 마감한다.
set role authenticated;
select verify.login('00000000-0000-0000-0000-000000000007');
insert into public.matches (id, match_date, starts_at) values
  ('10000000-0000-0000-0000-000000000011', current_date + 7, '10:00'),
  ('10000000-0000-0000-0000-000000000012', current_date - 7, '10:00');

select verify.login('00000000-0000-0000-0000-000000000006');
insert into public.match_attendance (match_id, member_id, response)
values ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000006', 'yes');
select verify.ok(exists (select 1 from public.match_attendance
  where match_id = '10000000-0000-0000-0000-000000000011' and member_id = '00000000-0000-0000-0000-000000000006'),
  '마감을 안 정한 매치는 시작 전까지 투표한다');
select verify.fails($$insert into public.match_attendance (match_id, member_id, response)
  values ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000006', 'yes')$$,
  '마감을 안 정한 매치도 시작한 뒤에는 투표하지 못한다');

reset role;

-- ── 스쿼드 저장 (20261019030000) ─────────────────────────────────────
set role authenticated;
select verify.login('00000000-0000-0000-0000-000000000007');
select public.save_squad('10000000-0000-0000-0000-000000000011', '[
  {"number": 1, "formation_name": "4-3-3", "slots": [
    {"slot_index": 0, "position": "GK", "x": 50, "y": 92, "member_id": null},
    {"slot_index": 1, "position": "FW", "x": 50, "y": 18, "member_id": "00000000-0000-0000-0000-000000000006"}]},
  {"number": 2, "formation_name": "4-4-2", "slots": [
    {"slot_index": 0, "position": "GK", "x": 50, "y": 92, "member_id": "00000000-0000-0000-0000-000000000006"}]}
]');
select verify.ok((select count(*) from public.quarters where match_id = '10000000-0000-0000-0000-000000000011') = 2,
  '어드민·관리자는 스쿼드를 한 번에 저장한다');
select verify.ok((select count(*) from public.quarter_slots s join public.quarters q on q.id = s.quarter_id
  where q.match_id = '10000000-0000-0000-0000-000000000011') = 3, '배치도 함께 저장된다');

select public.save_squad('10000000-0000-0000-0000-000000000011', '[
  {"number": 1, "formation_name": "4-4-2", "slots": []}
]');
select verify.ok((select count(*) from public.quarters where match_id = '10000000-0000-0000-0000-000000000011') = 1,
  '다시 저장하면 전의 스쿼드를 통째로 바꾼다');
select verify.fails($$select public.save_squad('10000000-0000-0000-0000-000000000011',
  '[{"number": 7, "formation_name": "4-3-3", "slots": []}]')$$,
  '쿼터 수를 넘는 쿼터는 저장하지 않는다');
select verify.ok((select count(*) from public.quarters where match_id = '10000000-0000-0000-0000-000000000011') = 1,
  '저장이 실패하면 전의 스쿼드가 그대로 남는다');
select verify.fails($$select public.save_squad('10000000-0000-0000-0000-000000000011', '[
  {"number": 1, "formation_name": "4-3-3", "slots": [
    {"slot_index": 0, "position": "GK", "x": 50, "y": 92, "member_id": "00000000-0000-0000-0000-000000000006"},
    {"slot_index": 1, "position": "FW", "x": 50, "y": 18, "member_id": "00000000-0000-0000-0000-000000000006"}]}
]')$$, '한 쿼터에 같은 사람을 두 번 넣을 수 없다');

select verify.login('00000000-0000-0000-0000-000000000006');
select verify.fails($$select public.save_squad('10000000-0000-0000-0000-000000000011', '[]')$$,
  '일반 멤버는 스쿼드를 저장하지 못한다');

reset role;

-- ── 카톡 공유용 공개 스쿼드 (20261019040000) ─────────────────────────
set role authenticated;
select verify.login('00000000-0000-0000-0000-000000000007');
select public.save_squad('10000000-0000-0000-0000-000000000011', '[
  {"number": 1, "formation_name": "4-3-3", "slots": [
    {"slot_index": 0, "position": "GK", "x": 50, "y": 92, "member_id": null},
    {"slot_index": 1, "position": "FW", "x": 50, "y": 18, "member_id": "00000000-0000-0000-0000-000000000006"}]}
]');
reset role;

-- anon 은 matches 를 못 읽으므로 토큰은 postgres 로 꺼내 둔다.
select set_config('verify.token', (select share_token::text from public.matches where id = '10000000-0000-0000-0000-000000000011'), false);

set role anon;
select verify.ok(public.shared_squad(current_setting('verify.token')::uuid) is null,
  '스쿼드를 공개하기 전에는 맞는 토큰이어도 공유 링크로 못 본다');
reset role;

set role authenticated;
select verify.login('00000000-0000-0000-0000-000000000007');
update public.matches set squad_published_at = now() where id = '10000000-0000-0000-0000-000000000011';
reset role;

set role anon;
select verify.ok(jsonb_array_length(public.shared_squad(current_setting('verify.token')::uuid) -> 'quarters') = 1,
  '공개하면 로그인 없이 공유 링크로 스쿼드를 본다');
select verify.ok(public.shared_squad(current_setting('verify.token')::uuid) #>> '{quarters,0,slots,1,name}' = '정거절',
  '자리에 앉은 사람의 실명을 준다');
select verify.ok(public.shared_squad(current_setting('verify.token')::uuid)::text not like '%00000000-0000-0000-0000-000000000006%',
  '멤버 id 는 주지 않는다');
select verify.ok(public.shared_squad(current_setting('verify.token')::uuid)::text not like '%guest%'
  and public.shared_squad(current_setting('verify.token')::uuid)::text not like '%member_type%',
  '멤버/용병 구분은 주지 않는다');
select verify.ok(public.shared_squad(gen_random_uuid()) is null, '틀린 토큰이면 아무것도 주지 않는다');
select verify.ok((select count(*) from public.quarters) = 0, '공유 함수 말고는 여전히 아무 표도 못 읽는다');
reset role;

-- ── 관리자 통계 원본 (20261019050000) ────────────────────────────────
-- 지난 매치(…12, 7일 전)에 스쿼드와 출석을 남겨 둔다.
set role authenticated;
select verify.login('00000000-0000-0000-0000-000000000007');
select public.save_squad('10000000-0000-0000-0000-000000000012', '[
  {"number": 1, "formation_name": "4-3-3", "slots": [
    {"slot_index": 0, "position": "GK", "x": 50, "y": 92, "member_id": "00000000-0000-0000-0000-000000000006"},
    {"slot_index": 1, "position": "FW", "x": 50, "y": 18, "member_id": "00000000-0000-0000-0000-000000000002"}]},
  {"number": 2, "formation_name": "4-3-3", "slots": [
    {"slot_index": 0, "position": "GK", "x": 50, "y": 92, "member_id": null},
    {"slot_index": 1, "position": "FW", "x": 50, "y": 18, "member_id": "00000000-0000-0000-0000-000000000002"}]}
]');
insert into public.match_attendance (match_id, member_id, attended)
values ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', true);

select set_config('verify.stats', public.admin_stats_source(current_date - 30, current_date)::text, false);
select verify.ok(jsonb_array_length(current_setting('verify.stats')::jsonb -> 'matches') =
  (select count(*) from public.matches where match_date between current_date - 30 and current_date - 1),
  '기간 안의 지난 매치만 준다(오늘·앞으로의 매치는 빼고)');
select verify.ok(exists (
  select 1 from jsonb_array_elements(current_setting('verify.stats')::jsonb -> 'entries') e
   where e ->> 'match_id' = '10000000-0000-0000-0000-000000000012'
     and e ->> 'member_id' = '00000000-0000-0000-0000-000000000002'
     and (e ->> 'field_quarters')::int = 2 and (e ->> 'attended')::boolean),
  '매치 × 멤버마다 필드 쿼터와 실제 출석을 준다');
select verify.ok(exists (
  select 1 from jsonb_array_elements(current_setting('verify.stats')::jsonb -> 'entries') e
   where e ->> 'member_id' = '00000000-0000-0000-0000-000000000006'
     and (e ->> 'keeper_quarters')::int = 1 and (e ->> 'field_quarters')::int = 0),
  '키퍼 쿼터는 따로 센다 — 투표가 없어도 스쿼드에 들었으면 나온다');
select verify.ok(exists (
  select 1 from jsonb_array_elements(current_setting('verify.stats')::jsonb -> 'members') m
   where m ->> 'id' = '00000000-0000-0000-0000-000000000006' and m ->> 'member_type' = 'guest'),
  '멤버/용병 구분을 준다(관리자 화면 전용)');
select verify.ok(not exists (
  select 1 from jsonb_array_elements(current_setting('verify.stats')::jsonb -> 'members') m
   where m ->> 'id' = '00000000-0000-0000-0000-000000000003'),
  '가입 대기 중인 사람은 통계에 없다');

select verify.login('00000000-0000-0000-0000-000000000006');
select verify.fails($$select public.admin_stats_source(current_date - 30, current_date)$$,
  '일반 멤버는 통계 원본을 못 읽는다');
reset role;

-- ── 선수별 특이사항 (20261019060000) ─────────────────────────────────
set role authenticated;
select verify.login('00000000-0000-0000-0000-000000000007');
insert into public.match_notes (match_id, member_id, note, updated_by)
values ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', '무릎 안 좋음 — 수비만',
        '00000000-0000-0000-0000-000000000007');
select verify.ok((select count(*) from public.match_notes) = 1, '어드민은 특이사항을 쓰고 본다');
select verify.fails($$insert into public.match_notes (match_id, member_id, note)
  values ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000006', '   ')$$,
  '빈 특이사항은 저장하지 않는다');

select verify.login('00000000-0000-0000-0000-000000000001');
select verify.ok((select note from public.match_notes) = '무릎 안 좋음 — 수비만', '관리자도 특이사항을 본다');

select verify.login('00000000-0000-0000-0000-000000000002');
select verify.ok((select count(*) from public.match_notes) = 0, '일반 멤버는 자기에 대한 특이사항도 못 본다');
select verify.fails($$insert into public.match_notes (match_id, member_id, note)
  values ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', '내가 쓴 메모')$$,
  '일반 멤버는 특이사항을 못 쓴다');
reset role;

set role anon;
select verify.ok(public.shared_squad(current_setting('verify.token')::uuid)::text not like '%무릎%',
  '공유 링크에는 특이사항이 없다');
reset role;

-- ── 경기 결과 (20261019070000) ───────────────────────────────────────
set role authenticated;
select verify.login('00000000-0000-0000-0000-000000000001');
insert into public.match_quarter_results (match_id, number, their_score)
values ('10000000-0000-0000-0000-000000000012', 1, 1);
insert into public.match_goals (match_id, quarter_number, scorer_id, assist_id) values
  ('10000000-0000-0000-0000-000000000012', 1, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006'),
  ('10000000-0000-0000-0000-000000000012', 1, null, null);
select verify.ok((select count(*) from public.match_goals where match_id = '10000000-0000-0000-0000-000000000012') = 2,
  '관리자는 골을 기록한다 — 득점자를 모르는 골도');
select verify.fails($$insert into public.match_goals (match_id, quarter_number, scorer_id)
  values ('10000000-0000-0000-0000-000000000012', 7, '00000000-0000-0000-0000-000000000002')$$,
  '쿼터 수를 넘는 쿼터에는 기록하지 않는다');
select verify.fails($$insert into public.match_quarter_results (match_id, number, their_score)
  values ('10000000-0000-0000-0000-000000000012', 9, 0)$$,
  '쿼터 수를 넘는 쿼터 점수는 기록하지 않는다');
select verify.fails($$insert into public.match_goals (match_id, quarter_number, scorer_id, assist_id)
  values ('10000000-0000-0000-0000-000000000012', 1, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002')$$,
  '득점자와 도움이 같은 사람일 수 없다');

select verify.login('00000000-0000-0000-0000-000000000006');
select verify.ok((select count(*) from public.match_goals) = 2, '승인된 팀원은 결과를 본다');
select verify.fails($$insert into public.match_goals (match_id, quarter_number, scorer_id)
  values ('10000000-0000-0000-0000-000000000012', 2, '00000000-0000-0000-0000-000000000006')$$,
  '일반 멤버는 골을 기록하지 못한다');
select verify.fails($$insert into public.match_quarter_results (match_id, number, their_score)
  values ('10000000-0000-0000-0000-000000000012', 2, 3)$$,
  '일반 멤버는 점수를 기록하지 못한다');

select verify.login('00000000-0000-0000-0000-000000000003');
select verify.ok((select count(*) from public.match_goals) = 0, '가입 대기 중엔 결과를 못 본다');

select verify.login('00000000-0000-0000-0000-000000000001');
select set_config('verify.stats2', public.admin_stats_source(current_date - 30, current_date)::text, false);
select verify.ok(exists (
  select 1 from jsonb_array_elements(current_setting('verify.stats2')::jsonb -> 'entries') e
   where e ->> 'member_id' = '00000000-0000-0000-0000-000000000002' and (e ->> 'goals')::int = 1),
  '통계 원본에 득점이 들어간다');
select verify.ok(exists (
  select 1 from jsonb_array_elements(current_setting('verify.stats2')::jsonb -> 'entries') e
   where e ->> 'member_id' = '00000000-0000-0000-0000-000000000006' and (e ->> 'assists')::int = 1),
  '통계 원본에 도움이 들어간다');
select verify.ok(exists (
  select 1 from jsonb_array_elements(current_setting('verify.stats2')::jsonb -> 'matches') m,
                jsonb_array_elements(m -> 'quarter_scores') q
   where m ->> 'id' = '10000000-0000-0000-0000-000000000012'
     and (q ->> 'ours')::int = 2 and (q ->> 'theirs')::int = 1),
  '통계 원본에 쿼터 점수(우리 = 골 기록 수)가 들어간다');
reset role;

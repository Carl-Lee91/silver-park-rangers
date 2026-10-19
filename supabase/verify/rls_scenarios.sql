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
--   …01 운영진   …02 멤버   …03 가입 대기   …04 로그인만 한 외부인   …05 용병   …06 거절될 사람
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
  '스스로 운영진으로 가입할 수 없다');
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
  '스스로 운영진이 될 수 없다');
select verify.fails($$update public.members set real_name = '바꾼이름' where id = '00000000-0000-0000-0000-000000000003'$$,
  '실명은 스스로 못 바꾼다');
update public.members set feet = '{left}' where id = '00000000-0000-0000-0000-000000000003';
select verify.ok((select feet from public.members where id = '00000000-0000-0000-0000-000000000003') = '{left}',
  '주발은 스스로 바꾼다');
select verify.fails($$select public.approve_member('00000000-0000-0000-0000-000000000003', 'member')$$,
  '운영진이 아니면 승인할 수 없다');
reset role;

-- ── 첫 운영진은 SQL 편집기(postgres)에서 지정한다 ─────────────────────
update public.members set role = 'admin', status = 'approved'
 where id = '00000000-0000-0000-0000-000000000001';

-- ── 운영진 승인 · 거절 ───────────────────────────────────────────────
set role authenticated;
select verify.login('00000000-0000-0000-0000-000000000001');
select verify.ok((select count(*) from public.members) = 5, '운영진은 가입 대기 중인 사람까지 모두 본다');
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
select verify.fails($$select public.approve_member('00000000-0000-0000-0000-000000000006', 'member')$$,
  '거절된 사람은 승인 대기가 아니다');

-- ── 승인된 일반 멤버 ─────────────────────────────────────────────────
select verify.login('00000000-0000-0000-0000-000000000002');
select verify.ok((select count(*) from public.members) = 3, '승인된 사람은 승인된 멤버만 본다');
select verify.ok((select count(*) from public.member_admin_info) = 0, '멤버/용병 구분은 운영진만 본다');
select verify.ok((select count(*) from public.formations where is_preset) = 2, '기본 포메이션 두 개를 본다');
select verify.fails($$insert into public.matches (match_date) values ('2026-10-25')$$,
  '일반 멤버는 매치를 못 만든다');
select verify.fails($$insert into public.formations (name, slots) values ('3-5-2', '[{"position":"GK","x":50,"y":92}]')$$,
  '일반 멤버는 포메이션을 못 만든다');
select verify.fails($$select public.approve_member('00000000-0000-0000-0000-000000000003', 'member')$$,
  '일반 멤버는 승인할 수 없다');
select verify.fails($$update public.members set role = 'admin' where id = '00000000-0000-0000-0000-000000000002'$$,
  '승인된 뒤에도 스스로 운영진이 될 수 없다');

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
  '운영진은 실제 출석을 확정한다');
insert into public.match_attendance (match_id, member_id, attended)
values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', true);
select verify.ok((select count(*) from public.match_attendance
  where match_id = '10000000-0000-0000-0000-000000000002') = 1,
  '운영진은 마감 뒤에도 투표 안 한 사람의 출석을 기록한다');

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
select verify.ok((select count(*) from public.formations) = 3, '운영진은 커스텀 포메이션을 저장한다');
update public.formations set name = '4-3-3 수정' where name = '4-3-3';
select verify.ok(exists (select 1 from public.formations where name = '4-3-3'),
  '기본 포메이션은 운영진도 못 고친다');
delete from public.formations where name = '4-4-2';
select verify.ok(exists (select 1 from public.formations where name = '4-4-2'),
  '기본 포메이션은 운영진도 못 지운다');
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

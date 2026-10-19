-- 가입 신청 실시간 알림 (docs/PLAN.md §10 1차)
--
-- 관리 화면이 members 의 바뀜을 실시간으로 받아 가입 신청 수와 목록을 새로 그린다.
-- Supabase Realtime 도 RLS 를 따른다 — 가입 대기 행은 관리자 이상만 받는다(members_select).

alter publication supabase_realtime add table public.members;

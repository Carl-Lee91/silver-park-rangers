-- Supabase 가 프로젝트에 기본으로 깔아 두는 것 중, 마이그레이션이 기대는 부분만 흉내 낸다.
-- 🔴 운영 스키마가 아니다. 로컬 검증(run.sh) 전용이다.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

-- 인증 서버가 쓰는 컬럼 중 마이그레이션이 읽고 쓰는 것만 둔다.
create table auth.users (
  id uuid primary key,
  email text,
  encrypted_password text,
  raw_user_meta_data jsonb not null default '{}',
  updated_at timestamptz
);

-- Supabase 는 pgcrypto 를 extensions 스키마에 깔아 둔다(임시 비밀번호의 bcrypt).
create schema extensions;
create extension pgcrypto with schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

-- Supabase 의 auth.uid() 와 같은 방식으로 요청의 JWT 에서 사용자 id 를 꺼낸다.
create function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;

-- Supabase 는 public 의 새 테이블·함수 권한을 anon·authenticated 에 기본으로 준다.
-- 그래서 RLS 가 유일한 막이다. 검증도 같은 조건에서 한다.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- Supabase 가 만들어 두는 Realtime 발행. 마이그레이션이 여기에 표를 더한다.
create publication supabase_realtime;

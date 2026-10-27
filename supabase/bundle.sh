#!/usr/bin/env bash
# 새 Supabase 프로젝트에 깔 마이그레이션 한 묶음을 출력한다. SQL Editor 에 한 번 붙여 실행한다(docs/SETUP.md §1).
#
#   pnpm -s db:bundle | pbcopy     # 맥: 클립보드로
#
# 한 트랜잭션이라 중간에 하나라도 실패하면 아무것도 깔리지 않는다 — 고쳐서 다시 붙이면 된다.
# pnpm db:verify(CI 포함)가 이 묶음을 그대로 깔아 RLS 시나리오를 검사한다.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS=("$ROOT"/supabase/migrations/*.sql)

echo "-- Silver Park Rangers: supabase/migrations ${#MIGRATIONS[@]}개를 이름 순서대로 한 트랜잭션에"
echo "begin;"
for migration in "${MIGRATIONS[@]}"; do
  echo
  echo "-- ── $(basename "$migration") ──"
  cat "$migration"
  echo
done
echo "commit;"

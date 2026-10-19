#!/usr/bin/env bash
# 로컬 Postgres 에 임시 DB 를 띄워 마이그레이션을 적용하고 RLS 시나리오를 검증한다.
# Docker 없이 Homebrew Postgres 만 있으면 된다. 끝나면 임시 DB 는 지운다.
#
#   pnpm db:verify
#   PG_BIN=/path/to/postgres/bin pnpm db:verify   # 다른 Postgres 를 쓸 때
set -euo pipefail

PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@17/bin}"
PORT="${PORT:-54329}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d)"

cleanup() {
  "$PG_BIN/pg_ctl" -D "$WORK/data" stop -m fast >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

"$PG_BIN/initdb" -D "$WORK/data" -U postgres --auth=trust --no-locale -E UTF8 >/dev/null
"$PG_BIN/pg_ctl" -D "$WORK/data" -l "$WORK/log" -w \
  -o "-p $PORT -k $WORK -c listen_addresses=''" start >/dev/null

run_sql() {
  "$PG_BIN/psql" -h "$WORK" -p "$PORT" -U postgres -d postgres \
    -v ON_ERROR_STOP=1 -q -X "$@"
}

run_sql -f "$ROOT/supabase/verify/00_supabase_stub.sql"
for migration in "$ROOT"/supabase/migrations/*.sql; do
  run_sql -f "$migration"
done
run_sql -o /dev/null -f "$ROOT/supabase/verify/rls_scenarios.sql" 2>&1 | sed 's/^psql:[^ ]* NOTICE:  //'

echo "✓ 마이그레이션 적용 + RLS 시나리오 통과"

#!/usr/bin/env bash
# 로컬에 설치된 PostgreSQL(~/.local/pgsql)을 ~/.local/pgdata 데이터로 기동한다.
set -euo pipefail

PGBIN="$HOME/.local/pgsql/bin"
PGDATA="$HOME/.local/pgdata"

if [ ! -d "$PGDATA" ]; then
  echo "데이터 디렉터리가 없습니다. 최초 1회 초기화합니다: $PGDATA"
  "$PGBIN/initdb" -D "$PGDATA" -U postgres -A trust -E UTF8 --locale=en_US.UTF-8
fi

"$PGBIN/pg_ctl" -D "$PGDATA" -l /tmp/pglog.log -o "-p 5432 -k /tmp" start
"$PGBIN/pg_isready" -p 5432 -h /tmp

if ! "$PGBIN/psql" -h 127.0.0.1 -p 5432 -U postgres -lqt | cut -d '|' -f 1 | grep -qw studydb; then
  "$PGBIN/createdb" -h 127.0.0.1 -p 5432 -U postgres studydb
  echo "studydb 데이터베이스를 생성했습니다."
fi

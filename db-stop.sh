#!/usr/bin/env bash
# 로컬 PostgreSQL(~/.local/pgdata)을 정지한다.
set -euo pipefail

PGBIN="$HOME/.local/pgsql/bin"
PGDATA="$HOME/.local/pgdata"

"$PGBIN/pg_ctl" -D "$PGDATA" stop -m fast

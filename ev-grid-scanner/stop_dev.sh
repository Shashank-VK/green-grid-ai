#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
BACKEND_PIDFILE="$LOG_DIR/backend.pid"
FRONTEND_PIDFILE="$LOG_DIR/frontend.pid"

say() { printf '%s\n' "$*"; }

kill_from_pidfile() {
  local name="$1" pidfile="$2"
  if [[ -f "$pidfile" ]]; then
    local pid
    pid="$(cat "$pidfile" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      say "Stopping $name (pid $pid)"
      kill "$pid" 2>/dev/null || true
      sleep 0.2
      if kill -0 "$pid" 2>/dev/null; then
        say "Force-stopping $name (pid $pid)"
        kill -9 "$pid" 2>/dev/null || true
      fi
    fi
    rm -f "$pidfile" || true
  fi
}

main() {
  kill_from_pidfile "frontend" "$FRONTEND_PIDFILE"
  kill_from_pidfile "backend" "$BACKEND_PIDFILE"

  # Fallbacks (reload processes may fork)
  if command -v pkill >/dev/null 2>&1; then
    pkill -f 'next dev' 2>/dev/null || true
    pkill -f 'uvicorn.*app\.main:app' 2>/dev/null || true
    pkill -f 'python.*-m uvicorn.*app\.main:app' 2>/dev/null || true
  fi

  say "Stopped (as best-effort)."
}

main "$@"

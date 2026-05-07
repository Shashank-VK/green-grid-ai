#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/logs"
PID_DIR="$ROOT_DIR/logs"

BACKEND_PIDFILE="$PID_DIR/backend.pid"
FRONTEND_PIDFILE="$PID_DIR/frontend.pid"

mkdir -p "$LOG_DIR"

say() { printf '%s\n' "$*"; }

is_running_pidfile() {
  local pidfile="$1"
  [[ -f "$pidfile" ]] || return 1
  local pid
  pid="$(cat "$pidfile" 2>/dev/null || true)"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

check_ollama() {
  if command -v curl >/dev/null 2>&1; then
    if curl -fsS "http://localhost:11434/api/tags" >/dev/null 2>&1; then
      say "Ollama: OK (http://localhost:11434)"
      return 0
    fi
  fi
  say "Ollama: NOT reachable on http://localhost:11434"
  say " - If you installed it as a service, run: sudo systemctl start ollama"
  say " - Ensure model exists: ollama pull gemma4:e4b"
  return 0
}

ensure_backend_env() {
  cd "$BACKEND_DIR"

  if [[ ! -d .venv ]]; then
    say "Backend venv missing; creating backend/.venv"
    python3 -m venv --copies .venv
  fi

  local py="$BACKEND_DIR/.venv/bin/python"
  say "Backend python: $py"

  "$py" -m pip install -U pip setuptools wheel >/dev/null
  "$py" -m pip install -r requirements.txt
}

ensure_frontend_env() {
  cd "$FRONTEND_DIR"

  if [[ ! -d node_modules ]]; then
    say "Frontend node_modules missing; installing"
    if [[ -f package-lock.json ]]; then
      npm ci
    else
      npm install
    fi
  fi
}

start_backend() {
  cd "$BACKEND_DIR"

  if is_running_pidfile "$BACKEND_PIDFILE"; then
    say "Backend already running (pid $(cat "$BACKEND_PIDFILE"))"
    return 0
  fi

  local py="$BACKEND_DIR/.venv/bin/python"
  if [[ ! -x "$py" ]]; then
    say "Backend venv not ready. Run will bootstrap it now."
    ensure_backend_env
  fi

  say "Starting backend on http://localhost:8000 (logs: $LOG_DIR/backend.log)"
  nohup "$py" -m uvicorn app.main:app --reload --port 8000 > "$LOG_DIR/backend.log" 2>&1 &
  echo $! > "$BACKEND_PIDFILE"
}

start_frontend() {
  cd "$FRONTEND_DIR"

  if is_running_pidfile "$FRONTEND_PIDFILE"; then
    say "Frontend already running (pid $(cat "$FRONTEND_PIDFILE"))"
    return 0
  fi

  say "Starting frontend on http://localhost:3000 (logs: $LOG_DIR/frontend.log)"
  nohup env PORT=3000 npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
  echo $! > "$FRONTEND_PIDFILE"
}

health_checks() {
  if ! command -v curl >/dev/null 2>&1; then
    return 0
  fi

  for i in {1..30}; do
    code="$(curl -sS -o /dev/null -w '%{http_code}' http://localhost:8000/api/health || true)"
    [[ "$code" == "200" ]] && break
    sleep 0.2
  done

  for i in {1..30}; do
    code="$(curl -sS -o /dev/null -w '%{http_code}' http://localhost:3000/ || true)"
    [[ "$code" == "200" ]] && break
    sleep 0.2
  done
}

main() {
  check_ollama
  ensure_backend_env
  ensure_frontend_env

  start_backend
  start_frontend
  health_checks

  say ""
  say "Up:"
  say " - Frontend: http://localhost:3000"
  say " - Backend:  http://localhost:8000"
  say " - Ollama:   http://localhost:11434"
  say ""
  say "To stop everything: $ROOT_DIR/stop_dev.sh"
}

main "$@"

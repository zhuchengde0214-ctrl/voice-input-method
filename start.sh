#!/usr/bin/env bash
# Start the voice input method app (single-port: backend serves frontend too).
# Usage:
#   ./start.sh        — run in foreground, Ctrl+C to stop
#   ./start.sh -d     — run detached in background, survives terminal exit

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
LOG_FILE="${LOG_FILE:-/tmp/voice-app.log}"
PID_FILE="${PID_FILE:-/tmp/voice-app.pid}"
PORT="${PORT:-3001}"

cd "$BACKEND_DIR"

if [ ! -d node_modules ]; then
  echo "[start.sh] installing backend dependencies..."
  npm install --silent
fi

# Stop any previous instance
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "[start.sh] stopping previous instance (PID $(cat "$PID_FILE"))"
  kill "$(cat "$PID_FILE")" || true
  sleep 1
fi
pkill -f "node src/server.js" 2>/dev/null || true
sleep 1

if [ "${1:-}" = "-d" ]; then
  echo "[start.sh] launching detached, log=$LOG_FILE"
  nohup setsid env PORT="$PORT" node src/server.js > "$LOG_FILE" 2>&1 < /dev/null &
  echo $! > "$PID_FILE"
  disown -a 2>/dev/null || true
  sleep 2
  if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "[start.sh] running, PID $(cat "$PID_FILE"), open http://localhost:$PORT"
    echo "[start.sh] tail logs:  tail -f $LOG_FILE"
    echo "[start.sh] stop:       ./stop.sh"
  else
    echo "[start.sh] failed to start. Check $LOG_FILE"
    tail "$LOG_FILE"
    exit 1
  fi
else
  echo "[start.sh] foreground on http://localhost:$PORT  (Ctrl+C to stop)"
  exec env PORT="$PORT" node src/server.js
fi

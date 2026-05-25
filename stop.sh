#!/usr/bin/env bash
PID_FILE="${PID_FILE:-/tmp/voice-app.pid}"
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  kill "$(cat "$PID_FILE")"
  echo "[stop.sh] stopped PID $(cat "$PID_FILE")"
  rm -f "$PID_FILE"
else
  pkill -f "node src/server.js" && echo "[stop.sh] killed by name" || echo "[stop.sh] nothing to stop"
fi

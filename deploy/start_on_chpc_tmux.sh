#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-$HOME/chpc-gpu-finder}"
SESSION="${CHPC_GPU_FINDER_TMUX_SESSION:-chpc-gpu-finder}"
ENV_FILE="$REPO_DIR/.env"
RUNTIME_DIR="$REPO_DIR/.runtime"
RUNNER="$RUNTIME_DIR/run_server.sh"
LOG_FILE="$RUNTIME_DIR/server.log"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is required for this helper. Start server.py directly if tmux is unavailable." >&2
  exit 1
fi

if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "Repo directory not found: $REPO_DIR" >&2
  echo "Clone it first: git clone https://github.com/Sameeranjoshi/WHOISHOGGING.git '$REPO_DIR'" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$REPO_DIR/deploy/chpc-login.env.example" "$ENV_FILE"
  echo "Created $ENV_FILE from deploy/chpc-login.env.example"
fi

cd "$REPO_DIR"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

export CHPC_COLLECTOR_MODE="${CHPC_COLLECTOR_MODE:-local}"
export CHPC_GPU_FINDER_HOST="${CHPC_GPU_FINDER_HOST:-127.0.0.1}"
export CHPC_GPU_FINDER_PORT="${CHPC_GPU_FINDER_PORT:-8000}"

if ! python3 sync_pages_data.py; then
  echo "Initial data refresh failed. The server will still start and serve the last good snapshots." >&2
fi

if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux kill-session -t "$SESSION"
fi

mkdir -p "$RUNTIME_DIR"

printf -v quoted_repo "%q" "$REPO_DIR"
printf -v quoted_env "%q" "$ENV_FILE"
printf -v quoted_log "%q" "$LOG_FILE"
printf -v quoted_runner "%q" "$RUNNER"

cat > "$RUNNER" <<EOF
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=$quoted_repo
ENV_FILE=$quoted_env
LOG_FILE=$quoted_log

{
  echo "[\$(date -Is)] starting CHPC GPU Finder server"
  cd "\$REPO_DIR"
  set -a
  # shellcheck disable=SC1090
  source "\$ENV_FILE"
  set +a

  export CHPC_COLLECTOR_MODE="\${CHPC_COLLECTOR_MODE:-local}"
  export CHPC_GPU_FINDER_HOST="\${CHPC_GPU_FINDER_HOST:-127.0.0.1}"
  export CHPC_GPU_FINDER_PORT="\${CHPC_GPU_FINDER_PORT:-8000}"

  echo "repo=\$REPO_DIR"
  echo "host=\$CHPC_GPU_FINDER_HOST"
  echo "port=\$CHPC_GPU_FINDER_PORT"
  exec python3 -u server.py --host "\$CHPC_GPU_FINDER_HOST" --port "\$CHPC_GPU_FINDER_PORT"
} >> "\$LOG_FILE" 2>&1
EOF
chmod +x "$RUNNER"
: > "$LOG_FILE"

tmux new-session -d -s "$SESSION" "bash $quoted_runner"
sleep 1

if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "tmux session exited during startup. Last log lines:" >&2
  tail -n 80 "$LOG_FILE" >&2 || true
  exit 1
fi

echo "Started tmux session: $SESSION"
echo "Backend: http://${CHPC_GPU_FINDER_HOST}:${CHPC_GPU_FINDER_PORT}"
echo "Attach logs: tmux attach -t $SESSION"
echo "Server log: $LOG_FILE"

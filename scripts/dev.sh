#!/bin/bash

# OddsCast dev environment start script (tmux)
# Splits into 4 panes:
# 1. Docker (Postgres + Redis)
# 2. Server (port 3001)
# 3. WebApp (port 3000)
# 4. Admin (port 3002)

set -e

PROJECT_DIR="/Users/risingcore/Desktop/work/oddscast"
SESSION_NAME="oddscast-dev"

if ! command -v tmux &> /dev/null; then
    echo "tmux is not installed. Install with: brew install tmux"
    exit 1
fi

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Session '$SESSION_NAME' already running."
    echo "  Attach: tmux attach -t $SESSION_NAME"
    echo "  Kill:   tmux kill-session -t $SESSION_NAME"
    exit 0
fi

echo "Starting OddsCast dev environment..."
echo ""
echo "Services:"
echo "  - Docker (Postgres:5432, Redis:6379)"
echo "  - Server (port 3001)"
echo "  - WebApp (port 3000)"
echo "  - Admin  (port 3002)"
echo ""

# Create tmux session - Pane 0: Docker
tmux new-session -d -s "$SESSION_NAME" -n "dev" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION_NAME:0.0" "docker compose up postgres redis" C-m

# Pane 1 (right): Server
tmux split-window -t "$SESSION_NAME:0.0" -h -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION_NAME:0.1" "sleep 5 && cd $PROJECT_DIR/server && pnpm run dev" C-m

# Pane 2 (bottom-left): WebApp
tmux split-window -t "$SESSION_NAME:0.0" -v -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION_NAME:0.2" "sleep 3 && cd $PROJECT_DIR/webapp && pnpm run dev" C-m

# Pane 3 (bottom-right): Admin
tmux split-window -t "$SESSION_NAME:0.1" -v -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION_NAME:0.3" "sleep 3 && cd $PROJECT_DIR/admin && pnpm run dev" C-m

# 2x2 tiled layout
tmux select-layout -t "$SESSION_NAME:0" tiled
tmux set -t "$SESSION_NAME" mouse on
tmux select-pane -t "$SESSION_NAME:0.1"

echo "Dev environment started!"
echo ""
echo "  Docker:  Postgres :5432 / Redis :6379"
echo "  Server:  http://localhost:3001"
echo "  WebApp:  http://localhost:3000"
echo "  Admin:   http://localhost:3002"
echo "  Swagger: http://localhost:3001/docs"
echo ""
echo "tmux commands:"
echo "  Attach:      tmux attach -t $SESSION_NAME"
echo "  Kill:        tmux kill-session -t $SESSION_NAME"
echo "  Switch pane: Ctrl+b then arrow keys"
echo "  Scroll:      Ctrl+b then [ (q to exit)"
echo ""
echo "Attaching to session..."

tmux attach -t "$SESSION_NAME"

#!/usr/bin/env bash
# Deploy Skippity to a DigitalOcean droplet with Docker.
# Usage:
#   ./deploy/droplet.sh root@YOUR_DROPLET_IP
# Optional:
#   PORT=8080 ./deploy/droplet.sh root@YOUR_DROPLET_IP

set -euo pipefail

REMOTE="${1:-}"
PORT="${PORT:-80}"
APP_NAME="skippity"
REMOTE_DIR="/opt/skippity"

if [[ -z "$REMOTE" ]]; then
  echo "Usage: $0 user@droplet-ip"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Ensuring Docker is installed on $REMOTE…"
ssh "$REMOTE" 'bash -s' <<'EOF'
set -euo pipefail
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
mkdir -p /opt/skippity
EOF

echo "→ Syncing project files…"
rsync -az --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  "$ROOT/" "$REMOTE:$REMOTE_DIR/"

echo "→ Building and starting container on port $PORT…"
ssh "$REMOTE" "bash -s" <<EOF
set -euo pipefail
cd $REMOTE_DIR
docker build -t $APP_NAME .
docker rm -f $APP_NAME >/dev/null 2>&1 || true
docker run -d --name $APP_NAME --restart unless-stopped -p $PORT:80 $APP_NAME
echo "Live at http://\$(curl -s ifconfig.me):$PORT"
EOF

echo "✓ Deploy complete"

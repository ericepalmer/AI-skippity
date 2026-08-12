#!/usr/bin/env bash
# Deploy static site to DreamHost for games.palton.xyz
#
# Landing page: static HTML at site root
# Game:        /skippity/
#
# Usage:
#   ./deploy/dreamhost.sh USER@SERVER
# Example:
#   ./deploy/dreamhost.sh epalmer@iad1-shared-b8-01.dreamhost.com

set -euo pipefail

REMOTE="${1:-}"
REMOTE_PATH="${DREAMHOST_PATH:-games.palton.xyz}"

if [[ -z "$REMOTE" ]]; then
  echo "Usage: $0 USER@dreamhost-server"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Building site…"
npm run build

echo "→ Uploading to $REMOTE:~/$REMOTE_PATH …"
rsync -avz --delete \
  --exclude .DS_Store \
  dist/ "$REMOTE:~/$REMOTE_PATH/"

echo "✓ Live at https://games.palton.xyz"
echo "  Game: https://games.palton.xyz/skippity/"

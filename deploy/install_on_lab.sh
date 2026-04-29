#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${1:-https://github.com/Sameeranjoshi/WHOISHOGGING.git}"
INSTALL_DIR="${2:-$HOME/chpc-gpu-finder}"
SYSTEMD_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"

echo "Installing CHPC GPU Finder into: $INSTALL_DIR"

if [[ -d "$INSTALL_DIR/.git" ]]; then
  git -C "$INSTALL_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

mkdir -p "$SYSTEMD_DIR"
cp "$INSTALL_DIR/deploy/chpc-gpu-finder.service" "$SYSTEMD_DIR/"
cp "$INSTALL_DIR/deploy/chpc-gpu-finder-sync.service" "$SYSTEMD_DIR/"
cp "$INSTALL_DIR/deploy/chpc-gpu-finder-sync.timer" "$SYSTEMD_DIR/"

python3 "$INSTALL_DIR/sync_pages_data.py"

systemctl --user daemon-reload
systemctl --user enable --now chpc-gpu-finder.service
systemctl --user enable --now chpc-gpu-finder-sync.timer

echo
echo "Done."
echo "Check status with:"
echo "  systemctl --user status chpc-gpu-finder.service"
echo "  systemctl --user status chpc-gpu-finder-sync.timer"
echo
echo "If you need the service to survive logout, run:"
echo "  loginctl enable-linger \"$USER\""

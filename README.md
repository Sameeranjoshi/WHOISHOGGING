# CHPC GPU Finder

This repo is now aimed at a lab-machine deployment, not just GitHub Pages.

It keeps the two shell scripts intact:

- `docs/free_chpc_gpus.sh`
- `docs/whoishogging.sh`

The lab machine serves:

- the UI from `docs/`
- live-ish JSON from `/api/free-gpus` and `/api/whoishogging`
- raw script output from `/api/raw/free-gpus` and `/api/raw/whoishogging`

## How it works

1. The UI is served by `server.py`.
2. The server reads current data from `docs/data/*.json`.
3. `sync_pages_data.py` runs the exact shell scripts and regenerates those JSON files.
4. The refresh button calls `POST /api/refresh` on the lab machine.
5. A systemd timer can refresh the data every 5 minutes so the site stays warm.

## Local preview

```bash
cd '/Users/sameeranjoshi/Documents/New project'
python3 server.py --host 127.0.0.1 --port 8000
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Lab machine deployment

The easiest path is a user-level install on the lab machine. No root is required.

Because the lab machine itself does not have CHPC scheduler commands, the recommended setup is:

1. Web server on the lab machine
2. Data collection over SSH to a CHPC login node
3. Exact scripts executed remotely on that CHPC-side checkout

## One-time SSH collector setup

On the lab machine, create a key for the collector:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/chpc_gpu_finder -N ""
```

Copy that key to the CHPC login account you want to use for collection:

```bash
ssh-copy-id -i ~/.ssh/chpc_gpu_finder.pub u1418973@notchpeak.chpc.utah.edu
```

Test it:

```bash
ssh -i ~/.ssh/chpc_gpu_finder notchpeak-login 'hostname && whoami'
```

Also make sure the repo exists on the CHPC side, because the lab machine will SSH there and run the exact scripts from that checkout:

```bash
ssh -i ~/.ssh/chpc_gpu_finder notchpeak-login 'git clone https://github.com/Sameeranjoshi/WHOISHOGGING.git ~/chpc-gpu-finder || git -C ~/chpc-gpu-finder pull --ff-only'
```

After you SSH to the lab host:

```bash
git clone https://github.com/Sameeranjoshi/WHOISHOGGING.git ~/chpc-gpu-finder
bash ~/chpc-gpu-finder/deploy/install_on_lab.sh
```

That script will:

1. Clone or update the repo in `~/chpc-gpu-finder`
2. Run an initial sync using the exact shell scripts
3. Install user-level `systemd` units
4. Start the web server and 5-minute refresh timer

The install script creates `~/chpc-gpu-finder/.env` from an example file on first run. For the SSH collector path, it should look roughly like:

```bash
CHPC_GPU_FINDER_REFRESH_INTERVAL=300
CHPC_COLLECTOR_MODE=ssh
CHPC_COLLECTOR_SSH_TARGET=notchpeak-login
CHPC_COLLECTOR_SSH_IDENTITY_FILE=%h/.ssh/chpc_gpu_finder
CHPC_REMOTE_REPO_DIR=$HOME/chpc-gpu-finder
```

## Manual start

If you want to test before enabling services:

```bash
cd ~/chpc-gpu-finder
python3 sync_pages_data.py
CHPC_GPU_FINDER_REFRESH_INTERVAL=300 python3 server.py --host 0.0.0.0 --port 8000
```

## User systemd

Templates live in [`deploy/`](</Users/sameeranjoshi/Documents/New project/deploy>).

Useful commands on the lab machine:

```bash
systemctl --user status chpc-gpu-finder.service
systemctl --user status chpc-gpu-finder-sync.timer
journalctl --user -u chpc-gpu-finder.service -n 100 --no-pager
journalctl --user -u chpc-gpu-finder-sync.service -n 100 --no-pager
```

If you want the service to stay up after logout:

```bash
loginctl enable-linger "$USER"
```

## Notes

- GitHub Pages cannot run the CHPC commands. The lab machine server can.
- `server.py` can refresh data on demand via `/api/refresh`.
- The timer is still recommended so normal page loads do not wait on a full refresh.
- If the lab machine lacks CHPC command access, the sync step will fail. The server will still serve the last successful snapshots if they exist.
- The shell scripts use Bash associative arrays, so the lab machine should have Bash 4+ available.
- The included deploy script assumes `systemd --user` is available on the lab machine.
- For unattended refreshes, the lab machine should use SSH keys to a CHPC login node. Password prompts will not work inside the timer.

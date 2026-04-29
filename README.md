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

Copy the repo to the lab machine, for example:

```bash
git clone https://github.com/Sameeranjoshi/WHOISHOGGING.git /srv/chpc-gpu-finder
cd /srv/chpc-gpu-finder
```

Run one sync manually first:

```bash
python3 sync_pages_data.py
```

Start the server manually:

```bash
CHPC_GPU_FINDER_REFRESH_INTERVAL=300 python3 server.py --host 0.0.0.0 --port 8000
```

## systemd setup

Templates live in [`deploy/`](</Users/sameeranjoshi/Documents/New project/deploy>).

Replace `REPLACE_ME` with the correct user and group, then copy:

```bash
sudo cp deploy/chpc-gpu-finder.service /etc/systemd/system/
sudo cp deploy/chpc-gpu-finder-sync.service /etc/systemd/system/
sudo cp deploy/chpc-gpu-finder-sync.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now chpc-gpu-finder.service
sudo systemctl enable --now chpc-gpu-finder-sync.timer
```

## Notes

- GitHub Pages cannot run the CHPC commands. The lab machine server can.
- `server.py` can refresh data on demand via `/api/refresh`.
- The timer is still recommended so normal page loads do not wait on a full refresh.
- If the lab machine lacks CHPC command access, the sync step will fail. The server will still serve the last successful snapshots if they exist.
- The shell scripts use Bash associative arrays, so the lab machine should have Bash 4+ available.

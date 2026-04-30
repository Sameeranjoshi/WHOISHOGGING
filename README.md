# CHPC GPU Finder

Lightweight web UI for:

- `docs/free_chpc_gpus.sh`
- `docs/whoishogging.sh`

The backend can run directly on a CHPC login node. When the user clicks **Refresh**, the browser calls `POST /api/refresh`; the server runs both scripts, writes fresh JSON snapshots under `docs/data/`, and the page reloads the live tables.

## Recommended CHPC Login-Node Setup

The SSH login itself is still interactive because `notchpeak` is password and 2FA gated:

```bash
ssh u1418973@notchpeak.chpc.utah.edu
```

After password and 2FA, run this once on `notchpeak`:

```bash
git clone https://github.com/Sameeranjoshi/WHOISHOGGING.git ~/chpc-gpu-finder
cd ~/chpc-gpu-finder
cp deploy/chpc-login.env.example .env
bash deploy/start_on_chpc_tmux.sh
```

The tmux helper starts a persistent `chpc-gpu-finder` session. It runs the scripts locally on the CHPC login node, so no stored SSH password or automated 2FA path is needed.

Useful commands on `notchpeak`:

```bash
tmux attach -t chpc-gpu-finder
tmux ls
tail -n 80 ~/chpc-gpu-finder/.runtime/server.log
curl http://127.0.0.1:8000/api/status
curl -X POST http://127.0.0.1:8000/api/refresh
```

To update after future pushes:

```bash
cd ~/chpc-gpu-finder
git pull --ff-only
bash deploy/start_on_chpc_tmux.sh
```

## Opening The Site

The safest default is to keep the server bound to `127.0.0.1` on `notchpeak` and reach it through a tunnel:

```bash
ssh -N -L 8000:127.0.0.1:8000 u1418973@notchpeak.chpc.utah.edu
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000) on your laptop.

VS Code port forwarding works too: forward port `8000` from the remote CHPC session and open the forwarded URL. If VS Code gives you an HTTPS forwarding URL, use that URL as the site/backend URL.

## Static Frontend With Remote Backend

By default, the frontend calls same-origin API paths like `/api/free-gpus`. If the UI is hosted somewhere else, set the backend URL in `docs/config.js`:

```js
window.CHPC_GPU_FINDER_CONFIG = {
  apiBaseUrl: "https://your-forwarded-backend-url",
};
```

You can also override it temporarily from the browser URL:

```text
https://sameeranjoshi.github.io/WHOISHOGGING/?api=https://your-forwarded-backend-url
```

When using a separate frontend origin, set CORS in `.env` on `notchpeak`:

```bash
CHPC_GPU_FINDER_ALLOWED_ORIGINS=https://sameeranjoshi.github.io
```

## HTTPS

The server supports direct TLS if you already have a browser-trusted certificate:

```bash
python3 server.py --host 0.0.0.0 --port 8443 \
  --tls-cert /path/to/fullchain.pem \
  --tls-key /path/to/privkey.pem
```

For most CHPC use, an SSH tunnel or VS Code port forward is simpler because the public HTTPS layer is handled outside this Python process.

## Local Preview

```bash
python3 server.py --host 127.0.0.1 --port 8000
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Existing Lab-Machine Deployment

The previous lab-machine path is still available:

```bash
git clone https://github.com/Sameeranjoshi/WHOISHOGGING.git ~/chpc-gpu-finder
bash ~/chpc-gpu-finder/deploy/install_on_lab.sh
```

That path uses user-level `systemd` units in `deploy/` and can collect over SSH if `CHPC_COLLECTOR_MODE=ssh` is configured.

## Notes

- GitHub Pages alone cannot run the CHPC scripts; a live backend on CHPC or a reachable proxy is required.
- `CHPC_COLLECTOR_MODE=local` is the intended mode when running on `notchpeak`.
- `CHPC_SCRIPT_TIMEOUT_SECONDS` limits each script run so a refresh cannot hang forever.
- The server still serves the last successful snapshots if a refresh fails.

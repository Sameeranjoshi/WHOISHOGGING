# CHPC GPU Helper Scripts

This repo now packages two small CHPC utilities behind one GitHub Pages site:

- `free_chpc_gpus.sh`: show free GPU slots you can actually request
- `whoishogging.sh`: show active GPU jobs, who owns them, and a per-user GPU summary

The published site should come from the [`docs/`](</Users/sameeranjoshi/Documents/New project/docs>) folder.

## Local preview

```bash
cd '/Users/sameeranjoshi/Documents/New project'
python3 server.py
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000).

## GitHub Pages setup

1. Push this repo to GitHub.
2. In the repository settings, open `Pages`.
3. Set `Build and deployment` to `Deploy from a branch`.
4. Select your main branch and the `/docs` folder.
5. Save. GitHub will publish:

```text
https://YOUR-USERNAME.github.io/YOUR-REPO/
https://YOUR-USERNAME.github.io/YOUR-REPO/free_chpc_gpus.sh
https://YOUR-USERNAME.github.io/YOUR-REPO/whoishogging.sh
```

## Install commands for users

### Free GPU finder

```bash
mkdir -p ~/bin
curl -fsSL https://YOUR-USERNAME.github.io/YOUR-REPO/free_chpc_gpus.sh -o ~/bin/chpc-gpus
chmod +x ~/bin/chpc-gpus
~/bin/chpc-gpus
~/bin/chpc-gpus h100
~/bin/chpc-gpus a100
```

### Who is using GPUs

```bash
mkdir -p ~/bin
curl -fsSL https://YOUR-USERNAME.github.io/YOUR-REPO/whoishogging.sh -o ~/bin/whoishogging
chmod +x ~/bin/whoishogging
~/bin/whoishogging
~/bin/whoishogging notchpeak
~/bin/whoishogging owner-gpu-guest
```

## Script notes

`free_chpc_gpus.sh` uses `mychpc`, `sinfo`, `squeue`, and `bc` to show GPU rows only for allocations the current user can access.

`whoishogging.sh` uses `squeue` to list active GPU jobs across clusters and then prints a summary sorted by GPU count per user.

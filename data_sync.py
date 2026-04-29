#!/usr/bin/env python3
import json
import os
import re
import shlex
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parent
DOCS = ROOT / "docs"
DATA = DOCS / "data"
FREE_SCRIPT = DOCS / "free_chpc_gpus.sh"
HOGGING_SCRIPT = DOCS / "whoishogging.sh"
COLLECTOR_MODE = os.getenv("CHPC_COLLECTOR_MODE", "local")
SSH_TARGET = os.getenv("CHPC_COLLECTOR_SSH_TARGET", "")
SSH_IDENTITY_FILE = os.getenv("CHPC_COLLECTOR_SSH_IDENTITY_FILE", "")
REMOTE_REPO_DIR = os.getenv("CHPC_REMOTE_REPO_DIR", "$HOME/chpc-gpu-finder")


def run_local_script(script: Path) -> str:
    try:
        result = subprocess.run(
            ["bash", str(script)],
            cwd=ROOT,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            f"Failed while running {script.name}.\n"
            f"stdout:\n{exc.stdout}\n"
            f"stderr:\n{exc.stderr}"
        ) from exc
    return result.stdout


def run_remote_script(script: Path) -> str:
    if not SSH_TARGET:
        raise RuntimeError("CHPC_COLLECTOR_SSH_TARGET is required when CHPC_COLLECTOR_MODE=ssh")

    ssh_command = ["ssh"]
    if SSH_IDENTITY_FILE:
        ssh_command.extend(["-i", SSH_IDENTITY_FILE])

    remote_script = script.relative_to(ROOT).as_posix()
    remote_command = f"cd {REMOTE_REPO_DIR} && bash {shlex.quote(remote_script)}"

    try:
        result = subprocess.run(
            ssh_command + [SSH_TARGET, remote_command],
            cwd=ROOT,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            f"Failed while running remote script {script.name} via {SSH_TARGET}.\n"
            f"stdout:\n{exc.stdout}\n"
            f"stderr:\n{exc.stderr}"
        ) from exc
    return result.stdout


def run_script(script: Path) -> str:
    if COLLECTOR_MODE == "ssh":
        return run_remote_script(script)
    return run_local_script(script)


def split_columns(line: str) -> List[str]:
    return re.split(r"\s{2,}", line.strip())


def parse_free(output: str) -> List[Dict[str, Any]]:
    rows = []
    started = False
    for raw_line in output.splitlines():
        line = raw_line.rstrip()
        if not line:
            continue
        if line.startswith("CLUSTER"):
            started = True
            continue
        if not started:
            continue
        if line.startswith("To allocate"):
            break
        if set(line) == {"-"}:
            continue
        cols = split_columns(line)
        if len(cols) != 9:
            continue
        rows.append(
            {
                "cluster": cols[0],
                "partition": cols[1],
                "node": cols[2],
                "free": cols[3],
                "cores": int(cols[4]),
                "maxTime": cols[5],
                "gpuType": cols[6],
                "account": cols[7],
                "qos": cols[8],
            }
        )
    return rows


def parse_hogging(output: str) -> List[Dict[str, Any]]:
    rows = []
    started = False
    for raw_line in output.splitlines():
        line = raw_line.rstrip()
        if not line:
            continue
        if line.startswith("CLUSTER"):
            started = True
            continue
        if not started:
            continue
        if line.startswith("=== Total GPU allocation per user"):
            break
        if set(line) == {"-"}:
            continue
        cols = split_columns(line)
        if len(cols) != 9:
            continue
        rows.append(
            {
                "cluster": cols[0],
                "node": cols[1],
                "userId": cols[2],
                "fullName": cols[3],
                "advisor": cols[4],
                "running": cols[5],
                "wallLimit": cols[6],
                "gpuUsed": cols[7],
                "jobName": cols[8],
            }
        )
    return rows


def write_json(path: Path, rows: List[Dict[str, Any]], generated_at: str) -> None:
    payload = {
        "generated_at": generated_at,
        "rows": rows,
    }
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def load_json(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def sync_data() -> Dict[str, Any]:
    DATA.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now().astimezone().isoformat(timespec="seconds")

    free_output = run_script(FREE_SCRIPT)
    hogging_output = run_script(HOGGING_SCRIPT)

    free_rows = parse_free(free_output)
    hogging_rows = parse_hogging(hogging_output)

    (DATA / "free_gpus.raw.txt").write_text(free_output, encoding="utf-8")
    (DATA / "whoishogging.raw.txt").write_text(hogging_output, encoding="utf-8")
    write_json(DATA / "free_gpus.json", free_rows, generated_at)
    write_json(DATA / "whoishogging.json", hogging_rows, generated_at)

    return {
        "generated_at": generated_at,
        "free_rows": len(free_rows),
        "hogging_rows": len(hogging_rows),
    }

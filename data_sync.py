#!/usr/bin/env python3
import json
import re
import subprocess
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DOCS = ROOT / "docs"
DATA = DOCS / "data"
FREE_SCRIPT = DOCS / "free_chpc_gpus.sh"
HOGGING_SCRIPT = DOCS / "whoishogging.sh"


def run_script(script: Path) -> str:
    try:
        result = subprocess.run(
            ["bash", str(script)],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        )
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            f"Failed while running {script.name}.\n"
            f"stdout:\n{exc.stdout}\n"
            f"stderr:\n{exc.stderr}"
        ) from exc
    return result.stdout


def split_columns(line: str) -> list[str]:
    return re.split(r"\s{2,}", line.strip())


def parse_free(output: str) -> list[dict]:
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


def parse_hogging(output: str) -> list[dict]:
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


def write_json(path: Path, rows: list[dict], generated_at: str) -> None:
    payload = {
        "generated_at": generated_at,
        "rows": rows,
    }
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def load_json(path: Path) -> dict | None:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def sync_data() -> dict:
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

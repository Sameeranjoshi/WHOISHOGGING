#!/usr/bin/env python3
import argparse
import json
import os
import threading
import time
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Optional

from data_sync import DATA, DOCS, load_json, sync_data

ROOT = Path(__file__).resolve().parent
HOST = os.getenv("CHPC_GPU_FINDER_HOST", "0.0.0.0")
PORT = int(os.getenv("CHPC_GPU_FINDER_PORT", "8000"))
REFRESH_INTERVAL = int(os.getenv("CHPC_GPU_FINDER_REFRESH_INTERVAL", "300"))

FREE_JSON = DATA / "free_gpus.json"
HOGGING_JSON = DATA / "whoishogging.json"
FREE_RAW = DATA / "free_gpus.raw.txt"
HOGGING_RAW = DATA / "whoishogging.raw.txt"


class AppState:
    def __init__(self):
        self.lock = threading.Lock()
        self.last_error = None
        self.last_sync = None


STATE = AppState()


def file_age_seconds(path: Path) -> Optional[float]:
    if not path.exists():
        return None
    return time.time() - path.stat().st_mtime


def refresh_data(force: bool = False) -> Dict[str, Any]:
    with STATE.lock:
        free_age = file_age_seconds(FREE_JSON)
        hogging_age = file_age_seconds(HOGGING_JSON)
        is_fresh = (
            free_age is not None
            and hogging_age is not None
            and free_age <= REFRESH_INTERVAL
            and hogging_age <= REFRESH_INTERVAL
        )
        if not force and is_fresh:
            free_payload = load_json(FREE_JSON) or {}
            generated_at = free_payload.get("generated_at")
            return {"refreshed": False, "generated_at": generated_at}

        result = sync_data()
        STATE.last_sync = result["generated_at"]
        STATE.last_error = None
        return {"refreshed": True, **result}


def read_payload(path: Path) -> Dict[str, Any]:
    payload = load_json(path)
    if payload is None:
        raise FileNotFoundError(f"Missing data file: {path}")
    return payload


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DOCS), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, payload: Dict[str, Any], status: int = 200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_text(self, body: str, status: int = 200):
        encoded = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def serve_api_data(self, path: Path):
        try:
            refresh_data(force=False)
        except Exception as exc:
            STATE.last_error = str(exc)
        try:
            payload = read_payload(path)
            if STATE.last_error:
                payload = dict(payload)
                payload["warning"] = STATE.last_error
            self.send_json(payload)
        except Exception as exc:
            STATE.last_error = str(exc)
            self.send_json({"ok": False, "error": str(exc)}, status=500)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/refresh":
            try:
                result = refresh_data(force=True)
                self.send_json({"ok": True, **result})
            except Exception as exc:
                STATE.last_error = str(exc)
                self.send_json({"ok": False, "error": str(exc)}, status=500)
            return
        self.send_error(404)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/free-gpus":
            self.serve_api_data(FREE_JSON)
            return
        if parsed.path == "/api/whoishogging":
            self.serve_api_data(HOGGING_JSON)
            return
        if parsed.path == "/api/raw/free-gpus":
            try:
                refresh_data(force=False)
            except Exception as exc:
                STATE.last_error = str(exc)
            try:
                self.send_text(FREE_RAW.read_text(encoding="utf-8"))
            except Exception as exc:
                STATE.last_error = str(exc)
                self.send_text(str(exc), status=500)
            return
        if parsed.path == "/api/raw/whoishogging":
            try:
                refresh_data(force=False)
            except Exception as exc:
                STATE.last_error = str(exc)
            try:
                self.send_text(HOGGING_RAW.read_text(encoding="utf-8"))
            except Exception as exc:
                STATE.last_error = str(exc)
                self.send_text(str(exc), status=500)
            return
        if parsed.path == "/api/status":
            free_payload = load_json(FREE_JSON) or {}
            hogging_payload = load_json(HOGGING_JSON) or {}
            self.send_json(
                {
                    "ok": True,
                    "refresh_interval_seconds": REFRESH_INTERVAL,
                    "free_generated_at": free_payload.get("generated_at"),
                    "hogging_generated_at": hogging_payload.get("generated_at"),
                    "last_error": STATE.last_error,
                }
            )
            return
        if parsed.path in {"", "/"}:
            self.path = "/index.html"
        return super().do_GET()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=HOST)
    parser.add_argument("--port", type=int, default=PORT)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"Serving CHPC GPU Finder at http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Capture representative Draftpine route screenshots and emit a QA checklist."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from urllib.parse import urljoin


ROOT = Path.cwd()
DEFAULT_VIEWPORTS = {
    "desktop": (1440, 1000),
    "mobile": (390, 844),
}
CHROME_CANDIDATES = [
    "google-chrome",
    "chromium",
    "chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        return


def read_config() -> dict[str, object]:
    config_path = ROOT / "draftpine.config.json"
    if not config_path.exists():
        return {}
    return json.loads(config_path.read_text(encoding="utf-8"))


def route_samples(config: dict[str, object], limit: int) -> list[dict[str, str]]:
    routes = config.get("routes")
    if not isinstance(routes, list):
        return [{"path": "/", "title": "Home", "file": "index.html"}]
    valid_routes = [
        {
            "path": str(route.get("path", "/")),
            "title": str(route.get("title", route.get("path", "/"))),
            "file": str(route.get("file", "")),
        }
        for route in routes
        if isinstance(route, dict) and isinstance(route.get("path"), str)
    ]
    if not valid_routes:
        return [{"path": "/", "title": "Home", "file": "index.html"}]
    home = [route for route in valid_routes if route["path"] == "/"]
    hubs = [route for route in valid_routes if route["path"].strip("/").count("/") == 0 and route["path"] != "/"]
    detail = [route for route in valid_routes if route["path"].strip("/").count("/") >= 1]
    picked: list[dict[str, str]] = []
    for bucket in [home, hubs, detail, valid_routes]:
        for route in bucket:
            if route not in picked:
                picked.append(route)
            if len(picked) >= limit:
                return picked
    return picked


def find_chrome() -> str | None:
    for candidate in CHROME_CANDIDATES:
        found = shutil.which(candidate) if "/" not in candidate else candidate
        if found and Path(found).exists():
            return found
    return None


def start_server(port: int) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer(("127.0.0.1", port), QuietHandler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.2)
    return server


def capture(chrome: str, url: str, output: Path, width: int, height: int) -> dict[str, object]:
    output.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        [
            chrome,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            f"--window-size={width},{height}",
            f"--screenshot={output}",
            url,
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=20,
    )
    return {
        "path": str(output),
        "ok": result.returncode == 0 and output.exists(),
        "stderr": result.stderr[-500:] if result.returncode else "",
    }


def build_checklist(samples: list[dict[str, str]]) -> list[str]:
    scope = ", ".join(route["path"] for route in samples)
    return [
        f"Inspect screenshots for representative routes: {scope}.",
        "Verify first viewport composition: clear title, primary action, proof/context, and a hint of next content.",
        "Verify shared nav/footer consistency across captured routes.",
        "Toggle light and dark mode manually on one hub/detail route.",
        "Exercise required interactions from draftpine.config.json: tabs, filters, modals, theme, and state changes.",
        "Check mobile screenshots for clipped text, horizontal overflow, overlapping controls, and unusable tap targets.",
        "Confirm motion is purposeful and honors prefers-reduced-motion for animated assets.",
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a lightweight Draftpine visual QA pass.")
    parser.add_argument("--json", action="store_true", help="Emit JSON.")
    parser.add_argument("--port", type=int, default=5173, help="Local preview port.")
    parser.add_argument("--limit", type=int, default=3, help="Number of representative routes to capture.")
    parser.add_argument("--out", default="work/visual-qa", help="Directory for screenshots.")
    args = parser.parse_args()

    config = read_config()
    samples = route_samples(config, args.limit)
    chrome = find_chrome()
    captures: list[dict[str, object]] = []

    if chrome:
        server = start_server(args.port)
        try:
            base_url = f"http://127.0.0.1:{args.port}/"
            for route in samples:
                route_url = urljoin(base_url, route["path"].lstrip("/"))
                slug = "home" if route["path"] == "/" else route["path"].strip("/").replace("/", "-")
                for viewport, (width, height) in DEFAULT_VIEWPORTS.items():
                    output = ROOT / args.out / f"{slug}-{viewport}.png"
                    capture_result = capture(chrome, route_url, output, width, height)
                    capture_result.update({
                        "route": route["path"],
                        "title": route["title"],
                        "viewport": viewport,
                        "url": route_url,
                    })
                    captures.append(capture_result)
        finally:
            server.shutdown()

    report = {
        "tool": "draftpine-visual-qa",
        "status": "pass" if chrome and all(item["ok"] for item in captures) else "manual",
        "chrome": chrome,
        "screenshots": captures,
        "checklist": build_checklist(samples),
    }

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"Draftpine visual QA: {report['status']}")
        if chrome:
            for item in captures:
                marker = "ok" if item["ok"] else "fail"
                print(f"- {marker} {item['route']} {item['viewport']}: {item['path']}")
        else:
            print("- Chrome/Chromium was not found; use the checklist manually.")
        print("\nChecklist:")
        for item in report["checklist"]:
            print(f"- {item}")
    return 0 if report["status"] in {"pass", "manual"} else 1


if __name__ == "__main__":
    sys.exit(main())

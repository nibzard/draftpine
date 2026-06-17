#!/usr/bin/env python3
"""Create Draftpine route/content scaffolds from Markdown files with frontmatter."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


ROOT = Path.cwd()
FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n(.*)\Z", re.S)


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "page"


def parse_frontmatter(markdown: str) -> tuple[dict[str, str], str]:
    match = FRONTMATTER_RE.match(markdown)
    if not match:
        return {}, markdown
    fields: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, raw_value = line.split(":", 1)
        fields[key.strip()] = raw_value.strip().strip('"').strip("'")
    return fields, match.group(2).strip()


def route_for(source: Path, fields: dict[str, str]) -> tuple[str, str]:
    raw_url = fields.get("url") or fields.get("slug") or source.stem
    route_path = raw_url if raw_url.startswith("/") else f"/{raw_url}"
    if not route_path.endswith("/"):
        route_path += "/"
    route_file = f"{route_path.strip('/')}/index.html" if route_path != "/" else "index.html"
    return route_path, route_file


def page_title(source: Path, fields: dict[str, str], body: str) -> str:
    if fields.get("title"):
        return fields["title"]
    for line in body.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return source.stem.replace("-", " ").replace("_", " ").title()


def make_page_json(source: Path, fields: dict[str, str], body: str) -> dict[str, object]:
    return {
        "source": str(source),
        "title": page_title(source, fields, body),
        "description": fields.get("description", ""),
        "audience": fields.get("audience", ""),
        "primaryAction": fields.get("primary_cta") or fields.get("primaryAction", ""),
        "secondaryAction": fields.get("secondary_cta") or fields.get("secondaryAction", ""),
        "body": body,
    }


def route_shell(title: str, depth: int) -> str:
    prefix = "../" * depth
    return f"""<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
    <script>(function(){{var t=localStorage.getItem('draftpine-theme');if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}})();</script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
    <link rel="stylesheet" href="{prefix}styles.css" />
    <script defer src="{prefix}app.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  </head>
  <body>
    <main class="container" x-data="prototypeBriefWorkspace()">
      <nav aria-label="Site navigation">
        <ul><li><strong>Draftpine</strong></li></ul>
        <ul><li><a href="{prefix}">Home</a></li></ul>
      </nav>
      <header>
        <p class="eyebrow">Scaffolded page</p>
        <h1>{title}</h1>
      </header>
      <section>
        <p>Replace this shell with composed UI sections based on the generated content JSON.</p>
      </section>
      <button data-draftpine-action="primary">Continue</button>
    </main>
  </body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold Draftpine routes/content from Markdown files.")
    parser.add_argument("source", help="Markdown file or folder containing Markdown files.")
    parser.add_argument("--write", action="store_true", help="Write route shells, content JSON, and draftpine.config.json.")
    parser.add_argument("--json", action="store_true", help="Print machine-readable plan.")
    args = parser.parse_args()

    source = Path(args.source)
    files = sorted(source.rglob("*.md")) if source.is_dir() else [source]
    pages = []
    for path in files:
        fields, body = parse_frontmatter(path.read_text(encoding="utf-8"))
        route_path, route_file = route_for(path, fields)
        title = page_title(path, fields, body)
        content_file = f"content/pages/{slugify(route_path.strip('/') or 'home')}.json"
        pages.append({
            "source": str(path),
            "path": route_path,
            "file": route_file,
            "title": title,
            "contentFile": content_file,
            "content": make_page_json(path, fields, body),
        })

    plan = {
        "routes": [{"path": page["path"], "title": page["title"], "file": page["file"]} for page in pages],
        "contentFiles": [page["contentFile"] for page in pages],
    }

    if args.write:
        for page in pages:
            content_path = ROOT / str(page["contentFile"])
            content_path.parent.mkdir(parents=True, exist_ok=True)
            content_path.write_text(json.dumps(page["content"], indent=2), encoding="utf-8")
            route_file = ROOT / str(page["file"])
            route_file.parent.mkdir(parents=True, exist_ok=True)
            if not route_file.exists():
                depth = max(len(Path(str(page["file"])).parts) - 1, 0)
                route_file.write_text(route_shell(str(page["title"]), depth), encoding="utf-8")
        config_path = ROOT / "draftpine.config.json"
        config = json.loads(config_path.read_text(encoding="utf-8")) if config_path.exists() else {}
        config.update({
            "prototypeMode": "browsable",
            "contentMode": "json",
            "routes": plan["routes"],
            "contentFiles": plan["contentFiles"],
        })
        config_path.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")

    if args.json:
        print(json.dumps(plan, indent=2))
    else:
        print(f"Draftpine content scaffold: {len(pages)} pages")
        for route in plan["routes"]:
            print(f"- {route['path']} -> {route['file']}")
        if not args.write:
            print("Run again with --write to create files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

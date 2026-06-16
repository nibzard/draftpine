#!/usr/bin/env python3
"""Agent-oriented Draftpine project checker."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path.cwd()
REQUIRED_FILES = ["index.html", "styles.css", "app.js", "draftpine.config.json"]
FORBIDDEN_FILES = [
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "vite.config.js",
    "vite.config.ts",
    "tailwind.config.js",
    "tailwind.config.ts",
    "tsconfig.json",
]
FORBIDDEN_PATTERNS = {
    "stack.no-frameworks.react": re.compile(r"react|react-dom", re.I),
    "stack.no-frameworks.vue": re.compile(r"vue(\.|\b)|createApp", re.I),
    "stack.no-frameworks.svelte": re.compile(r"svelte", re.I),
    "stack.no-tailwind": re.compile(r"tailwind", re.I),
    "runtime.no-backend-calls": re.compile(r"\bfetch\s*\(|XMLHttpRequest|https?://api\.", re.I),
}


class DraftpineHTMLParser(HTMLParser):
    def __init__(self) -> None:
      super().__init__()
      self.tags: set[str] = set()
      self.links: list[str] = []
      self.scripts: list[str] = []
      self.states: set[str] = set()
      self.interactions: set[str] = set()
      self.actions: set[str] = set()
      self.buttons: list[dict[str, object]] = []
      self.inputs: list[dict[str, object]] = []
      self.labels_for: set[str] = set()
      self.label_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
      attr = {key: value or "" for key, value in attrs}
      self.tags.add(tag)
      if tag == "link" and attr.get("href"):
          self.links.append(attr["href"])
      if tag == "script" and attr.get("src"):
          self.scripts.append(attr["src"])
      if "data-draftpine-state" in attr:
          self.states.add(attr["data-draftpine-state"])
      if "data-draftpine-interaction" in attr:
          for item in attr["data-draftpine-interaction"].split():
              self.interactions.add(item)
      if "data-draftpine-action" in attr:
          self.actions.add(attr["data-draftpine-action"])
      if tag == "label":
          self.label_depth += 1
          if attr.get("for"):
              self.labels_for.add(attr["for"])
      if tag == "button":
          self.buttons.append({"attrs": attr, "text": "", "line": self.getpos()[0]})
      if tag in {"input", "select", "textarea"}:
          self.inputs.append({"tag": tag, "attrs": attr, "inside_label": self.label_depth > 0, "line": self.getpos()[0]})

    def handle_endtag(self, tag: str) -> None:
      if tag == "label" and self.label_depth:
          self.label_depth -= 1

    def handle_data(self, data: str) -> None:
      if self.buttons:
          self.buttons[-1]["text"] = str(self.buttons[-1]["text"]) + data.strip()


def finding(severity: str, rule: str, file: str, message: str, suggested_fix: str, line: int | None = None, evidence: str | None = None) -> dict[str, object]:
    item: dict[str, object] = {
        "severity": severity,
        "rule": rule,
        "file": file,
        "message": message,
        "suggested_fix": suggested_fix,
    }
    if line:
        item["line"] = line
    if evidence:
        item["evidence"] = evidence
    return item


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(errors="replace")


def load_config(findings: list[dict[str, object]]) -> dict[str, object]:
    config_path = ROOT / "draftpine.config.json"
    if not config_path.exists():
        findings.append(finding(
            "error",
            "config.required",
            "draftpine.config.json",
            "draftpine.config.json is missing.",
            "Create draftpine.config.json with screen, audience, primaryAction, requiredStates, and requiredInteractions."
        ))
        return {}
    try:
        return json.loads(read_text(config_path))
    except json.JSONDecodeError as exc:
        findings.append(finding(
            "error",
            "config.valid-json",
            "draftpine.config.json",
            f"draftpine.config.json is invalid JSON: {exc.msg}.",
            "Fix the JSON syntax so the checker can compare intent against output.",
            exc.lineno,
        ))
        return {}


def check_project(strict: bool = False) -> dict[str, object]:
    findings: list[dict[str, object]] = []
    passes: list[dict[str, str]] = []

    for filename in REQUIRED_FILES:
        if (ROOT / filename).exists():
            passes.append({"rule": "files.required", "file": filename})
        else:
            findings.append(finding(
                "error",
                "files.required",
                filename,
                f"{filename} is missing.",
                f"Create {filename}; Draftpine requires index.html, styles.css, app.js, and draftpine.config.json."
            ))

    for filename in FORBIDDEN_FILES:
        if (ROOT / filename).exists():
            findings.append(finding(
                "error",
                "stack.no-build-system",
                filename,
                f"Forbidden build-system file found: {filename}.",
                "Remove package/build configuration unless the user explicitly requested leaving Draftpine's no-build constraints."
            ))

    config = load_config(findings)
    html_path = ROOT / "index.html"
    css_path = ROOT / "styles.css"
    js_path = ROOT / "app.js"
    html = read_text(html_path) if html_path.exists() else ""
    css = read_text(css_path) if css_path.exists() else ""
    js = read_text(js_path) if js_path.exists() else ""

    parser = DraftpineHTMLParser()
    if html:
        parser.feed(html)

    all_source = "\n".join([html, css, js])
    for rule, pattern in FORBIDDEN_PATTERNS.items():
        match = pattern.search(all_source)
        if match:
            findings.append(finding(
                "error",
                rule,
                "index.html/app.js/styles.css",
                f"Forbidden pattern detected for {rule}.",
                "Remove framework, Tailwind, or backend/API code and use Pico, Alpine, and local fake data instead.",
                evidence=match.group(0),
            ))

    if any("picocss" in href.lower() and "pico" in href.lower() for href in parser.links):
        passes.append({"rule": "pico.required", "file": "index.html"})
    else:
        findings.append(finding(
            "error",
            "pico.required",
            "index.html",
            "Pico CSS CDN stylesheet was not found.",
            "Add Pico v2 before local styles.css: <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css\" />."
        ))

    if any("alpinejs" in src.lower() for src in parser.scripts):
        passes.append({"rule": "alpine.required", "file": "index.html"})
    else:
        findings.append(finding(
            "error",
            "alpine.required",
            "index.html",
            "Alpine.js CDN script was not found.",
            "Add Alpine v3: <script defer src=\"https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js\"></script>."
        ))

    for href, rule, fix in [
        ("./styles.css", "local.styles-linked", "Link local styles.css using a relative path: <link rel=\"stylesheet\" href=\"./styles.css\" />."),
        ("./app.js", "local.app-linked", "Link local app.js using a relative path: <script defer src=\"./app.js\"></script>.")
    ]:
        haystack = parser.links if href.endswith(".css") else parser.scripts
        if href in haystack:
            passes.append({"rule": rule, "file": "index.html"})
        else:
            findings.append(finding("error", rule, "index.html", f"{href} is not linked.", fix))

    for tag in ["main", "header", "section"]:
        if tag in parser.tags:
            passes.append({"rule": "html.semantic-landmark", "file": "index.html"})
        else:
            findings.append(finding(
                "warning" if not strict else "error",
                "html.semantic-landmark",
                "index.html",
                f"Semantic landmark <{tag}> was not found.",
                f"Use a <{tag}> element so the wireframe stays readable and accessible."
            ))

    if "primary" in parser.actions:
        passes.append({"rule": "action.primary", "file": "index.html"})
    else:
        findings.append(finding(
            "error",
            "action.primary",
            "index.html",
            "No primary action marker was found.",
            "Mark the main CTA with data-draftpine-action=\"primary\"."
        ))

    required_states = [str(item) for item in config.get("requiredStates", [])]
    for state in required_states:
        if state in parser.states:
            passes.append({"rule": f"required-state.{state}", "file": "index.html"})
        else:
            findings.append(finding(
                "error",
                f"required-state.{state}",
                "index.html",
                f"Required state '{state}' is missing.",
                f"Add a visible or Alpine-controlled element with data-draftpine-state=\"{state}\"."
            ))

    required_interactions = [str(item) for item in config.get("requiredInteractions", [])]
    for interaction in required_interactions:
        if interaction in parser.interactions:
            passes.append({"rule": f"required-interaction.{interaction}", "file": "index.html"})
        else:
            findings.append(finding(
                "error",
                f"required-interaction.{interaction}",
                "index.html",
                f"Required interaction '{interaction}' is missing.",
                f"Add data-draftpine-interaction=\"{interaction}\" to the relevant UI."
            ))

    for button in parser.buttons:
        attrs = button["attrs"]
        text = str(button["text"]).strip()
        if not text and not attrs.get("aria-label"):
            findings.append(finding(
                "error",
                "accessibility.button-label",
                "index.html",
                "A button has no visible text and no aria-label.",
                "Add visible button text or aria-label describing the button action.",
                int(button["line"]),
            ))

    for control in parser.inputs:
        attrs = control["attrs"]
        if control["inside_label"] or (attrs.get("id") and attrs.get("id") in parser.labels_for) or attrs.get("aria-label"):
            continue
        if attrs.get("type") in {"hidden", "submit", "button"}:
            continue
        findings.append(finding(
            "warning" if not strict else "error",
            "accessibility.form-label",
            "index.html",
            f"A {control['tag']} control may be missing a label.",
            "Wrap the control in a <label>, add a matching label[for], or add aria-label.",
            int(control["line"]),
        ))

    if css_path.exists():
        css_lines = len(css.splitlines())
        if css_lines > 320:
            findings.append(finding(
                "warning" if not strict else "error",
                "css.size",
                "styles.css",
                f"styles.css has {css_lines} lines.",
                "Consider simplifying custom CSS and leaning more on Pico defaults."
            ))

    errors = [item for item in findings if item["severity"] == "error"]
    warnings = [item for item in findings if item["severity"] == "warning"]
    status = "fail" if errors else "pass"
    next_actions = []
    for index, item in enumerate(errors + warnings, start=1):
        next_actions.append({
            "priority": index,
            "rule": item["rule"],
            "file": item["file"],
            "line": item.get("line"),
            "message": item["message"],
            "suggested_fix": item["suggested_fix"],
        })

    return {
        "tool": "draftpine-check",
        "status": status,
        "summary": {
            "errors": len(errors),
            "warnings": len(warnings),
            "passes": len(passes),
        },
        "next_actions": next_actions,
        "findings": findings,
        "passes": passes,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Check a Draftpine wireframe.")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON.")
    parser.add_argument("--human", action="store_true", help="Emit compact human-readable output.")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors where applicable.")
    args = parser.parse_args()

    result = check_project(strict=args.strict)
    if args.json or not args.human:
        print(json.dumps(result, indent=2))
    else:
        print(f"Draftpine check: {result['status']}")
        for action in result["next_actions"]:
            print(f"- {action['rule']} {action['file']}: {action['message']}")

    return 1 if result["status"] == "fail" else 0


if __name__ == "__main__":
    sys.exit(main())


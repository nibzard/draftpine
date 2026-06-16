#!/usr/bin/env python3
"""Agent-oriented Draftpine project checker."""

from __future__ import annotations

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse


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
    "stack.no-frameworks.react": re.compile(r"\breact(?:-dom)?\b", re.I),
    "stack.no-frameworks.vue": re.compile(r"\bvue\b|createApp", re.I),
    "stack.no-frameworks.svelte": re.compile(r"\bsvelte\b", re.I),
    "stack.no-tailwind": re.compile(r"\btailwind\b", re.I),
    "runtime.no-xhr": re.compile(r"\bXMLHttpRequest\b", re.I),
    "runtime.no-remote-api-url": re.compile(r"https?://api\.", re.I),
}
CONFIG_STRING_FIELDS = ["screen", "audience", "userGoal", "primaryAction"]
CONFIG_ARRAY_FIELDS = ["requiredStates", "requiredInteractions"]
EXAMPLE_STRING_FIELDS = ["name", "label"]
EXAMPLE_ARRAY_FIELDS = ["bestFor", "sections", "states", "interactions"]
CDN_HOSTS = {"cdn.jsdelivr.net", "unpkg.com"}


class DraftpineHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.tags: set[str] = set()
        self.links: list[str] = []
        self.scripts: list[str] = []
        self.anchors: list[str] = []
        self.states: set[str] = set()
        self.interactions: set[str] = set()
        self.actions: set[str] = set()
        self.buttons: list[dict[str, object]] = []
        self.inputs: list[dict[str, object]] = []
        self.labels_for: set[str] = set()
        self.label_depth = 0
        self.current_button: dict[str, object] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {key: value or "" for key, value in attrs}
        self.tags.add(tag)
        if tag == "link" and attr.get("href"):
            self.links.append(attr["href"])
        if tag == "script" and attr.get("src"):
            self.scripts.append(attr["src"])
        if tag == "a" and attr.get("href"):
            self.anchors.append(attr["href"])
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
            self.current_button = {"attrs": attr, "text": "", "line": self.getpos()[0]}
            self.buttons.append(self.current_button)
        if tag in {"input", "select", "textarea"}:
            self.inputs.append({"tag": tag, "attrs": attr, "inside_label": self.label_depth > 0, "line": self.getpos()[0]})

    def handle_endtag(self, tag: str) -> None:
        if tag == "label" and self.label_depth:
            self.label_depth -= 1
        if tag == "button":
            self.current_button = None

    def handle_data(self, data: str) -> None:
        if self.current_button:
            self.current_button["text"] = str(self.current_button["text"]) + data.strip()


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


def build_result(tool: str, findings: list[dict[str, object]], passes: list[dict[str, object]]) -> dict[str, object]:
    errors = [item for item in findings if item["severity"] == "error"]
    warnings = [item for item in findings if item["severity"] == "warning"]
    next_actions = [
        {
            "priority": index,
            "rule": item["rule"],
            "file": item["file"],
            "line": item.get("line"),
            "message": item["message"],
            "suggested_fix": item["suggested_fix"],
        }
        for index, item in enumerate(errors + warnings, start=1)
    ]

    return {
        "tool": tool,
        "status": "fail" if errors else "pass",
        "summary": {
            "errors": len(errors),
            "warnings": len(warnings),
            "passes": len(passes),
        },
        "next_actions": next_actions,
        "findings": findings,
        "passes": passes,
    }


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(errors="replace")


def is_cdn_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme == "https" and parsed.netloc.lower() in CDN_HOSTS


def has_major_version(value: str, package: str, major: int) -> bool:
    return re.search(rf"/{re.escape(package)}@{major}(?:[./]|x|$)", value, re.I) is not None


def is_pico_v2_cdn(href: str) -> bool:
    return (
        is_cdn_url(href)
        and has_major_version(href, "@picocss/pico", 2)
        and href.lower().endswith(".css")
    )


def is_alpine_v3_cdn(src: str) -> bool:
    return (
        is_cdn_url(src)
        and has_major_version(src, "alpinejs", 3)
        and src.lower().endswith(".js")
    )


def is_safe_route_file(value: str) -> bool:
    path = Path(value)
    return (
        value.endswith(".html")
        and not value.startswith("/")
        and ".." not in path.parts
    )


def normalize_route_path(value: str) -> str:
    if not value:
        return "/"
    path = value.split("#", 1)[0].split("?", 1)[0].strip()
    if not path:
        return "/"
    if path.endswith("/index.html"):
        path = path[:-10]
    if path == "index.html":
        return "/"
    if path.startswith("./"):
        path = path[2:]
    if not path.startswith("/"):
        path = f"/{path}"
    if path != "/" and not path.endswith("/") and "." not in Path(path).name:
        path = f"{path}/"
    return path


def is_local_anchor(href: str) -> bool:
    parsed = urlparse(href)
    if parsed.scheme or parsed.netloc:
        return False
    return not href.startswith(("mailto:", "tel:", "javascript:"))


def is_safe_content_file(value: str) -> bool:
    path = Path(value)
    return (
        value.endswith(".json")
        and not value.startswith("/")
        and ".." not in path.parts
    )


FETCH_CALL_RE = re.compile(r"\bfetch\s*\(\s*([\"'`])([^\"'`]+)\1", re.I)
FETCH_ANY_RE = re.compile(r"\bfetch\s*\(", re.I)


def is_allowed_static_json_fetch(target: str) -> bool:
    parsed = urlparse(target)
    if parsed.scheme or parsed.netloc:
        return False
    path = parsed.path
    return (
        path.endswith(".json")
        and not path.startswith("//")
        and ".." not in Path(path).parts
    )


def validate_fetch_calls(source: str, findings: list[dict[str, object]]) -> None:
    literal_starts = {match.start() for match in FETCH_CALL_RE.finditer(source)}
    for match in FETCH_ANY_RE.finditer(source):
        if match.start() not in literal_starts:
            findings.append(finding(
                "error",
                "runtime.no-backend-calls.fetch",
                "index.html/app.js/styles.css",
                "Dynamic fetch calls are not allowed.",
                "Use a literal local static JSON path such as fetch('./content/pages/home.json') so the checker can verify it is GitHub Pages compatible.",
                evidence=match.group(0),
            ))

    for match in FETCH_CALL_RE.finditer(source):
        target = match.group(2)
        if is_allowed_static_json_fetch(target):
            continue
        findings.append(finding(
            "error",
            "runtime.no-backend-calls.fetch",
            "index.html/app.js/styles.css",
            f"Forbidden fetch target detected: {target}.",
            "Only fetch local static JSON files such as './content/pages/home.json'. Do not call remote APIs or dynamic backends.",
            evidence=match.group(0),
        ))


def validate_content_files(config: dict[str, object], findings: list[dict[str, object]], passes: list[dict[str, object]]) -> None:
    content_mode = config.get("contentMode")
    if content_mode is None:
        return

    if content_mode not in {"inline", "json"}:
        findings.append(finding(
            "error",
            "config.field.contentMode",
            "draftpine.config.json",
            "Config field 'contentMode' must be 'inline' or 'json' when present.",
            "Use 'inline' for copy in markup/app.js or 'json' for static content files."
        ))
        return

    if content_mode == "inline":
        return

    content_files = config.get("contentFiles")
    if not isinstance(content_files, list) or any(not isinstance(item, str) or not is_safe_content_file(item) for item in content_files):
        findings.append(finding(
            "error",
            "config.field.contentFiles",
            "draftpine.config.json",
            "JSON content mode requires 'contentFiles' to be an array of safe relative .json files.",
            "Add files like 'content/site.json' and 'content/pages/home.json'."
        ))
        return

    for content_file in content_files:
        path = ROOT / content_file
        if not path.exists():
            findings.append(finding(
                "error",
                f"content.file-missing.{content_file}",
                content_file,
                f"Configured content file '{content_file}' is missing.",
                f"Create {content_file}, or remove it from draftpine.config.json contentFiles."
            ))
            continue
        try:
            json.loads(read_text(path))
        except json.JSONDecodeError as exc:
            findings.append(finding(
                "error",
                f"content.valid-json.{content_file}",
                content_file,
                f"Content file '{content_file}' is invalid JSON: {exc.msg}.",
                "Fix the JSON syntax so the prototype can load the content.",
                exc.lineno,
            ))
            continue
        passes.append({"rule": f"content.file.{content_file}", "file": content_file})


def validate_routes(config: dict[str, object], findings: list[dict[str, object]], passes: list[dict[str, object]]) -> None:
    routes = config.get("routes")
    if routes is None:
        return

    if not isinstance(routes, list) or any(not isinstance(item, dict) for item in routes):
        findings.append(finding(
            "error",
            "config.field.routes",
            "draftpine.config.json",
            "Config field 'routes' must be an array of route objects when present.",
            "Set 'routes' to objects like {\"path\": \"/pricing/\", \"title\": \"Pricing\", \"file\": \"pricing/index.html\"}."
        ))
        return

    route_paths: set[str] = set()
    route_files: list[str] = []
    anchor_paths: set[str] = set()

    for index, route in enumerate(routes):
        raw_path = route.get("path")
        title = route.get("title")
        file = route.get("file")

        if not isinstance(raw_path, str) or not raw_path.startswith("/"):
            findings.append(finding(
                "error",
                "route.field.path",
                "draftpine.config.json",
                f"Route #{index + 1} must include a path starting with '/'.",
                "Use paths like '/', '/pricing/', or '/compare/steel-vs-browserbase/'."
            ))
            continue
        if not isinstance(title, str) or not title.strip():
            findings.append(finding(
                "error",
                "route.field.title",
                "draftpine.config.json",
                f"Route '{raw_path}' must include a non-empty title.",
                "Add a concise title for the route."
            ))
        if not isinstance(file, str) or not is_safe_route_file(file):
            findings.append(finding(
                "error",
                "route.field.file",
                "draftpine.config.json",
                f"Route '{raw_path}' must include a safe relative HTML file.",
                "Use a relative HTML file like 'index.html' or 'compare/steel-vs-browserbase/index.html'."
            ))
            continue

        path = normalize_route_path(raw_path)
        route_paths.add(path)
        route_files.append(file)

        route_file = ROOT / file
        if route_file.exists():
            passes.append({"rule": f"route.file.{path}", "file": file})
            parser = DraftpineHTMLParser()
            parser.feed(read_text(route_file))
            for href in parser.anchors:
                if is_local_anchor(href):
                    anchor_paths.add(normalize_route_path(href))
        else:
            findings.append(finding(
                "error",
                f"route.file-missing.{path}",
                file,
                f"Configured route '{path}' points to a missing file.",
                f"Create {file}, or remove the route from draftpine.config.json."
            ))

    if "/" not in route_paths:
        findings.append(finding(
            "error",
            "route.home-required",
            "draftpine.config.json",
            "A browsable prototype must declare the home route '/'.",
            "Add {\"path\": \"/\", \"title\": \"Home\", \"file\": \"index.html\"} to routes."
        ))

    for path in sorted(route_paths):
        if path == "/":
            continue
        if path in anchor_paths:
            passes.append({"rule": f"route.linked.{path}", "file": "draftpine.config.json"})
        else:
            findings.append(finding(
                "error",
                f"route.linked.{path}",
                "draftpine.config.json",
                f"Configured route '{path}' is not linked from any configured page.",
                "Add a normal <a href=\"...\"> link to this route so the prototype is browsable."
            ))

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
        config = json.loads(read_text(config_path))
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

    if not isinstance(config, dict):
        findings.append(finding(
            "error",
            "config.object",
            "draftpine.config.json",
            "draftpine.config.json must contain a JSON object.",
            "Replace the top-level value with an object containing screen, audience, userGoal, primaryAction, requiredStates, and requiredInteractions."
        ))
        return {}

    for field in CONFIG_STRING_FIELDS:
        if not isinstance(config.get(field), str) or not config.get(field, "").strip():
            findings.append(finding(
                "error",
                f"config.field.{field}",
                "draftpine.config.json",
                f"Config field '{field}' must be a non-empty string.",
                f"Add a non-empty string value for '{field}'."
            ))

    for field in CONFIG_ARRAY_FIELDS:
        value = config.get(field)
        if not isinstance(value, list) or any(not isinstance(item, str) or not item.strip() for item in value):
            findings.append(finding(
                "error",
                f"config.field.{field}",
                "draftpine.config.json",
                f"Config field '{field}' must be an array of non-empty strings.",
                f"Set '{field}' to an array like [\"default\", \"empty\"]."
            ))

    if "patterns" in config:
        patterns = config.get("patterns")
        if not isinstance(patterns, list) or any(not isinstance(item, str) or not item.strip() for item in patterns):
            findings.append(finding(
                "error",
                "config.field.patterns",
                "draftpine.config.json",
                "Config field 'patterns' must be an array of non-empty strings when present.",
                "Set 'patterns' to the pattern recipe used for the screen, like [\"outcome hero\", \"feature bento\", \"final CTA band\"]."
            ))

    mode = config.get("prototypeMode")
    if mode is not None and mode not in {"single-screen", "browsable"}:
        findings.append(finding(
            "error",
            "config.field.prototypeMode",
            "draftpine.config.json",
            "Config field 'prototypeMode' must be 'single-screen' or 'browsable' when present.",
            "Use 'single-screen' for one disposable screen or 'browsable' for linked multi-page prototypes."
        ))

    content_mode = config.get("contentMode")
    if content_mode is not None and content_mode not in {"inline", "json"}:
        findings.append(finding(
            "error",
            "config.field.contentMode",
            "draftpine.config.json",
            "Config field 'contentMode' must be 'inline' or 'json' when present.",
            "Use 'inline' for copy in markup/app.js or 'json' for static content files."
        ))

    if isinstance(config.get("template"), str) and config.get("template", "").strip():
        findings.append(finding(
            "warning",
            "config.deprecated-template",
            "draftpine.config.json",
            "Config field 'template' is deprecated.",
            "Replace 'template' with a 'patterns' array so agents compose from reusable patterns instead of force-fitting whole screens."
        ))

    if config.get("prototypeMode") == "browsable" and "routes" not in config:
        findings.append(finding(
            "error",
            "config.routes-required",
            "draftpine.config.json",
            "Browsable prototypes must declare routes.",
            "Add a routes array with at least {\"path\": \"/\", \"title\": \"Home\", \"file\": \"index.html\"} and each linked page."
        ))

    return config


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
    validate_fetch_calls(all_source, findings)

    if any(is_pico_v2_cdn(href) for href in parser.links):
        passes.append({"rule": "pico.required", "file": "index.html"})
    else:
        findings.append(finding(
            "error",
            "pico.required",
            "index.html",
            "Pico CSS CDN stylesheet was not found.",
            "Add Pico v2 before local styles.css: <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css\" />."
        ))

    if any(is_alpine_v3_cdn(src) for src in parser.scripts):
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

    configured_states = config.get("requiredStates", [])
    required_states = [str(item) for item in configured_states] if isinstance(configured_states, list) else []
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

    configured_interactions = config.get("requiredInteractions", [])
    required_interactions = [str(item) for item in configured_interactions] if isinstance(configured_interactions, list) else []
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

    validate_routes(config, findings, passes)
    validate_content_files(config, findings, passes)

    return build_result("draftpine-check", findings, passes)


def check_example(example_dir: Path) -> list[dict[str, object]]:
    """Validate that an example's index.html contains every state and interaction
    its example.json advertises, so metadata can't drift from the markup."""
    findings: list[dict[str, object]] = []
    name = example_dir.name
    meta_path = example_dir / "example.json"
    html_path = example_dir / "index.html"

    if not meta_path.exists():
        findings.append(finding(
            "error",
            "example.metadata-required",
            f"examples/{name}/example.json",
            f"Example '{name}' is missing example.json.",
            "Add example.json with name, label, bestFor, sections, states, and interactions."
        ))
        return findings

    try:
        meta = json.loads(read_text(meta_path))
    except json.JSONDecodeError as exc:
        findings.append(finding(
            "error",
            "example.valid-json",
            f"examples/{name}/example.json",
            f"example.json for '{name}' is invalid JSON: {exc.msg}.",
            "Fix the JSON syntax so the example metadata can be validated.",
            exc.lineno,
        ))
        return findings

    if not isinstance(meta, dict):
        findings.append(finding(
            "error",
            "example.metadata-object",
            f"examples/{name}/example.json",
            f"example.json for '{name}' must contain a JSON object.",
            "Replace the top-level value with an object containing name, label, bestFor, sections, states, and interactions."
        ))
        return findings

    for field in EXAMPLE_STRING_FIELDS:
        if not isinstance(meta.get(field), str) or not meta.get(field, "").strip():
            findings.append(finding(
                "error",
                f"example.field.{field}",
                f"examples/{name}/example.json",
                f"Example field '{field}' must be a non-empty string.",
                f"Add a non-empty string value for '{field}'."
            ))

    for field in EXAMPLE_ARRAY_FIELDS:
        value = meta.get(field)
        if not isinstance(value, list) or any(not isinstance(item, str) or not item.strip() for item in value):
            findings.append(finding(
                "error",
                f"example.field.{field}",
                f"examples/{name}/example.json",
                f"Example field '{field}' must be an array of non-empty strings.",
                f"Set '{field}' to an array of strings."
            ))

    if not html_path.exists():
        findings.append(finding(
            "error",
            "example.index-required",
            f"examples/{name}/index.html",
            f"Example '{name}' is missing index.html.",
            "Add an index.html that demonstrates the example's declared states and interactions."
        ))
        return findings

    parser = DraftpineHTMLParser()
    parser.feed(read_text(html_path))

    states = meta.get("states", [])
    interactions = meta.get("interactions", [])
    for state in states if isinstance(states, list) else []:
        if state not in parser.states:
            findings.append(finding(
                "error",
                f"example.state-missing.{state}",
                f"examples/{name}/index.html",
                f"Example '{name}' declares state '{state}' but its index.html has no matching marker.",
                f"Add data-draftpine-state=\"{state}\" to the example, or remove '{state}' from example.json states."
            ))

    for interaction in interactions if isinstance(interactions, list) else []:
        if interaction not in parser.interactions:
            findings.append(finding(
                "error",
                f"example.interaction-missing.{interaction}",
                f"examples/{name}/index.html",
                f"Example '{name}' declares interaction '{interaction}' but its index.html has no matching marker.",
                f"Add data-draftpine-interaction=\"{interaction}\" to the example, or remove '{interaction}' from example.json interactions."
            ))

    return findings


def check_examples(examples_root: Path) -> dict[str, object]:
    findings: list[dict[str, object]] = []
    passes: list[dict[str, str]] = []

    example_dirs = (
        sorted(p for p in examples_root.iterdir() if p.is_dir())
        if examples_root.exists()
        else []
    )
    for example_dir in example_dirs:
        example_findings = check_example(example_dir)
        findings.extend(example_findings)
        if not any(item["severity"] == "error" for item in example_findings):
            passes.append({"rule": "example.consistent", "example": example_dir.name})

    return build_result("draftpine-check-examples", findings, passes)


def check_templates(templates_root: Path) -> dict[str, object]:
    """Deprecated compatibility wrapper for callers still using --templates."""
    if templates_root.name == "templates" and not templates_root.exists():
        examples_root = templates_root.parent / "examples"
        if examples_root.exists():
            return check_examples(examples_root)
    return check_examples(templates_root)


def main() -> int:
    parser = argparse.ArgumentParser(description="Check a Draftpine wireframe.")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON.")
    parser.add_argument("--human", action="store_true", help="Emit compact human-readable output.")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors where applicable.")
    parser.add_argument("--examples", action="store_true", help="Validate examples/ metadata against example markup.")
    parser.add_argument("--templates", action="store_true", help="Deprecated alias for --examples.")
    args = parser.parse_args()

    if args.examples or args.templates:
        examples_root = ROOT / "examples"
        example_result = check_examples(examples_root)
        if args.json or not args.human:
            print(json.dumps(example_result, indent=2))
        else:
            print(f"Draftpine example check: {example_result['status']}")
            for action in example_result["next_actions"]:
                print(f"- {action['rule']} {action['file']}: {action['message']}")
        return 1 if example_result["status"] == "fail" else 0

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

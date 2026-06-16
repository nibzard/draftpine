# ABOUTME: Unit tests for scripts/check.py, the Draftpine consistency checker.
# ABOUTME: Stdlib-only (unittest) so the repo stays dependency-free like the kit it ships.

from __future__ import annotations

import sys
import tempfile
import unittest
from unittest import mock
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import check  # noqa: E402


MINIMAL_HTML = """<!doctype html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
    <link rel="stylesheet" href="./styles.css" />
    <script defer src="./app.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  </head>
  <body>
    <main>
      <header><h1>{title}</h1></header>
      <section>{copy}</section>
      <button data-draftpine-action="primary">Go</button>
    </main>
  </body>
</html>
"""

MINIMAL_CONFIG = """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "requiredStates": [],
  "requiredInteractions": []
}
"""


def scaffold_project(root: Path, copy: str = "", head_extra: str = "") -> None:
    html = MINIMAL_HTML.format(title="Test screen", copy=copy)
    if head_extra:
        html = html.replace("</head>", f"{head_extra}\n  </head>")
    (root / "index.html").write_text(html, encoding="utf-8")
    (root / "styles.css").write_text("body { margin: 0; }\n", encoding="utf-8")
    (root / "app.js").write_text("function app() { return {}; }\n", encoding="utf-8")
    (root / "draftpine.config.json").write_text(MINIMAL_CONFIG, encoding="utf-8")


def rules_for(result: dict, prefix: str) -> list[str]:
    return [f["rule"] for f in result["findings"] if str(f["rule"]).startswith(prefix)]


class ReactPatternTests(unittest.TestCase):
    """The react rule must flag React without false-positiving on 'reactive'."""

    def setUp(self) -> None:
        self._saved_root = check.ROOT
        self._tmpdir = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmpdir.name)
        check.ROOT = self.tmp

    def tearDown(self) -> None:
        check.ROOT = self._saved_root
        self._tmpdir.cleanup()

    def test_reactive_copy_is_not_flagged(self) -> None:
        scaffold_project(self.tmp, copy="Alpine keeps the prototype reactive and fast.")
        result = check.check_project()
        self.assertEqual(result["status"], "pass", result["next_actions"])
        self.assertEqual(rules_for(result, "stack.no-frameworks.react"), [])

    def test_react_dom_is_flagged(self) -> None:
        scaffold_project(
            self.tmp,
            head_extra='<script src="https://unpkg.com/react-dom@18/umd/react-dom.js"></script>',
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("stack.no-frameworks.react", rules_for(result, "stack.no-frameworks.react"))

    def test_standalone_react_word_is_flagged(self) -> None:
        scaffold_project(self.tmp, copy="Built with React for production.")
        result = check.check_project()
        self.assertIn("stack.no-frameworks.react", rules_for(result, "stack.no-frameworks.react"))


class ConfigValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self._saved_root = check.ROOT
        self._tmpdir = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmpdir.name)
        check.ROOT = self.tmp

    def tearDown(self) -> None:
        check.ROOT = self._saved_root
        self._tmpdir.cleanup()

    def test_missing_required_config_string_fails(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "requiredStates": [],
  "requiredInteractions": []
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("config.field.primaryAction", rules_for(result, "config.field.primaryAction"))

    def test_required_state_config_must_be_string_array(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "requiredStates": ["default", 42],
  "requiredInteractions": []
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("config.field.requiredStates", rules_for(result, "config.field.requiredStates"))

    def test_patterns_config_must_be_string_array_when_present(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "patterns": ["outcome hero", 42],
  "requiredStates": [],
  "requiredInteractions": []
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("config.field.patterns", rules_for(result, "config.field.patterns"))

    def test_template_config_warns_as_deprecated(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "template": "billing",
  "requiredStates": [],
  "requiredInteractions": []
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "pass")
        self.assertIn("config.deprecated-template", rules_for(result, "config.deprecated-template"))

    def test_browsable_mode_requires_routes(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "prototypeMode": "browsable",
  "requiredStates": [],
  "requiredInteractions": []
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("config.routes-required", rules_for(result, "config.routes-required"))

    def test_configured_route_file_must_exist(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "prototypeMode": "browsable",
  "requiredStates": [],
  "requiredInteractions": [],
  "routes": [
    { "path": "/", "title": "Home", "file": "index.html" },
    { "path": "/pricing/", "title": "Pricing", "file": "pricing/index.html" }
  ]
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("route.file-missing./pricing/", rules_for(result, "route.file-missing"))

    def test_configured_route_must_be_linked(self) -> None:
        scaffold_project(self.tmp)
        route_dir = self.tmp / "pricing"
        route_dir.mkdir()
        (route_dir / "index.html").write_text("<main><a href=\"../\">Home</a></main>", encoding="utf-8")
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "prototypeMode": "browsable",
  "requiredStates": [],
  "requiredInteractions": [],
  "routes": [
    { "path": "/", "title": "Home", "file": "index.html" },
    { "path": "/pricing/", "title": "Pricing", "file": "pricing/index.html" }
  ]
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("route.linked./pricing/", rules_for(result, "route.linked"))

    def test_linked_browsable_route_passes(self) -> None:
        scaffold_project(self.tmp)
        html_path = self.tmp / "index.html"
        html_path.write_text(
            html_path.read_text(encoding="utf-8").replace(
                "</main>",
                '<a href="./pricing/">Pricing</a></main>',
            ),
            encoding="utf-8",
        )
        route_dir = self.tmp / "pricing"
        route_dir.mkdir()
        (route_dir / "index.html").write_text("<main><a href=\"../\">Home</a></main>", encoding="utf-8")
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "prototypeMode": "browsable",
  "requiredStates": [],
  "requiredInteractions": [],
  "routes": [
    { "path": "/", "title": "Home", "file": "index.html" },
    { "path": "/pricing/", "title": "Pricing", "file": "pricing/index.html" }
  ]
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "pass", result["next_actions"])

    def test_json_content_mode_requires_declared_content_files(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "contentMode": "json",
  "requiredStates": [],
  "requiredInteractions": []
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("config.field.contentFiles", rules_for(result, "config.field.contentFiles"))

    def test_json_content_file_must_exist(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "contentMode": "json",
  "contentFiles": ["content/pages/home.json"],
  "requiredStates": [],
  "requiredInteractions": []
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("content.file-missing.content/pages/home.json", rules_for(result, "content.file-missing"))

    def test_json_content_file_must_be_valid_json(self) -> None:
        scaffold_project(self.tmp)
        content_dir = self.tmp / "content" / "pages"
        content_dir.mkdir(parents=True)
        (content_dir / "home.json").write_text("{ nope", encoding="utf-8")
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "contentMode": "json",
  "contentFiles": ["content/pages/home.json"],
  "requiredStates": [],
  "requiredInteractions": []
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("content.valid-json.content/pages/home.json", rules_for(result, "content.valid-json"))

    def test_json_content_file_passes_when_present_and_valid(self) -> None:
        scaffold_project(self.tmp)
        content_dir = self.tmp / "content" / "pages"
        content_dir.mkdir(parents=True)
        (content_dir / "home.json").write_text('{"title": "Home"}', encoding="utf-8")
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "contentMode": "json",
  "contentFiles": ["content/pages/home.json"],
  "requiredStates": [],
  "requiredInteractions": []
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "pass", result["next_actions"])


class CdnValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self._saved_root = check.ROOT
        self._tmpdir = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmpdir.name)
        check.ROOT = self.tmp

    def tearDown(self) -> None:
        check.ROOT = self._saved_root
        self._tmpdir.cleanup()

    def test_pico_and_alpine_must_be_supported_major_versions_from_cdn(self) -> None:
        scaffold_project(self.tmp)
        html_path = self.tmp / "index.html"
        html = html_path.read_text(encoding="utf-8")
        html = html.replace(
            "https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css",
            "https://example.com/not-picocss-pico-v0.css",
        )
        html = html.replace(
            "https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js",
            "/vendor/alpinejs-legacy.js",
        )
        html_path.write_text(html, encoding="utf-8")

        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("pico.required", rules_for(result, "pico.required"))
        self.assertIn("alpine.required", rules_for(result, "alpine.required"))

    def test_app_js_must_load_before_alpine(self) -> None:
        scaffold_project(self.tmp)
        html_path = self.tmp / "index.html"
        html = html_path.read_text(encoding="utf-8")
        html = html.replace(
            '<script defer src="./app.js"></script>\n'
            '    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>',
            '<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>\n'
            '    <script defer src="./app.js"></script>',
        )
        html_path.write_text(html, encoding="utf-8")

        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("alpine.app-before-runtime", rules_for(result, "alpine.app-before-runtime"))


class FetchValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self._saved_root = check.ROOT
        self._tmpdir = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmpdir.name)
        check.ROOT = self.tmp

    def tearDown(self) -> None:
        check.ROOT = self._saved_root
        self._tmpdir.cleanup()

    def test_local_static_json_fetch_is_allowed(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "app.js").write_text(
            'async function app() { return fetch("./content/pages/home.json"); }\n',
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "pass", result["next_actions"])

    def test_remote_fetch_is_blocked(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "app.js").write_text(
            'async function app() { return fetch("https://example.com/content.json"); }\n',
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("runtime.no-backend-calls.fetch", rules_for(result, "runtime.no-backend-calls.fetch"))

    def test_non_json_fetch_is_blocked(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "app.js").write_text(
            'async function app() { return fetch("./api/users"); }\n',
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("runtime.no-backend-calls.fetch", rules_for(result, "runtime.no-backend-calls.fetch"))

    def test_dynamic_fetch_is_blocked(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "app.js").write_text(
            'async function app(path) { return fetch(path); }\n',
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("runtime.no-backend-calls.fetch", rules_for(result, "runtime.no-backend-calls.fetch"))

    def test_root_absolute_json_fetch_is_blocked_for_github_pages(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "app.js").write_text(
            'async function app() { return fetch("/content/pages/site.json"); }\n',
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("runtime.no-backend-calls.fetch", rules_for(result, "runtime.no-backend-calls.fetch"))


class QualityGateTests(unittest.TestCase):
    def setUp(self) -> None:
        self._saved_root = check.ROOT
        self._tmpdir = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmpdir.name)
        check.ROOT = self.tmp

    def tearDown(self) -> None:
        check.ROOT = self._saved_root
        self._tmpdir.cleanup()

    def test_raw_markdown_body_dump_fails(self) -> None:
        scaffold_project(
            self.tmp,
            copy="<pre x-text=\"currentPage?.body || 'No content'\">No content</pre>",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("quality.no-raw-markdown-dump", rules_for(result, "quality.no-raw-markdown-dump"))

    def test_filter_interaction_requires_rendered_collection(self) -> None:
        scaffold_project(
            self.tmp,
            copy='<label data-draftpine-interaction="filter">Search <input x-model="query" /></label><ul><li>Static item</li></ul>',
        )
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "requiredStates": [],
  "requiredInteractions": ["filter"]
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("quality.filter-renders-collection", rules_for(result, "quality.filter-renders-collection"))

    def test_filter_interaction_passes_with_x_for_collection(self) -> None:
        scaffold_project(
            self.tmp,
            copy=(
                '<label data-draftpine-interaction="filter">Search <input x-model="query" /></label>'
                '<template x-for="item in filteredItems" :key="item"><span x-text="item"></span></template>'
            ),
        )
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "requiredStates": [],
  "requiredInteractions": ["filter"]
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "pass", result["next_actions"])

    def test_placeholder_routes_fail(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "prototypeMode": "browsable",
  "requiredStates": [],
  "requiredInteractions": [],
  "routes": [
    { "path": "/", "title": "Home", "file": "index.html" },
    { "path": "/features/change-me/", "title": "Feature title", "file": "features/change-me/index.html" }
  ]
}
""",
            encoding="utf-8",
        )
        route_dir = self.tmp / "features" / "change-me"
        route_dir.mkdir(parents=True)
        (route_dir / "index.html").write_text("<main><a href=\"../../\">Home</a></main>", encoding="utf-8")
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("route.no-placeholder./features/change-me/", rules_for(result, "route.no-placeholder"))

    def test_browsable_route_pages_must_not_use_root_absolute_assets_or_links(self) -> None:
        scaffold_project(self.tmp)
        html_path = self.tmp / "index.html"
        html_path.write_text(
            html_path.read_text(encoding="utf-8").replace("</main>", '<a href="./pricing/">Pricing</a></main>'),
            encoding="utf-8",
        )
        route_dir = self.tmp / "pricing"
        route_dir.mkdir()
        (route_dir / "index.html").write_text(
            """<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="/styles.css" />
    <script defer src="/app.js"></script>
  </head>
  <body><main><a href="/">Home</a></main></body>
</html>
""",
            encoding="utf-8",
        )
        (self.tmp / "draftpine.config.json").write_text(
            """{
  "screen": "Test",
  "audience": "tester",
  "userGoal": "verify",
  "primaryAction": "Go",
  "prototypeMode": "browsable",
  "requiredStates": [],
  "requiredInteractions": [],
  "routes": [
    { "path": "/", "title": "Home", "file": "index.html" },
    { "path": "/pricing/", "title": "Pricing", "file": "pricing/index.html" }
  ]
}
""",
            encoding="utf-8",
        )
        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("route.github-pages-asset./pricing/", rules_for(result, "route.github-pages-asset"))
        self.assertIn("route.github-pages-link./pricing/", rules_for(result, "route.github-pages-link"))


class AccessibilityParsingTests(unittest.TestCase):
    def setUp(self) -> None:
        self._saved_root = check.ROOT
        self._tmpdir = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmpdir.name)
        check.ROOT = self.tmp

    def tearDown(self) -> None:
        check.ROOT = self._saved_root
        self._tmpdir.cleanup()

    def test_text_after_empty_button_does_not_count_as_button_label(self) -> None:
        scaffold_project(self.tmp)
        html_path = self.tmp / "index.html"
        html = html_path.read_text(encoding="utf-8").replace(
            '<button data-draftpine-action="primary">Go</button>',
            '<button data-draftpine-action="primary"></button><p>Later copy</p>',
        )
        html_path.write_text(html, encoding="utf-8")

        result = check.check_project()
        self.assertEqual(result["status"], "fail")
        self.assertIn("accessibility.button-label", rules_for(result, "accessibility.button-label"))

    def test_x_text_button_counts_as_label(self) -> None:
        scaffold_project(self.tmp)
        html_path = self.tmp / "index.html"
        html = html_path.read_text(encoding="utf-8").replace(
            '<button data-draftpine-action="primary">Go</button>',
            '<button data-draftpine-action="primary" x-text="primaryAction"></button>',
        )
        html_path.write_text(html, encoding="utf-8")

        result = check.check_project()
        self.assertEqual(result["status"], "pass", result["next_actions"])


class CssSizeTests(unittest.TestCase):
    def setUp(self) -> None:
        self._saved_root = check.ROOT
        self._tmpdir = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmpdir.name)
        check.ROOT = self.tmp

    def tearDown(self) -> None:
        check.ROOT = self._saved_root
        self._tmpdir.cleanup()

    def test_css_size_counts_only_screen_helpers_when_marker_exists(self) -> None:
        scaffold_project(self.tmp)
        base_css = "\n".join(".theme { color: black; }" for _ in range(260))
        screen_css = "\n".join(".screen { display: block; }" for _ in range(3))
        (self.tmp / "styles.css").write_text(
            f"{base_css}\n{check.SCREEN_HELPERS_MARKER}\n{screen_css}\n",
            encoding="utf-8",
        )

        result = check.check_project()
        self.assertEqual(result["status"], "pass", result["next_actions"])
        self.assertEqual(rules_for(result, "css.size"), [])

    def test_css_size_falls_back_to_whole_file_without_marker(self) -> None:
        scaffold_project(self.tmp)
        (self.tmp / "styles.css").write_text(
            "\n".join(".screen { display: block; }" for _ in range(check.SCREEN_CSS_LINE_LIMIT + 1)),
            encoding="utf-8",
        )

        result = check.check_project()
        self.assertEqual(result["status"], "pass")
        self.assertIn("css.size", rules_for(result, "css.size"))


class RuntimeSmokeTests(unittest.TestCase):
    def setUp(self) -> None:
        self._saved_root = check.ROOT
        self._tmpdir = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmpdir.name)
        check.ROOT = self.tmp

    def tearDown(self) -> None:
        check.ROOT = self._saved_root
        self._tmpdir.cleanup()

    def test_runtime_check_requires_node(self) -> None:
        scaffold_project(self.tmp)
        with mock.patch("check.shutil.which", return_value=None):
            result = check.check_project(runtime=True)

        self.assertEqual(result["status"], "fail")
        self.assertIn("runtime.node-required", rules_for(result, "runtime.node-required"))

    def test_runtime_check_reports_expression_errors(self) -> None:
        scaffold_project(self.tmp)
        completed = check.subprocess.CompletedProcess(
            args=[],
            returncode=0,
            stdout='{"ok": false, "errors": ["missingThing is not defined"]}',
            stderr="",
        )
        with mock.patch("check.shutil.which", return_value="/usr/bin/node"), mock.patch("check.subprocess.run", return_value=completed):
            result = check.check_project(runtime=True)

        self.assertEqual(result["status"], "fail")
        self.assertIn("runtime.alpine-evaluation", rules_for(result, "runtime.alpine-evaluation"))

    def test_runtime_check_fails_when_x_data_factory_is_missing(self) -> None:
        scaffold_project(self.tmp)
        html_path = self.tmp / "index.html"
        html = html_path.read_text(encoding="utf-8").replace(
            "<main>",
            '<main x-data="missingApp()">',
        )
        html_path.write_text(html, encoding="utf-8")

        result = check.check_project(runtime=True)
        self.assertEqual(result["status"], "fail")
        self.assertIn("runtime.alpine-evaluation", rules_for(result, "runtime.alpine-evaluation"))

    def test_runtime_check_passes_valid_x_data_and_x_text(self) -> None:
        scaffold_project(self.tmp)
        html_path = self.tmp / "index.html"
        html = html_path.read_text(encoding="utf-8").replace(
            "<main>",
            '<main x-data="app()">',
        ).replace(
            "<section></section>",
            '<section x-text="message">Fallback</section>',
        )
        html_path.write_text(html, encoding="utf-8")
        (self.tmp / "app.js").write_text('function app() { return { message: "Ready" }; }\n', encoding="utf-8")

        result = check.check_project(runtime=True)
        self.assertEqual(result["status"], "pass", result["next_actions"])

    def test_runtime_check_provides_browser_location(self) -> None:
        scaffold_project(self.tmp)
        html_path = self.tmp / "index.html"
        html = html_path.read_text(encoding="utf-8").replace(
            "<main>",
            '<main x-data="app()">',
        ).replace(
            "<section></section>",
            '<section x-text="currentPath">Fallback</section>',
        )
        html_path.write_text(html, encoding="utf-8")
        (self.tmp / "app.js").write_text(
            'function app() { return { currentPath: window.location.pathname || "/" }; }\n',
            encoding="utf-8",
        )

        result = check.check_project(runtime=True)
        self.assertEqual(result["status"], "pass", result["next_actions"])


class RootProjectTests(unittest.TestCase):
    def setUp(self) -> None:
        self._saved_root = check.ROOT
        check.ROOT = REPO_ROOT

    def tearDown(self) -> None:
        check.ROOT = self._saved_root

    def test_shipped_root_project_passes(self) -> None:
        result = check.check_project()
        self.assertEqual(result["status"], "pass", result["next_actions"])


class ExampleConsistencyTests(unittest.TestCase):
    def test_shipped_examples_are_consistent(self) -> None:
        result = check.check_examples(REPO_ROOT / "examples")
        self.assertEqual(result["status"], "pass", result["next_actions"])

    def test_deprecated_template_checker_falls_back_to_examples(self) -> None:
        result = check.check_templates(REPO_ROOT / "templates")
        self.assertEqual(result["status"], "pass", result["next_actions"])

    def test_declared_interaction_without_marker_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            example = Path(tmp) / "bogus"
            example.mkdir()
            (example / "example.json").write_text(
                '{"name": "bogus", "states": [], "interactions": ["tabs"]}',
                encoding="utf-8",
            )
            (example / "index.html").write_text(
                '<main><button data-draftpine-action="primary">Go</button></main>',
                encoding="utf-8",
            )
            result = check.check_examples(Path(tmp))
            self.assertEqual(result["status"], "fail")
            self.assertIn(
                "example.interaction-missing.tabs",
                [f["rule"] for f in result["findings"]],
            )

    def test_example_directory_without_metadata_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            example = Path(tmp) / "missing-meta"
            example.mkdir()
            (example / "index.html").write_text(
                '<main><button data-draftpine-action="primary">Go</button></main>',
                encoding="utf-8",
            )

            result = check.check_examples(Path(tmp))
            self.assertEqual(result["status"], "fail")
            self.assertIn(
                "example.metadata-required",
                [f["rule"] for f in result["findings"]],
            )

    def test_example_metadata_requires_selection_fields(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            example = Path(tmp) / "thin-meta"
            example.mkdir()
            (example / "example.json").write_text(
                '{"name": "thin-meta", "states": [], "interactions": []}',
                encoding="utf-8",
            )
            (example / "index.html").write_text(
                '<main><button data-draftpine-action="primary">Go</button></main>',
                encoding="utf-8",
            )

            result = check.check_examples(Path(tmp))
            self.assertEqual(result["status"], "fail")
            rules = [f["rule"] for f in result["findings"]]
            self.assertIn("example.field.label", rules)
            self.assertIn("example.field.bestFor", rules)
            self.assertIn("example.field.sections", rules)


if __name__ == "__main__":
    unittest.main()

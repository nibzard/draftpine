# ABOUTME: Unit tests for scripts/check.py, the Draftpine consistency checker.
# ABOUTME: Stdlib-only (unittest) so the repo stays dependency-free like the kit it ships.

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import check  # noqa: E402


MINIMAL_HTML = """<!doctype html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
    <link rel="stylesheet" href="./styles.css" />
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script defer src="./app.js"></script>
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

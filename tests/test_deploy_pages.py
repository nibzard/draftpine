# ABOUTME: Unit tests for scripts/deploy_pages.py helpers.
# ABOUTME: Keeps deploy safety behavior covered without requiring git or gh side effects.

from __future__ import annotations

import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import deploy_pages  # noqa: E402


class DeployStatusTests(unittest.TestCase):
    def test_parse_status_paths_handles_regular_untracked_and_renamed_files(self) -> None:
        status = "\n".join([
            " M index.html",
            "?? note.md",
            "R  old.html -> app.js",
        ])

        self.assertEqual(
            deploy_pages.parse_status_paths(status),
            ["index.html", "note.md", "app.js"],
        )

    def test_split_deploy_status_separates_root_wireframe_files_from_unrelated_files(self) -> None:
        deploy_files, other_files = deploy_pages.split_deploy_status([
            "index.html",
            "styles.css",
            "docs/brand/preview.html",
            "note.md",
        ])

        self.assertEqual(deploy_files, ["index.html", "styles.css"])
        self.assertEqual(other_files, ["docs/brand/preview.html", "note.md"])

    def test_split_deploy_status_allows_configured_route_files(self) -> None:
        deploy_files, other_files = deploy_pages.split_deploy_status(
            [
                "index.html",
                "compare/steel-vs-browserbase/index.html",
                "note.md",
            ],
            [
                "index.html",
                "draftpine.config.json",
                "compare/steel-vs-browserbase/index.html",
            ],
        )

        self.assertEqual(deploy_files, ["index.html", "compare/steel-vs-browserbase/index.html"])
        self.assertEqual(other_files, ["note.md"])

    def test_load_deploy_files_includes_configured_route_files(self) -> None:
        with self.subTest("route file included"):
            import tempfile

            with tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                (root / "draftpine.config.json").write_text(
                    """{
  "routes": [
    { "path": "/", "title": "Home", "file": "index.html" },
    { "path": "/compare/", "title": "Compare", "file": "compare/index.html" }
  ]
}
""",
                    encoding="utf-8",
                )

                self.assertIn("compare/index.html", deploy_pages.load_deploy_files(root))

    def test_load_deploy_files_includes_configured_content_files(self) -> None:
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "draftpine.config.json").write_text(
                """{
  "contentMode": "json",
  "contentFiles": ["content/site.json", "content/pages/home.json"]
}
""",
                encoding="utf-8",
            )

            deploy_files = deploy_pages.load_deploy_files(root)
            self.assertIn("content/site.json", deploy_files)
            self.assertIn("content/pages/home.json", deploy_files)


if __name__ == "__main__":
    unittest.main()

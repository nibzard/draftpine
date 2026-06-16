# ABOUTME: Unit tests for scripts/install_global_skills.py.
# ABOUTME: Verifies managed Draftpine global skill adapter install safety.

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import install_global_skills  # noqa: E402


class InstallGlobalSkillsTests(unittest.TestCase):
    def test_install_creates_managed_skill_directories(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp)
            results = install_global_skills.install_all(target)

            self.assertTrue(all(item["status"] == "installed" for item in results))
            for name in install_global_skills.SKILLS:
                path = target / name
                self.assertTrue((path / "SKILL.md").exists())
                self.assertTrue((path / install_global_skills.MANAGED_MARKER).exists())

    def test_install_refuses_unmanaged_existing_skill_without_force(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp)
            path = target / "draftpine-wireframe"
            path.mkdir()
            (path / "SKILL.md").write_text("custom\n", encoding="utf-8")

            result = install_global_skills.install_skill(
                target,
                "draftpine-wireframe",
                install_global_skills.SKILLS["draftpine-wireframe"],
            )

            self.assertEqual(result["status"], "skipped")
            self.assertEqual((path / "SKILL.md").read_text(encoding="utf-8"), "custom\n")

    def test_force_overwrites_unmanaged_existing_skill(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp)
            path = target / "draftpine-wireframe"
            path.mkdir()
            (path / "SKILL.md").write_text("custom\n", encoding="utf-8")

            result = install_global_skills.install_skill(
                target,
                "draftpine-wireframe",
                install_global_skills.SKILLS["draftpine-wireframe"],
                force=True,
            )

            self.assertEqual(result["status"], "installed")
            self.assertIn("wireframe/AGENTS.md", (path / "SKILL.md").read_text(encoding="utf-8"))

    def test_uninstall_removes_only_managed_skill_without_force(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp)
            install_global_skills.install_all(target)
            unmanaged = target / "draftpine-custom"
            unmanaged.mkdir()
            (unmanaged / "SKILL.md").write_text("custom\n", encoding="utf-8")

            results = install_global_skills.uninstall_all(target)

            self.assertTrue(all(item["status"] == "removed" for item in results))
            self.assertTrue(unmanaged.exists())

    def test_dry_run_does_not_write(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp)
            results = install_global_skills.install_all(target, dry_run=True)

            self.assertTrue(all(item["status"] == "would_install" for item in results))
            self.assertEqual(list(target.iterdir()), [])


if __name__ == "__main__":
    unittest.main()


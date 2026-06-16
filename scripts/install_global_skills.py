#!/usr/bin/env python3
"""Install Draftpine global skill adapters for Codex-style agents."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path


MANAGED_MARKER = ".draftpine-managed"
DEFAULT_SKILLS_DIR = Path.home() / ".agents" / "skills"
SKILLS: dict[str, str] = {
    "draftpine-wireframe": """---
name: draftpine-wireframe
description: Build or revise a Draftpine wireframe in a local ./wireframe folder.
---

Find the nearest `wireframe/AGENTS.md` from the current working directory.

Read and follow:

- `wireframe/AGENTS.md`
- `wireframe/agent-workflows/wireframe.md`

Keep edits inside `wireframe/` unless the user explicitly asks otherwise.

Before finishing, run:

```bash
cd wireframe && python3 scripts/check.py --runtime --json
```
""",
    "draftpine-check": """---
name: draftpine-check
description: Run and repair Draftpine checks for a local ./wireframe folder.
---

Find the nearest `wireframe/AGENTS.md` from the current working directory.

Read and follow:

- `wireframe/AGENTS.md`
- `wireframe/agent-workflows/check-and-repair.md`

Run:

```bash
cd wireframe && python3 scripts/check.py --runtime --json
```

Fix every checker error before finishing.
""",
    "draftpine-deploy": """---
name: draftpine-deploy
description: Deploy a passing Draftpine wireframe from ./wireframe to GitHub Pages after explicit user approval.
---

Deploy only when the user explicitly asks to publish or deploy.

Find the nearest `wireframe/AGENTS.md` from the current working directory.

Read and follow:

- `wireframe/AGENTS.md`
- `wireframe/agent-workflows/deploy-github-pages.md`

Run:

```bash
cd wireframe && python3 scripts/deploy_pages.py --branch main --path /
```
""",
    "draftpine-review": """---
name: draftpine-review
description: Review a Draftpine wireframe in ./wireframe against the quality bar and checker output.
---

Find the nearest `wireframe/AGENTS.md` from the current working directory.

Read and follow `wireframe/AGENTS.md`, then review against its quality bar.

Also run:

```bash
cd wireframe && python3 scripts/check.py --runtime --json
```

Use the checker's `next_actions` as the authoritative repair list for mechanical Draftpine guardrail issues.
""",
    "draftpine-template": """---
name: draftpine-template
description: Select a Draftpine pattern recipe for a requested product screen in ./wireframe.
---

Find the nearest `wireframe/AGENTS.md` from the current working directory.

Read and follow:

- `wireframe/AGENTS.md`
- `wireframe/agent-workflows/template-selection.md`

Examples are references, not required starting points. Do not force-fit a screen into an example.
""",
}


def skill_path(target: Path, name: str) -> Path:
    return target / name


def marker_path(path: Path) -> Path:
    return path / MANAGED_MARKER


def is_managed_skill(path: Path) -> bool:
    return marker_path(path).exists()


def install_skill(target: Path, name: str, body: str, force: bool = False, dry_run: bool = False) -> dict[str, str]:
    path = skill_path(target, name)
    skill_file = path / "SKILL.md"

    if path.exists() and not is_managed_skill(path) and not force:
        return {
            "skill": name,
            "status": "skipped",
            "reason": f"{path} exists and is not Draftpine-managed",
        }

    if dry_run:
        return {
            "skill": name,
            "status": "would_install" if not path.exists() else "would_update",
            "path": str(path),
        }

    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)
    skill_file.write_text(body.rstrip() + "\n", encoding="utf-8")
    marker_path(path).write_text("managed by Draftpine install_global_skills.py\n", encoding="utf-8")
    return {
        "skill": name,
        "status": "installed",
        "path": str(path),
    }


def uninstall_skill(target: Path, name: str, force: bool = False, dry_run: bool = False) -> dict[str, str]:
    path = skill_path(target, name)
    if not path.exists():
        return {"skill": name, "status": "missing", "path": str(path)}
    if not is_managed_skill(path) and not force:
        return {
            "skill": name,
            "status": "skipped",
            "reason": f"{path} exists and is not Draftpine-managed",
        }
    if dry_run:
        return {"skill": name, "status": "would_remove", "path": str(path)}
    shutil.rmtree(path)
    return {"skill": name, "status": "removed", "path": str(path)}


def install_all(target: Path, force: bool = False, dry_run: bool = False) -> list[dict[str, str]]:
    return [
        install_skill(target, name, body, force=force, dry_run=dry_run)
        for name, body in SKILLS.items()
    ]


def uninstall_all(target: Path, force: bool = False, dry_run: bool = False) -> list[dict[str, str]]:
    return [
        uninstall_skill(target, name, force=force, dry_run=dry_run)
        for name in SKILLS
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="Install Draftpine global skill adapters.")
    parser.add_argument("--target", type=Path, default=DEFAULT_SKILLS_DIR, help="Skills directory to install into.")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change without writing files.")
    parser.add_argument("--force", action="store_true", help="Overwrite/remove existing draftpine-* skill directories even if not marked managed.")
    parser.add_argument("--uninstall", action="store_true", help="Remove installed Draftpine skill adapters.")
    parser.add_argument("--print-target", action="store_true", help="Print the default target directory and exit.")
    args = parser.parse_args()

    target = args.target.expanduser().resolve()
    if args.print_target:
        print(str(target))
        return 0

    if args.uninstall:
        results = uninstall_all(target, force=args.force, dry_run=args.dry_run)
        action = "uninstall"
    else:
        if not args.dry_run:
            target.mkdir(parents=True, exist_ok=True)
        results = install_all(target, force=args.force, dry_run=args.dry_run)
        action = "install"

    blocked = [item for item in results if item.get("status") == "skipped"]
    print(json.dumps({
        "status": "fail" if blocked else "pass",
        "action": action,
        "target": str(target),
        "skills": results,
    }, indent=2))
    return 1 if blocked else 0


if __name__ == "__main__":
    raise SystemExit(main())


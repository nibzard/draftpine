#!/usr/bin/env python3
"""Deploy a passing Draftpine wireframe to GitHub Pages using gh."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, check=check, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def require_tool(name: str) -> None:
    if not shutil.which(name):
        raise SystemExit(json.dumps({
            "status": "fail",
            "message": f"Required tool '{name}' was not found.",
            "suggested_fix": f"Install {name} or run this deployment from an environment that has it."
        }, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser(description="Deploy Draftpine to GitHub Pages.")
    parser.add_argument("--branch", default="main")
    parser.add_argument("--path", default="/", choices=["/", "/docs"])
    parser.add_argument("--message", default="Deploy Draftpine wireframe")
    args = parser.parse_args()

    require_tool("git")
    require_tool("gh")

    check = run([sys.executable, "scripts/check.py", "--json"], check=False)
    try:
        check_result = json.loads(check.stdout)
    except json.JSONDecodeError:
        print(json.dumps({
            "status": "fail",
            "message": "Draftpine check did not return valid JSON.",
            "stdout": check.stdout,
            "stderr": check.stderr
        }, indent=2))
        return 2

    if check_result.get("status") != "pass":
        print(json.dumps({
            "status": "fail",
            "message": "Draftpine check failed; fix next_actions before deploying.",
            "check": check_result
        }, indent=2))
        return 1

    git_root = run(["git", "rev-parse", "--show-toplevel"], check=False)
    if git_root.returncode != 0:
        print(json.dumps({
            "status": "fail",
            "message": "Current directory is not a git repository.",
            "suggested_fix": "Initialize git and add a GitHub remote before deploying."
        }, indent=2))
        return 1

    auth = run(["gh", "auth", "status"], check=False)
    if auth.returncode != 0:
        print(json.dumps({
            "status": "fail",
            "message": "GitHub CLI is not authenticated.",
            "suggested_fix": "Run gh auth login, then rerun this deploy command.",
            "stderr": auth.stderr
        }, indent=2))
        return 1

    remote = run(["git", "remote", "get-url", "origin"], check=False)
    if remote.returncode != 0:
        print(json.dumps({
            "status": "fail",
            "message": "No origin remote found.",
            "suggested_fix": "Create a GitHub repository and add it as origin."
        }, indent=2))
        return 1

    status = run(["git", "status", "--porcelain"], check=False).stdout.strip()
    committed = False
    committed_files: list[str] = []
    if status:
        committed_files = [line[3:] for line in status.splitlines()]
        run(["git", "add", "."])
        run(["git", "commit", "-m", args.message])
        committed = True

    current_branch = run(["git", "branch", "--show-current"], check=False).stdout.strip()
    push_ref = args.branch if current_branch == args.branch else f"HEAD:{args.branch}"
    run(["git", "push", "-u", "origin", push_ref])

    repo = run(["gh", "repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]).stdout.strip()
    pages_get = run(["gh", "api", f"repos/{repo}/pages"], check=False)
    method = "PUT" if pages_get.returncode == 0 else "POST"
    run([
        "gh", "api",
        "--method", method,
        f"repos/{repo}/pages",
        "-f", f"source[branch]={args.branch}",
        "-f", f"source[path]={args.path}",
    ])
    pages = run(["gh", "api", f"repos/{repo}/pages", "--jq", ".html_url"]).stdout.strip()

    print(json.dumps({
        "status": "pass",
        "committed": committed,
        "committed_files": committed_files,
        "repository": repo,
        "branch": args.branch,
        "path": args.path,
        "pages_url": pages
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())

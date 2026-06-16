---
name: wireframe-deploy
description: Deploy a passing Draftpine static wireframe to GitHub Pages with git and gh after the user explicitly asks to publish.
---

Deploy only when the user explicitly asks to publish or deploy.

Process:

1. Run `python3 scripts/check.py --json`.
2. Fix all checker errors before publishing.
3. Run:

```bash
python3 scripts/deploy_pages.py --branch main --path /
```

4. Report the `pages_url` from the JSON output.

If deployment fails, report the script's `message` and `suggested_fix`.
If it refuses because unrelated files are dirty, ask the user whether to commit,
stash, or leave those files out; only root wireframe files and configured route
HTML files and configured JSON content files are auto-committed.

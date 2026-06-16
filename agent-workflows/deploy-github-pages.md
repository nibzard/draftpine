# Deploy To GitHub Pages

Deploy only when the user explicitly asks to publish or deploy.

1. Run `python3 scripts/check.py --json`.
2. Fix all checker errors.
3. Ensure `git`, `gh`, a GitHub remote, and GitHub auth are available.
4. Run:

```bash
python3 scripts/deploy_pages.py --branch main --path /
```

5. Report the Pages URL from the script output.


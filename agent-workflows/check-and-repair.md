# Check And Repair

Run:

```bash
python3 scripts/check.py --json
```

If the checker returns `"status": "fail"`, read `next_actions` in priority order. Apply the suggested fixes, then run the checker again.

Do not finish a Draftpine wireframe while checker errors remain.

For browsable prototypes, route errors are real product issues: create the
missing route file, remove stale route config, or add a normal `<a href="...">`
link so the page can be reached in the browser.

For JSON content mode, content errors are also real product issues: create the
missing JSON file, fix invalid JSON, or remove stale entries from
`contentFiles`. Remote fetches are not allowed; use local static `.json` files.

# Check And Repair

Run:

```bash
python3 scripts/check.py --runtime --json
```

If the checker returns `"status": "fail"`, read `next_actions` in priority order. Apply the suggested fixes, then run the checker again.

Do not finish a Draftpine wireframe while checker errors remain.

For browsable prototypes, route errors are real product issues: create the
missing route file, remove stale route config, or add a normal `<a href="...">`
link so the page can be reached in the browser.

For JSON content mode, content errors are also real product issues: create the
missing JSON file, fix invalid JSON, or remove stale entries from
`contentFiles`. Remote fetches and root-absolute fetches are not allowed; use
relative local static `.json` files.

Checker pass is the mechanical gate, not the whole quality bar. Before
finishing, inspect the result for these common failure modes:

- Raw Markdown, SEO notes, or planning outlines dumped into `<pre>` instead of
  composed UI sections.
- Internal template routes, `{placeholder}` routes, or `change-me` routes shown
  as public pages.
- Filters, tabs, modals, or theme controls that do not change visible UI state.
- Root-absolute local links or assets (`/styles.css`, `/app.js`, `/pricing/`)
  that will break under a GitHub Pages project path.

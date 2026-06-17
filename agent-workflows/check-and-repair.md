# Check And Repair

Run:

```bash
python3 scripts/check.py --runtime --json
```

If the checker returns `"status": "fail"`, read `next_actions` in priority order. Apply the suggested fixes, then run the checker again.

Do not finish a Draftpine wireframe while checker errors remain.

After the checker passes, run the visual QA helper for browsable prototypes,
marketing pages, dashboards, or anything with meaningful layout risk:

```bash
python3 scripts/visual_qa.py --json
```

Inspect the screenshots or manual checklist before reporting completion.

For browsable prototypes, route errors are real product issues: create the
missing route file, remove stale route config, or add a normal `<a href="...">`
link so the page can be reached in the browser.

For JSON content mode, content errors are also real product issues: create the
missing JSON file, fix invalid JSON, or remove stale entries from
`contentFiles`. Remote fetches and root-absolute fetches are not allowed; use
relative local static `.json` files.

Fetch paths must be literal strings directly inside `fetch(...)`. The checker
intentionally rejects `fetch(path)`, `fetch(url)`, computed template strings,
and helper wrappers because it cannot prove those stay static and GitHub Pages
safe.

Checker pass is the mechanical gate, not the whole quality bar. Before
finishing, inspect the result for these common failure modes:

- Raw Markdown, SEO notes, or planning outlines dumped into `<pre>` instead of
  composed UI sections.
- Internal template routes, `{placeholder}` routes, or `change-me` routes shown
  as public pages.
- Filters, tabs, modals, or theme controls that do not change visible UI state.
- Root-absolute local links or assets (`/styles.css`, `/app.js`, `/pricing/`)
  that will break under a GitHub Pages project path.
- Missing theme bootstrap before Pico CSS, which causes light/dark flashes and
  pages ignoring stored theme preferences.
- Route pages whose `x-data` factory is not defined in `app.js`.
- Navigation drift between configured route pages; use shared shell helpers.

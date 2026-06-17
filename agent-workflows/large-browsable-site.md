# Large Browsable Site Workflow

Use this for IA-backed sites, marketing sites, docs, or app prototypes with many
routes.

1. Read `AGENTS.md`, `patterns/design-profiles.md`, and relevant pattern files.
2. Choose one design profile for the whole prototype.
3. Build the route graph in `draftpine.config.json`.
4. Generate every route as a minimal valid shell before enriching content.
5. Add shared `SITE_NAV`, `SITE_FOOTER`, and `createDraftpineShell()` usage in
   `app.js`.
6. Add literal route links through nav, hub pages, related links, or a static
   sitemap footer so every route is reachable without Alpine.
7. Run `python3 scripts/check.py --runtime --json`.
8. Split enrichment by route group only after the route shell passes.
9. Keep shared files owned by one coordinator; subagents should not edit
   `app.js`, `styles.css`, or `draftpine.config.json` unless assigned.
10. Run the checker again, then run `python3 scripts/visual_qa.py --json`.

For content-heavy source folders, start with:

```bash
python3 scripts/scaffold_from_content.py path/to/pages --write
```

Then replace the generated route shells with composed UI sections. Do not leave
raw Markdown body dumps as the final screen.

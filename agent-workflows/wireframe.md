# Wireframe Workflow

Use this workflow when the user asks for a new or revised Draftpine wireframe.

1. Read `AGENTS.md`.
2. Normalize the user prompt into the screen packet shape in `schemas/screen-packet.schema.json`.
3. Choose `single-screen` or `browsable` mode.
4. Choose `inline` or `json` content mode. Prefer `json` for browsable/IA-backed prototypes or content-heavy screens.
5. Read `patterns/README.md`, choose one design profile from `patterns/design-profiles.md`, and read the relevant pattern/component files.
6. Choose a concise pattern recipe; inspect `examples/` only as reference if needed.
7. For `single-screen`, update the root `index.html`, `styles.css`, `app.js`, and `draftpine.config.json`.
8. For `browsable`, keep `/` as the homepage, add route folders for new pages, wire real relative links, update `draftpine.config.json` `routes`, and use the shared `SITE_NAV`/`SITE_FOOTER`/`createDraftpineShell()` helpers.
9. Exclude internal templates, unresolved `{placeholder}` routes, and `change-me` pages from public route maps unless the user explicitly asks for template inspection.
10. For JSON content mode, put copy/data in `content/*.json`, declare files in `contentFiles`, and load only relative local static JSON.
11. Transform source material into page UI. Do not use raw Markdown dumps as the main screen body.
12. Include `data-draftpine-*` markers for required actions, states, and interactions.
13. Make interactions real: filters should render filtered collections, tabs should switch panels, and modals should open/close.
14. Run `python3 scripts/check.py --runtime --json`.
15. Fix all errors in `next_actions` and rerun until passing.
16. For browsable prototypes or visual-heavy screens, run `python3 scripts/visual_qa.py --json` and inspect the screenshots/checklist.
17. Summarize the implemented design profile, pattern recipe, routes, content files, states, interactions, and visual QA result.

# Wireframe Workflow

Use this workflow when the user asks for a new or revised Draftpine wireframe.

1. Read `AGENTS.md`.
2. Normalize the user prompt into the screen packet shape in `schemas/screen-packet.schema.json`.
3. Choose `single-screen` or `browsable` mode.
4. Choose `inline` or `json` content mode. Prefer `json` for browsable/IA-backed prototypes or content-heavy screens.
5. Read `patterns/README.md` and the relevant pattern files.
6. Choose a concise pattern recipe; inspect `examples/` only as reference if needed.
7. For `single-screen`, update the root `index.html`, `styles.css`, `app.js`, and `draftpine.config.json`.
8. For `browsable`, keep `/` as the homepage, add route folders for new pages, wire real links, and update `draftpine.config.json` `routes`.
9. For JSON content mode, put copy/data in `content/*.json`, declare files in `contentFiles`, and load only local static JSON.
10. Include `data-draftpine-*` markers for required actions, states, and interactions.
11. Run `python3 scripts/check.py --json`.
12. Fix all errors in `next_actions` and rerun until passing.
13. Summarize the implemented pattern recipe, routes, content files, states, and interactions.

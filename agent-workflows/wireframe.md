# Wireframe Workflow

Use this workflow when the user asks for a new or revised Draftpine wireframe.

1. Read `AGENTS.md`.
2. Normalize the user prompt into the screen packet shape in `schemas/screen-packet.schema.json`.
3. Read `patterns/README.md` and the relevant pattern files.
4. Choose a concise pattern recipe; inspect `examples/` only as reference if needed.
5. Update `draftpine.config.json` with the selected screen, patterns, states, and interactions.
6. Edit `index.html`, `styles.css`, and `app.js`.
7. Include `data-draftpine-*` markers for required actions, states, and interactions.
8. Run `python3 scripts/check.py --json`.
9. Fix all errors in `next_actions` and rerun until passing.
10. Summarize the implemented pattern recipe, states, and interactions.

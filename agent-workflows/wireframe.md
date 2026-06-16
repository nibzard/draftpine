# Wireframe Workflow

Use this workflow when the user asks for a new or revised Draftpine wireframe.

1. Read `AGENTS.md`.
2. Normalize the user prompt into the screen packet shape in `schemas/screen-packet.schema.json`.
3. Read `templates/*/template.json` and choose the closest fit.
4. Update `draftpine.config.json` with the selected screen, states, and interactions.
5. Edit `index.html`, `styles.css`, and `app.js`.
6. Include `data-draftpine-*` markers for required actions, states, and interactions.
7. Run `python3 scripts/check.py --json`.
8. Fix all errors in `next_actions` and rerun until passing.
9. Summarize the implemented states and interactions.


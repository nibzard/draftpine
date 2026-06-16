---
name: wireframe-check
description: Run Draftpine's agent-oriented checker, read next_actions, and repair the wireframe until all errors pass.
---

Run the Draftpine check and repair loop.

Command:

```bash
python3 scripts/check.py --json
```

If `"status"` is `"fail"`:

1. Read `next_actions`.
2. Fix errors in priority order.
3. Keep edits scoped to `index.html`, `styles.css`, `app.js`, and `draftpine.config.json` unless the checker points elsewhere.
4. Rerun the checker.
5. Continue until `"status"` is `"pass"`.

Do not finish a wireframe task while checker errors remain.


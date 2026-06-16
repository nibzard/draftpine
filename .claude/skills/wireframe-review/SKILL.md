---
name: wireframe-review
description: Audit an existing Draftpine wireframe against the kit's quality bar — required screen states, accessibility, responsive layout, and stack discipline (no rogue frameworks or build tools). Use when the user wants to review, check, or critique a wireframe screen before sharing it.
---

Read and follow `AGENTS.md`.

Review the wireframe against the quality bar in `AGENTS.md`.

Also run:

```bash
python3 scripts/check.py --runtime --json
```

Use the checker's `next_actions` as the authoritative repair list for mechanical Draftpine guardrail issues.

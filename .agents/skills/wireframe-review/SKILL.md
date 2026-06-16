---
name: wireframe-review
description: Audit an existing Draftpine wireframe against the kit's quality bar, checker output, states, accessibility, responsiveness, and stack discipline.
---

Read and follow `AGENTS.md`.

Review the wireframe against the quality bar in `AGENTS.md`, then run:

```bash
python3 scripts/check.py --runtime --json
```

Use the checker's `next_actions` as the authoritative repair list for mechanical Draftpine guardrail issues.


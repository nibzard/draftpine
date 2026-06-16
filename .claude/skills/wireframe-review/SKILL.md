---
name: wireframe-review
description: Audit an existing Draftpine wireframe against the kit's quality bar — required screen states, accessibility, responsive layout, and stack discipline (no rogue frameworks or build tools). Use when the user wants to review, check, or critique a wireframe screen before sharing it.
---

Review a wireframe in this repo against the Draftpine quality bar. This is a
quality audit, not a feature build — report findings and offer to fix them, but
do not redesign the screen unless asked.

## What to check

Read `AGENTS.md`, `draftpine.config.json`, `index.html`, `styles.css`, and `app.js`, then evaluate each screen:

### States
A screen is "done" when it covers the states that matter for its flow:
- **default** — the happy path
- **empty** — no data yet
- **loading** — if it clarifies the flow
- **error** — if it clarifies the flow
- **success / confirmation** — if it clarifies the flow

Flag screens that only show the happy path when an empty or error state would
change the product thinking.

### Stack discipline
- No React, Vue, Tailwind, TypeScript, routers, npm dependencies, or build tools.
- Pico CSS v2 + Alpine.js v3 via CDN only.
- Custom CSS limited to layout, spacing, and density — not a Pico redesign.
- Alpine used only for local prototype behavior, not a simulated backend.

### Accessibility & responsiveness
- Form controls have labels; interactive elements are keyboard-reachable.
- Semantic HTML (`nav`, `header`, `main`, `section`, `table`, `dialog`, `form`).
- Layout holds up at narrow widths; no fixed widths that break on mobile.

### Markup quality
- Readable spacing and simple, maintainable markup.
- State kept inline with `x-data` when small; lifted into `app.js` when larger or repeated.

## Output

Report findings grouped by screen, each with the file, the issue, and a concrete
fix. End with a short prioritized list of what to address first. Offer to apply
the fixes — but keep changes scoped to the issues found.

Also run:

```bash
python3 scripts/check.py --json
```

Use the checker's `next_actions` as the authoritative repair list for mechanical Draftpine guardrail issues.

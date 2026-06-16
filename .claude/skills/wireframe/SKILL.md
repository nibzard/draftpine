---
name: wireframe
description: Build or revise a minimal Pico CSS + Alpine.js wireframe screen from a product idea, screen packet, rough requirements, or screenshot. Use whenever the user wants to prototype, sketch, mock up, or iterate on a UI screen or flow in this kit.
---

Create or revise a fast product wireframe using this repo's conventions. Start
by reading `AGENTS.md`. The goal
is a disposable prototype that's useful for product thinking — hierarchy, flow,
copy, and states — not pixel-perfect final UI.

## Input

The request may include any of: product idea, target user, screen name, user
goal, primary/secondary actions, sections, required states, fake data,
interactions, responsive notes, constraints, or a screenshot/sketch. A
well-formed "screen packet" looks like:

```text
Screen: Usage billing dashboard
Audience: startup founder
User goal: understand current usage before upgrading
Primary action: upgrade plan
Sections: summary cards, usage chart placeholder, invoices table, plan comparison
States: normal, over-limit warning, empty invoices
Interactions: tabs, modal, filter invoices
Do not include: authentication, real chart library, backend calls
```

If the request is vague, ask for the missing pieces (audience, goal, primary
action, key states) before editing.

## Process

1. Briefly restate the requested screen or flow.
2. Identify the core sections and user actions.
3. Choose `single-screen` or `browsable` mode.
4. Choose `inline` or `json` content mode. Prefer `json` for browsable/IA-backed prototypes or content-heavy screens.
5. Choose a concise pattern recipe from `patterns/`.
6. Propose a short implementation plan before editing.
7. Inspect `examples/` only as reference if a finished screen helps.
8. In `single-screen` mode, edit the root `index.html`, `styles.css`, `app.js`, and `draftpine.config.json`.
9. In `browsable` mode, keep `/` as home, add route folders for new pages, wire real links, and update `draftpine.config.json` `routes`.
10. In JSON content mode, put copy/data in `content/*.json`, declare files in `contentFiles`, and load only local static JSON.
11. Keep the `Draftpine base theme` block at the top of `styles.css` and the Inter font `<link>` tags in the head (the kit's shared warm-grey monochrome look). Restyle through Pico's `--pico-*` tokens first; add minimal custom CSS only for layout, spacing, and density.
12. Use Alpine only for local prototype behavior (tabs, dropdowns, modals, search, fake CRUD).
13. Include realistic placeholder copy and fake data in `app.js` or content JSON.
14. Include empty / error / success states whenever they clarify the flow.
15. Add `data-draftpine-*` markers for required actions, states, and interactions.
16. Run `python3 scripts/check.py --json` and fix all errors before finishing.
17. Keep the result easy to throw away or rewrite.

## Hard constraints

- Plain HTML / CSS / JS only.
- Pico CSS v2 (CDN) for visual defaults; Alpine.js v3 (CDN) for interactions.
- **Do not** introduce React, Vue, Tailwind, TypeScript, build tools, routers,
  npm dependencies, or component libraries unless explicitly requested.
- Keep small state inline with `x-data`; move repeated or larger state into `app.js`.
- Do not simulate a real backend.

## After implementing, summarize

- What changed.
- Which prototype mode and routes exist.
- Which content mode and content files exist.
- What interactions exist.
- What to review in the browser (especially which states to click through).
- The final checker status.

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
3. Choose the closest template from `templates/*/template.json`.
4. Propose a short implementation plan before editing.
5. Edit only `index.html`, `styles.css`, `app.js`, and `draftpine.config.json` unless asked otherwise.
6. Use Pico defaults first; add minimal custom CSS only for layout, spacing, and density.
7. Use Alpine only for local prototype behavior (tabs, dropdowns, modals, search, fake CRUD).
8. Include realistic placeholder copy and fake data in `app.js`.
9. Include empty / error / success states whenever they clarify the flow.
10. Add `data-draftpine-*` markers for required actions, states, and interactions.
11. Run `python3 scripts/check.py --json` and fix all errors before finishing.
12. Keep the result easy to throw away or rewrite.

## Hard constraints

- Plain HTML / CSS / JS only.
- Pico CSS v2 (CDN) for visual defaults; Alpine.js v3 (CDN) for interactions.
- **Do not** introduce React, Vue, Tailwind, TypeScript, build tools, routers,
  npm dependencies, or component libraries unless explicitly requested.
- Keep small state inline with `x-data`; move repeated or larger state into `app.js`.
- Do not simulate a real backend.

## After implementing, summarize

- What changed.
- What interactions exist.
- What to review in the browser (especially which states to click through).
- The final checker status.

# Draftpine Agent Instructions

Draftpine is an agent-first static wireframe kit. Your job is to turn a user's product prompt into a quick, disposable, consistent HTML wireframe that can be previewed locally and deployed to GitHub Pages.

## Happy Path

1. Read this file before editing.
2. Convert the user's request into a screen packet.
3. Pick the closest template from `templates/` when starting a new screen.
4. Edit only `index.html`, `styles.css`, `app.js`, and `draftpine.config.json` unless the user asks for project-level changes.
5. Use plain HTML, CSS, and JavaScript.
6. Use Pico CSS v2 from a CDN for visual defaults.
7. Use Alpine.js v3 from a CDN for local prototype behavior.
8. Run `python3 scripts/check.py --json`.
9. Fix every `error` in `next_actions`, then rerun the check until it passes.
10. Deploy to GitHub Pages only when the user explicitly asks to publish or deploy.

## Hard Constraints

- Do not add npm, package managers, bundlers, transpilers, TypeScript, routers, backend services, or component libraries.
- Do not add React, Vue, Svelte, Tailwind, Bootstrap, or charting libraries.
- Do not call real APIs or simulate production backend logic.
- Keep the prototype static and GitHub Pages compatible.
- Keep custom CSS focused on layout, spacing, density, and wireframe polish.
- Prefer semantic HTML: `nav`, `header`, `main`, `section`, `article`, `aside`, `form`, `table`, `dialog`.

## Required Markers

Use these markers so `scripts/check.py` can give reliable feedback:

```html
<button data-draftpine-action="primary">Upgrade plan</button>
<section data-draftpine-state="empty">...</section>
<section data-draftpine-state="error">...</section>
<section data-draftpine-state="success">...</section>
<div data-draftpine-interaction="filter">...</div>
<dialog data-draftpine-interaction="modal">...</dialog>
```

Required states and interactions are declared in `draftpine.config.json`.

## Screen Packet Shape

When the user gives an informal prompt, internally normalize it to:

```json
{
  "screen": "Usage billing dashboard",
  "audience": "startup founder",
  "userGoal": "Understand current usage before upgrading",
  "primaryAction": "Upgrade plan",
  "sections": ["summary cards", "usage chart placeholder", "invoices table"],
  "states": ["default", "empty", "over-limit", "success"],
  "interactions": ["tabs", "modal", "filter"],
  "doNotInclude": ["authentication", "backend calls", "real chart library"]
}
```

## Quality Bar

A Draftpine wireframe is acceptable when:

- `index.html` opens directly or through `python3 -m http.server 5173`.
- The screen has a clear title, target user context, and primary action.
- Fake data is realistic enough to support product thinking.
- Empty, error, warning, and success states exist when they change the flow.
- Forms have labels and buttons have text or `aria-label`.
- Layout is responsive without fixed desktop-only widths.
- `python3 scripts/check.py --json` returns `"status": "pass"`.

## Deployment

If the user asks to deploy:

1. Run `python3 scripts/check.py --json` and fix errors.
2. Run `python3 scripts/deploy_pages.py --branch main --path /`.
3. Report the live GitHub Pages URL from the script output.


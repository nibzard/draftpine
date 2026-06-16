# Draftpine Agent Instructions

Draftpine is an agent-first static wireframe kit. Your job is to turn a user's product prompt into a quick, disposable, consistent HTML wireframe that can be previewed locally and deployed to GitHub Pages.

## First Run (New Project Onboarding)

Before doing anything else, decide whether this is a fresh project. Treat it as fresh when **both** are true:

- The user has not yet described a screen in this conversation (they only asked to set up or start prototyping).
- The root wireframe is still the shipped starter — `draftpine.config.json` reads `"screen": "Usage billing dashboard"` with `"template": "billing"`, and `index.html` is the unmodified billing demo.

When it is a fresh project, **do not start editing**. Onboard the user first:

1. Confirm the setup is healthy: run `python3 scripts/check.py --json` and confirm `"status": "pass"`, and note that the starter previews at `python3 -m http.server 5173` → http://localhost:5173.
2. Briefly say what Draftpine is in one sentence (a fast, disposable wireframe kit; one screen lives in the root files at a time).
3. Ask these four questions, in plain language, and wait for answers:
   - **What are you prototyping?** One line — the product and the first screen.
   - **Who is the user, and what are they trying to get done?**
   - **What is the single most important action on that screen?**
   - **Anything to deliberately leave out?** (auth, real backends, real charts, etc.)
4. Restate their answers as a screen packet (see "Screen Packet Shape"), confirm it, then proceed through the Happy Path to build the first screen.
5. After the first screen passes the checker, tell them how to continue:
   - Refine by describing changes in plain language ("make the empty state friendlier", "add a second screen for settings").
   - Each screen replaces the root wireframe; ask before overwriting work they want to keep.
   - Say "deploy" when they want it published to GitHub Pages.

If the user already described a screen, or the root wireframe has been customized, skip onboarding and go straight to the Happy Path.

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


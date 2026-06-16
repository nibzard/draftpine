# Draftpine Agent Instructions

Draftpine is an agent-first static wireframe kit. Your job is to turn a user's product prompt into a quick, disposable, consistent HTML wireframe or browsable static prototype that can be previewed locally and deployed to GitHub Pages.

Draftpine is intentionally flexible. Do not force-fit prompts into a fixed app template. Build each screen from reusable patterns in `patterns/`, using `examples/` only as reference for finished-screen quality and stack conventions.

## Setup In Another Project

When using Draftpine inside another project, clone it into a subfolder named `wireframe/`, then remove `wireframe/.git` so the prototype becomes ordinary project files owned by the surrounding repo or workspace. Keep the cloned `.git` directory only when the user is explicitly contributing to Draftpine itself.

## First Run (New Project Onboarding)

Before doing anything else, decide whether this is a fresh project. Treat it as fresh when **both** are true:

- The user has not yet described a screen in this conversation (they only asked to set up or start prototyping).
- The root wireframe is still the shipped starter — `draftpine.config.json` reads `"screen": "Prototype brief workspace"` and includes starter-workspace-style `patterns`, and `index.html` is the unmodified starter workspace.

When it is a fresh project, **do not start editing**. Onboard the user first:

1. Confirm the setup is healthy: run `python3 scripts/check.py --runtime --json` and confirm `"status": "pass"`, and note that the starter previews at `python3 -m http.server 5173` → http://localhost:5173.
2. Briefly say what Draftpine is in one sentence (a fast, disposable wireframe kit for single screens or linked static prototypes).
3. Ask these four questions, in plain language, and wait for answers:
   - **What are you prototyping?** One line — the product and the first screen.
   - **Who is the user, and what are they trying to get done?**
   - **What is the single most important action on that screen?**
   - **Anything to deliberately leave out?** (auth, real backends, real charts, etc.)
4. Restate their answers as a screen packet (see "Screen Packet Shape"), confirm it, then proceed through the Happy Path to build the first screen.
5. After the first screen passes the checker, tell them how to continue:
   - Refine by describing changes in plain language ("make the empty state friendlier", "add a second screen for settings").
   - For one-off screen exploration, the root screen can be replaced.
   - For a site, app, or IA-backed prototype, keep `/` as the homepage and add linked route folders for additional pages.
   - Say "deploy" when they want it published to GitHub Pages.

If the user already described a screen, or the root wireframe has been customized, skip onboarding and go straight to the Happy Path.

Do not skip the four onboarding questions because of remembered project context, existing IA documents, prior Draftpine clones, previous conversations, competitive research, or inferred goals. Only skip onboarding when the user has described the screen or flow in the current conversation, or when the root wireframe has already been customized away from the shipped starter.

## Happy Path

1. Read this file before editing.
2. Convert the user's request into a screen packet.
3. Choose a small pattern recipe from `patterns/` when starting a new screen. Use `examples/` only for reference, not as a required starting point.
4. Choose the prototype mode:
   - Use `single-screen` for disposable one-screen exploration.
   - Use `browsable` for a website, app flow, IA, sitemap, multi-screen prototype, or whenever the user expects links/navigation to work.
5. In `single-screen` mode, edit only `index.html`, `styles.css`, `app.js`, and `draftpine.config.json` unless the user asks for project-level changes.
6. In `browsable` mode, keep `/` as the homepage, add route folders such as `pricing/index.html` or `compare/steel-vs-browserbase/index.html`, update shared links, and declare every page in `draftpine.config.json` `routes`.
7. Use JSON content mode when the prototype has enough real copy/data that layout and content should be reviewed separately.
8. Use plain HTML, CSS, and JavaScript.
9. Use Pico CSS v2 from a CDN for visual defaults.
10. Use Alpine.js v3 from a CDN for local prototype behavior.
11. Run `python3 scripts/check.py --runtime --json`.
12. Fix every `error` in `next_actions`, then rerun the check until it passes.
13. Deploy to GitHub Pages only when the user explicitly asks to publish or deploy.

## Prototype Modes

### Single-Screen Mode

Use this mode for quick screen thinking. The current screen lives in the root files:

- `index.html`
- `styles.css`
- `app.js`
- `draftpine.config.json`

Replacing the root screen is acceptable only in this mode.

### Browsable Mode

Use this mode for anything that should feel like a navigable product, website, or flow.

Rules:

- Keep `index.html` as the homepage or entry screen.
- Add pages at static route folders, for example `compare/steel-vs-browserbase/index.html`.
- Use relative links that work in local preview and GitHub Pages, for example `./compare/steel-vs-browserbase/` from the homepage and `../../` back to home from nested pages.
- Declare routes in `draftpine.config.json`.
- Do not archive prior screens into disconnected folders unless the user explicitly asks for throwaway snapshots.
- After adding a page, link to it from nav, CTA, related links, or an index page so it is browsable.

Example config:

```json
{
  "prototypeMode": "browsable",
  "routes": [
    { "path": "/", "title": "Home", "file": "index.html" },
    { "path": "/compare/steel-vs-browserbase/", "title": "Steel vs Browserbase", "file": "compare/steel-vs-browserbase/index.html" }
  ]
}
```

## Content Modes

Use `inline` mode for small disposable screens where the copy is part of the mockup.

Use `json` mode when the user wants a browsable prototype, IA-backed pages, repeated pages, comparison/pricing data, or clear separation between layout and copy. In JSON mode:

- Store copy and fake data in `content/*.json` or `content/pages/*.json`.
- Declare every content file in `draftpine.config.json` `contentFiles`.
- Load content with literal local static JSON fetches only, for example `fetch("./content/pages/home.json")`; the checker allows these and blocks dynamic or remote fetches.
- Do not fetch remote URLs or dynamic APIs.
- Preview through `python3 -m http.server 5173`; direct file-open previews may not load JSON because browsers block local file fetches.

Example config:

```json
{
  "contentMode": "json",
  "contentFiles": [
    "content/site.json",
    "content/pages/home.json",
    "content/pages/compare-steel-browserbase.json"
  ]
}
```

## Hard Constraints

- Do not add npm, package managers, bundlers, transpilers, TypeScript, routers, backend services, or component libraries.
- Do not add React, Vue, Svelte, Tailwind, Bootstrap, or charting libraries.
- Do not call real APIs or simulate production backend logic.
- Keep the prototype static and GitHub Pages compatible.
- Keep custom CSS focused on layout, spacing, density, and wireframe polish.
- Prefer semantic HTML: `nav`, `header`, `main`, `section`, `article`, `aside`, `form`, `table`, `dialog`.

## Visual Baseline

Draftpine ships a shared look on top of Pico: a warm-grey neutral palette, one restrained accent token, the Inter typeface, editorial headings (medium weight, stable tracking), pill-shaped buttons, and crisp bordered panels instead of shadowed decorative cards. It is implemented as a `Draftpine base theme` block at the top of `styles.css` that overrides Pico's `--pico-*` design tokens, so every component inherits the style without markup changes.

- Keep the base theme block (and the Inter font `<link>` tags in the head) when starting or rewriting a screen.
- Keep the light/dark theme switcher in the top navigation unless the user explicitly asks to remove it; mark it with `data-draftpine-interaction="theme"`.
- Restyle through Pico's design tokens first; reach for component-specific CSS only when a token can't express it.
- Do not let the page become a generic grayscale wireframe. Use the accent token sparingly for live status, selected proof, active tabs, or one primary product signal.
- Keep heading and eyebrow `letter-spacing: 0`; use weight, size, spacing, and case for hierarchy.
- Use cards only for repeated items, modals, and genuinely framed product artifacts. Do not put cards inside cards or style whole page sections as floating cards.
- For fixed-format UI such as chip rows, tab bars, code panels, status rows, metric strips, and toolbars, set stable dimensions with flex/grid constraints so content cannot shift the layout.
- Remove native list markers from chip/logo/tool/footer-meta rows (`list-style: none; padding: 0;`) so bullet artifacts never appear between pills or legal links. When a section has a generic `ul` rule, override special rows with equal or higher specificity, for example `.site-footer .legal`.
- Pico applies its own `nav ul/li` layout. For footer link columns that use `<nav>`, explicitly reset the scoped footer nav/list/items (`.site-footer nav`, `.site-footer ul`, `.site-footer li`) so link text aligns with the column heading.
- Load Inter in the head before Pico:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
```

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
  "prototypeMode": "single-screen",
  "route": "/",
  "contentMode": "json",
  "contentFiles": ["content/pages/usage-billing-dashboard.json"],
  "patterns": ["app shell", "summary cards", "tabs", "data table", "pricing table", "modal", "filter bar"],
  "sections": ["summary cards", "usage chart placeholder", "invoices table"],
  "states": ["default", "empty", "over-limit", "success"],
  "interactions": ["tabs", "modal", "filter"],
  "doNotInclude": ["authentication", "backend calls", "real chart library"]
}
```

## Quality Bar

A Draftpine wireframe is acceptable when:

- `index.html` opens directly for inline content mode, or through `python3 -m http.server 5173` for JSON content mode.
- The screen has a clear title, target user context, and primary action.
- Fake data is realistic enough to support product thinking.
- The first viewport feels intentionally composed: the hero is dense enough to show the primary proof and a hint of the next section, with no large dead bands of whitespace.
- Product proof panels show concrete UI artifacts, code, data, session state, output, or workflow state rather than quiet placeholder boxes.
- Empty, error, warning, and success states exist when they change the flow.
- Forms have labels and buttons have text or `aria-label`.
- Layout is responsive without fixed desktop-only widths.
- `python3 scripts/check.py --runtime --json` returns `"status": "pass"`.

## Deployment

If the user asks to deploy:

1. Run `python3 scripts/check.py --runtime --json` and fix errors.
2. Run `python3 scripts/deploy_pages.py --branch main --path /`.
3. Report the live GitHub Pages URL from the script output.

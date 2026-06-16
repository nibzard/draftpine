<p align="center">
  <img src="docs/brand/draftpine-mark-animated.svg" alt="Draftpine" width="200">
</p>

<p align="center">
  <strong>Wireframes your coding agent can actually build.</strong><br>
  Plain HTML + Pico + Alpine single-screen wireframes or linked prototypes — no build step, no framework, deployable to GitHub Pages.
</p>

<p align="center">
  <code>plain HTML</code> · <code>Pico CSS</code> · <code>Alpine.js</code> · <code>no build tools</code> · <code>GitHub Pages</code>
</p>

---

Hand a coding agent a vague "make me a billing dashboard" and it tends to reach for React, a bundler, and an afternoon of setup. Draftpine removes that temptation. It's a small, opinionated workspace that gives the agent strict rules, reusable screen patterns, finished examples, and a checker that tells it exactly what to fix — so you get a throwaway wireframe or browsable static prototype in one pass, not a half-built app.

You bring the product idea. Draftpine handles the guardrails.

## Quickstart

**1. Paste this into your coding agent to set up the project:**

```text
Clone https://github.com/nibzard/draftpine into a new subfolder named wireframe,
remove wireframe/.git so the prototype is ordinary project files, read AGENTS.md,
run `python3 scripts/check.py --json` to confirm the starter passes, start a local
preview at http://localhost:5173, then ask me which screen or prototype flow to build first.
```

The agent clones the kit into `wireframe/`, removes the cloned upstream Git metadata, reads the contract, verifies the checker is green, and serves the starter wireframe locally. You're now ready to prototype. Keep `.git` only when you are contributing to Draftpine itself.

**2. Whenever you want a screen, describe it:**

```text
Build a wireframe:
Screen:        Usage billing dashboard
Audience:      startup founder
User goal:     understand current usage before upgrading
Primary action: upgrade plan
Sections:      summary cards, usage chart placeholder, invoices table, plan comparison
States:        default, empty invoices, over-limit warning, success
Interactions:  tabs, modal, filter invoices
Skip:          auth, backend calls, real chart library
```

The agent assembles a screen-specific pattern recipe, chooses single-screen or browsable mode, edits the static files, and loops on the checker until it passes. Refine, add screens, or ask it to deploy when you're happy.

## How it works

```text
your prompt
  → agent reads AGENTS.md            (the rules)
  → agent chooses patterns/          (a screen-specific recipe)
  → agent chooses prototype mode     (single-screen or browsable)
  → agent may inspect examples/      (finished reference screens)
  → agent edits static HTML/CSS/JS plus draftpine.config.json
  → python3 scripts/check.py --json  (structured pass/fail + fixes)
  → agent loops until status: pass
  → deploy to GitHub Pages           (only when you ask)
```

For single-screen exploration, only `index.html`, `styles.css`, `app.js`, and `draftpine.config.json` change. For browsable prototypes, `/` stays the homepage and additional pages live in route folders such as `pricing/index.html` or `compare/steel-vs-browserbase/index.html`.

## Preview locally

```bash
python3 -m http.server 5173
# open http://localhost:5173
```

## The checker

`scripts/check.py` is built for agents: it returns prioritized, machine-readable repairs instead of prose.

```bash
python3 scripts/check.py --json
```

```json
{
  "status": "fail",
  "summary": { "errors": 1, "warnings": 0, "passes": 12 },
  "next_actions": [
    {
      "priority": 1,
      "rule": "required-state.empty",
      "file": "index.html",
      "message": "Required state 'empty' is missing.",
      "suggested_fix": "Add an element with data-draftpine-state=\"empty\"."
    }
  ]
}
```

The agent works the `next_actions` list until `"status": "pass"`. The checker enforces the stack rules below, required states/interactions from `draftpine.config.json`, semantic landmarks, and basic accessibility (button and form labels).

Extra modes:

```bash
python3 scripts/check.py --examples --json    # verify each example's metadata matches its markup
python3 -m unittest discover -s tests          # run the checker's tests (stdlib only)
```

## Deploy to GitHub Pages

Ask the agent to deploy, and it runs:

```bash
python3 scripts/deploy_pages.py --branch main --path /
```

The script refuses to publish unless `git`, `gh`, GitHub auth, an `origin` remote, and a passing check are all in place, then enables or updates Pages and prints the live URL. If the working tree is dirty, it only auto-commits the root wireframe files plus configured route HTML and JSON content files from `draftpine.config.json`, and asks you to handle unrelated files first.

## Stack rules

- Plain HTML, CSS, and JavaScript only.
- Pico CSS v2 and Alpine.js v3, both from a CDN.
- No npm, React, Vue, Svelte, Tailwind, TypeScript, bundlers, routers, backend calls, or chart libraries.
- Custom CSS stays small — layout, spacing, and density, not a design system.

## Markers

Lightweight `data-draftpine-*` attributes let the checker judge intent without parsing your design:

```html
<button data-draftpine-action="primary">Upgrade plan</button>
<section data-draftpine-state="empty">…</section>
<section data-draftpine-state="success">…</section>
<div data-draftpine-interaction="filter">…</div>
<dialog data-draftpine-interaction="modal">…</dialog>
```

Which states and interactions are required is declared in `draftpine.config.json`.

## Single-Screen Or Browsable

Draftpine supports two prototype modes:

| Mode | Use it when | File behavior |
| --- | --- | --- |
| `single-screen` | You are exploring one disposable screen. | The root files hold the current screen. |
| `browsable` | You are building a website, app flow, IA, or multiple connected screens. | Keep `/` as home, add route folders, and wire real links. |

Browsable prototypes declare routes in `draftpine.config.json`:

```json
{
  "prototypeMode": "browsable",
  "routes": [
    { "path": "/", "title": "Home", "file": "index.html" },
    { "path": "/compare/steel-vs-browserbase/", "title": "Steel vs Browserbase", "file": "compare/steel-vs-browserbase/index.html" }
  ]
}
```

The checker verifies that route files exist and that non-home routes are linked from the configured pages.

## JSON Content Mode

Draftpine can keep layout and copy separate. Use `contentMode: "json"` when a prototype has real IA copy, repeated pages, comparison data, pricing tables, or content that should be reviewed without touching markup.

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

Layouts can load those files with literal local static fetches:

```js
async function loadHomeContent() {
  const response = await fetch("./content/pages/home.json");
  if (!response.ok) throw new Error("Missing content: ./content/pages/home.json");
  return response.json();
}
```

GitHub Pages serves JSON files normally, and `python3 -m http.server 5173` does too. Directly opening `index.html` from the filesystem may not load JSON because browsers block local file fetches.

The checker allows local `.json` fetches and still blocks remote/backend fetches.

## Patterns And Examples

Draftpine is pattern-first. Agents should assemble screens from `patterns/` instead of force-fitting prompts into a whole-screen template.

Useful pattern groups:

| Group | Use it for |
| --- | --- |
| `patterns/heroes.md` | outcome heroes, code/runtime heroes, benchmark heroes, install-command heroes |
| `patterns/proof.md` | logo walls, metrics, testimonials, customer stories, compliance strips |
| `patterns/developer.md` | code tabs, request/response blocks, IDE/browser mocks, quickstarts |
| `patterns/features.md` | feature bentos, alternating rows, use-case grids, spec tables |
| `patterns/conversion.md` | CTA pairs, final CTA bands, pricing, calculators |
| `patterns/interactions.md` | tabs, filters, modals, accordions, copy buttons |

The old full-screen starters live in `examples/`. They are reference screens, not mandatory starting points:

| Example | Shows |
| --- | --- |
| `billing` | usage, invoices, subscriptions, plan upgrades |
| `dashboard` | metrics, reporting, status, operational overviews |
| `crm-pipeline` | deal flow, stages, sales workflows |
| `onboarding` | setup, activation, checklists, invites |

## Repo layout

```text
AGENTS.md            agent contract (read first); CLAUDE.md mirrors it for Claude Code
index.html · styles.css · app.js · draftpine.config.json   the wireframe you edit
route folders        optional browsable pages, e.g. compare/steel-vs-browserbase/index.html
scripts/             check.py (the checker) · deploy_pages.py (Pages publish)
tests/               stdlib unit tests for the checker
patterns/            reusable screen patterns agents compose from
examples/            finished reference screens
schemas/             JSON schemas for the screen packet and config
agent-workflows/     step-by-step playbooks; .claude/skills/ mirrors them
```

---

Draftpine is not a frontend framework. It's a constrained workspace for fast product thinking with coding agents — built to be thrown away and rebuilt as the idea changes.

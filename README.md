<h1 align="center">Draftpine</h1>

<p align="center">
  <strong>Agent-ready HTML wireframes.</strong><br>
  Fast Pico + Alpine prototypes that coding agents can create, check, iterate, and deploy to GitHub Pages.
</p>

<p align="center">
  <code>plain HTML</code> · <code>Pico CSS</code> · <code>Alpine.js</code> · <code>agent guardrails</code> · <code>GitHub Pages</code>
</p>

---

Draftpine is a static wireframe kit for working with coding agents. The user brings a product prompt; Draftpine gives the agent the rules, templates, validation loop, and deployment path.

The happy path:

```text
paste Draftpine repo URL into an agent
→ agent reads AGENTS.md
→ agent picks a template
→ agent edits index.html, styles.css, app.js
→ agent runs Draftpine check and fixes errors
→ agent deploys to GitHub Pages when asked
```

## Use With A Coding Agent

Paste something like this into your agent:

```text
Use Draftpine from https://github.com/YOURNAME/draftpine.

Create a wireframe:
Screen: Usage billing dashboard
Audience: startup founder
User goal: understand current usage before upgrading
Primary action: upgrade plan
Sections: summary cards, usage chart placeholder, invoices table, plan comparison
States: default, empty invoices, over-limit warning, success confirmation
Interactions: tabs, modal, filter invoices
Do not include: authentication, backend calls, real chart library
```

The agent should:

1. Read `AGENTS.md`.
2. Convert your prompt into a screen packet.
3. Select a template from `templates/`.
4. Customize the root wireframe files.
5. Run `python3 scripts/check.py --json`.
6. Fix all checker errors.
7. Preview locally or deploy when you ask.

## Local Preview

```bash
python3 -m http.server 5173
```

Open:

```text
http://localhost:5173
```

The browser entry point is `index.html`.

## Deploy To GitHub Pages

Ask the agent:

```text
Deploy this Draftpine wireframe to GitHub Pages.
```

The agent should run:

```bash
python3 scripts/deploy_pages.py --branch main --path /
```

The deploy script verifies `git`, `gh`, GitHub auth, a GitHub remote, and a passing Draftpine check before enabling or updating Pages.

## What Ships

```text
draftpine/
├── AGENTS.md                         # generic coding-agent contract
├── CLAUDE.md                         # Claude Code adapter
├── index.html                        # browser entry point
├── styles.css                        # minimal layout and wireframe polish
├── app.js                            # fake data and Alpine state
├── draftpine.config.json             # screen intent for the checker
├── scripts/
│   ├── check.py                      # agent-oriented consistency checker
│   └── deploy_pages.py               # GitHub Pages publish workflow
├── schemas/
│   ├── screen-packet.schema.json
│   └── draftpine-config.schema.json
├── templates/
│   ├── billing/
│   ├── dashboard/
│   ├── crm-pipeline/
│   └── onboarding/
├── agent-workflows/
│   ├── wireframe.md
│   ├── template-selection.md
│   ├── check-and-repair.md
│   └── deploy-github-pages.md
└── .claude/skills/
    ├── wireframe/
    ├── wireframe-review/
    ├── wireframe-template/
    ├── wireframe-check/
    └── wireframe-deploy/
```

## Draftpine Check

Draftpine's checker is designed for agents first. It emits structured repair feedback:

```bash
python3 scripts/check.py --json
```

Example shape:

```json
{
  "status": "fail",
  "summary": {
    "errors": 1,
    "warnings": 0,
    "passes": 12
  },
  "next_actions": [
    {
      "priority": 1,
      "rule": "required-state.empty",
      "file": "index.html",
      "message": "Required state 'empty' is missing.",
      "suggested_fix": "Add a visible or Alpine-controlled element with data-draftpine-state=\"empty\"."
    }
  ]
}
```

Agents should loop on `next_actions` until `"status": "pass"`.

## Stack Rules

- Plain HTML, CSS, and JavaScript only.
- Pico CSS v2 via CDN for default styling.
- Alpine.js v3 via CDN for local interactions.
- No npm, React, Vue, Svelte, Tailwind, TypeScript, build tools, routers, backend calls, or chart libraries.
- Keep custom CSS small and focused on layout, spacing, density, and wireframe-specific polish.

## Consistency Markers

Draftpine uses lightweight HTML markers so the checker can evaluate intent:

```html
<button data-draftpine-action="primary">Upgrade plan</button>
<section data-draftpine-state="empty">...</section>
<section data-draftpine-state="success">...</section>
<div data-draftpine-interaction="filter">...</div>
<dialog data-draftpine-interaction="modal">...</dialog>
```

Required states and interactions live in `draftpine.config.json`.

## Templates

Agents should use templates instead of inventing layouts from scratch:

- `templates/billing` for billing, usage, invoices, plans, and upgrade flows.
- `templates/dashboard` for metrics, reporting, status, and operational overview screens.
- `templates/crm-pipeline` for deal flow, stages, and sales workflows.
- `templates/onboarding` for setup, activation, checklist, and invite flows.

---

Draftpine is not a frontend framework. It is a constrained workspace for fast product thinking with coding agents.


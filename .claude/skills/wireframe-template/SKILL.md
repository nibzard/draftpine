---
name: wireframe-template
description: Select the best Draftpine template for a requested product screen before building the wireframe.
---

Choose a Draftpine template before editing files.

Process:

1. Read `AGENTS.md`.
2. Read `templates/*/template.json`.
3. Compare the user's prompt or screen packet to each template's `bestFor`, `sections`, `states`, and `interactions`.
4. Pick the closest template and explain the choice in one or two sentences.
5. If starting a new screen, adapt that template into root `index.html`, `styles.css`, `app.js`, and `draftpine.config.json`.

Preferred mapping:

- Billing, invoices, usage, plans: `templates/billing`.
- Metrics, reporting, status, overview: `templates/dashboard`.
- Deals, sales, stages, pipeline: `templates/crm-pipeline`.
- Setup, activation, checklist: `templates/onboarding`.


# Draftpine Templates

Templates are starting points for agents. Before building a new screen, inspect each `template.json`, choose the closest match, then adapt the root `index.html`, `styles.css`, `app.js`, and `draftpine.config.json`.

The first set is intentionally narrow:

- `billing` for usage, invoices, subscriptions, and plan upgrades.
- `dashboard` for metrics, operations, analytics, and status screens.
- `crm-pipeline` for deal flow and stage-based workflows.
- `onboarding` for setup, activation, and checklist experiences.

Agents should prefer adapting a close template over inventing layout structure from scratch.

## Keeping templates honest

Every `template.json` advertises the `states` and `interactions` its `index.html` demonstrates. Those declarations must match the `data-draftpine-*` markers in the markup, otherwise the template-selection skill recommends behavior the starting code doesn't have. Validate this whenever a template changes:

```bash
python3 scripts/check.py --templates --json
```


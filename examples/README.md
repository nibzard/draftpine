# Draftpine Examples

Examples are finished reference screens for agents. They show the stack, density, marker conventions, and level of polish Draftpine expects.

Do not force-fit a user's prompt into an example. Build from `patterns/` first, then look at these examples only when you need a concrete reference for structure or interaction markup.

The first set is intentionally narrow:

- `billing` for usage, invoices, subscriptions, and plan upgrades.
- `dashboard` for metrics, operations, analytics, and status screens.
- `crm-pipeline` for deal flow and stage-based workflows.
- `onboarding` for setup, activation, and checklist experiences.

Agents should prefer composing a screen-specific pattern recipe over copying a whole example.

## Keeping examples honest

Every `example.json` advertises the `states` and `interactions` its `index.html` demonstrates. Those declarations must match the `data-draftpine-*` markers in the markup, otherwise examples drift from the behavior they demonstrate. Validate this whenever an example changes:

```bash
python3 scripts/check.py --examples --json
```

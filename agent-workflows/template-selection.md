# Template Selection

Choose templates by matching the screen packet against each template's `bestFor`, `sections`, `states`, and `interactions`.

Preferred mapping:

- Billing, usage, invoices, plans, upgrade flows: `templates/billing`.
- Overview metrics, reports, operational status: `templates/dashboard`.
- Sales stages, deals, pipeline, account lists: `templates/crm-pipeline`.
- Setup, activation, getting started, invited users: `templates/onboarding`.

If no template matches, start from the root starter and keep the same structural conventions.


# Draftpine Component Recipes

These are copyable product UI recipes, not a component framework. Keep markup
semantic, use Pico defaults first, and add only screen-local CSS when needed.

## Shared Site Shell

- `app.js`: define `SITE_NAV`, `SITE_FOOTER`, and expose
  `...createDraftpineShell({ depth })` from every page component.
- HTML: render nav/footer from `siteNav` and `siteFooter`, but include literal
  fallback links somewhere in the page or footer for checker-visible route
  reachability.
- Every page includes the theme bootstrap script before Pico CSS.

## Filterable Hub

- Header: title, description, primary CTA.
- Filter control marked with `data-draftpine-interaction="filter"`.
- Collection rendered with `x-for` from a filtered getter.
- Include default and empty states with `data-draftpine-state`.

## Pricing Table

- Billing toggle or segmented control.
- Three to four plans maximum.
- One clear recommended plan, not every card highlighted.
- Primary plan action marked with `data-draftpine-action="primary"`.
- FAQ or objection rows below the table.

## Comparison Table

- Hero with audience and decision framing.
- At-a-glance table with the user's product in a consistent highlighted column.
- Separate measured facts from claims.
- Migration/fit guidance below the table.

## Docs Page

- Sidebar or local nav.
- Code panel or command block.
- Step list with short outcomes.
- Warning/success callouts when state changes.

## Modal Form

- Trigger button with visible text.
- `<dialog data-draftpine-interaction="modal">`.
- All inputs wrapped in `<label>` or connected with `for`.
- Cancel and submit actions; submit should visibly update success state.

## State Panel

- Default, empty, error/warning, and success states are separate elements with
  `data-draftpine-state`.
- Do not hide all states permanently; at least one interaction should reveal or
  change a state when the state is declared required.


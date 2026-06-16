# Developer Product Patterns

Use these patterns for APIs, SDKs, infrastructure, internal tools, and agent-facing products.

## Code Tabs

Use when a developer needs to see the same action in multiple stacks.

Marker:

```html
<div data-draftpine-interaction="tabs">...</div>
```

Guidance:

- Keep tab state in Alpine.
- Use realistic but fake code.
- Include at least two languages or modes.

## Request / Response Block

Use to show transformation: prompt to output, URL to JSON, task to result, command to log.

Structure:

- Left: request, command, or input.
- Right: response, output, table, or status.
- Optional copy button with visible text or `aria-label`.

Implementation notes:

- Use framed product surfaces with clear headers and status rows, not decorative cards.
- Include concrete fake data that proves the workflow: IDs, timings, row counts, output filenames, connection state, or validation status.
- Keep panels dense enough for scanning, but preserve readable code and table alignment.

## IDE + Browser Mock

Use for automation, testing, scraping, browser agents, or replay tools.

Structure:

- Code/editor panel.
- Runtime/browser/session panel.
- Terminal or log strip.
- Status chips for connection and step progress.

Implementation notes:

- Put status chips in a marker-free flex row (`list-style: none; padding: 0`) and give chips stable min-heights.
- The mock should show a believable active state, not just empty chrome. Add selected URL, event log, trace step, DOM/output preview, or session metadata.

## Quickstart Steps

Use when activation matters.

Structure:

- 3-5 numbered steps.
- Each step has a concrete action and expected result.
- End with the same primary CTA as the hero.

## In-Body Proof Index Table

Use when a technical buyer should jump to proof instead of reading a mega-menu.

Structure:

- Full-width rows.
- Row label, explanation, and action hint.
- Rows should link conceptually to docs, benchmark, customers, security, pricing, or open-source proof.

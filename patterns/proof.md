# Proof Patterns

Proof patterns reduce trust risk. Use them whenever the screen asks the user to believe a claim, compare vendors, buy, invite teammates, or adopt infrastructure.

## Under-Hero Logo Wall

Use directly after the hero when social proof matters.

Structure:

- One-line positioning sentence.
- 6-12 customer, partner, or integration logos rendered as text placeholders or simple boxes.
- Optional `empty` state when real customer stories are not available yet.

Implementation notes:

- Use a dedicated `.chip-row` or equivalent flex row with `list-style: none` and `padding: 0`; native `ul` bullets between chips are a layout bug.
- Keep the strip close enough to the hero that it reads as continuation, not a disconnected band.
- Use text placeholders only when the user has not provided real logos. For product/brand pages, prefer actual visible product, place, or brand evidence higher on the page.

## Metric Strip

Use for scale, latency, reliability, pricing, usage, or outcome claims.

Structure:

- 3-5 metrics.
- Each metric has a label and a short qualifier.
- Avoid unsourced superlatives. In a wireframe, include a source/method placeholder when the metric matters.

Implementation notes:

- Give each metric a stable width or grid track so number changes do not shift neighboring items.
- Pair important metrics with a source/method note when the page asks the user to trust a performance, pricing, reliability, or scale claim.

## Customer Story Cards

Use lower on the page after the product has been explained.

Structure:

- Customer name.
- Outcome sentence.
- One metric or concrete result.
- `Read story` link.

## Compliance / Security Strip

Use for enterprise, auth, payments, browser automation, data, healthcare, legal, AI governance, or any credential-handling flow.

Structure:

- 3-4 trust badges or controls.
- Short explanation of isolation, privacy, roles, audit logs, or compliance.
- Status or trust-center link in the footer when relevant.

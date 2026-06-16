# Conversion Patterns

Use conversion patterns to make the next step clear without turning every section into a sales pitch.

## CTA Pair

Use a self-serve primary action plus a lower-friction or sales-assist secondary action.

Examples:

- `Start building` + `Read the docs`
- `Get started` + `Talk to an engineer`
- `Start free` + `View pricing`

The primary CTA must use:

```html
data-draftpine-action="primary"
```

## Final CTA Band

Use near the footer.

Structure:

- Short restatement of the screen promise.
- Primary CTA repeated.
- Risk reducer: free tier, no credit card, minutes to setup, status/SLA, or support line.

## Pricing Table

Use when price is part of product thinking.

Interactions:

- Add `data-draftpine-interaction="toggle"` for monthly/annual toggles.
- Add a success or confirmation state only if the prototype includes selecting a plan.

## Usage / Cost Calculator

Use for usage-priced products where self-pricing is the conversion engine.

Guidance:

- Keep math fake and local.
- Use labels for sliders/inputs.
- Show an estimate, assumptions, and the primary action.


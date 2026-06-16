# Interaction Patterns

Interactions must support product thinking. Do not add a modal, filter, or toggle just to satisfy the checker.

Declare only interactions that exist in `draftpine.config.json` under `requiredInteractions`.

## Tabs

Use for code languages, product modes, or plan groups.

Marker:

```html
<div data-draftpine-interaction="tabs">...</div>
```

## Filter

Use for tables, galleries, use cases, or workflows where narrowing the list changes the screen.

Marker:

```html
<div data-draftpine-interaction="filter">...</div>
```

## Modal / Dialog

Use for focused creation, confirmation, plan upgrade, invite, or details.

Marker:

```html
<dialog data-draftpine-interaction="modal">...</dialog>
```

## Accordion FAQ

Use for objections, pricing explanations, policies, or setup questions.

Marker:

```html
<section data-draftpine-interaction="accordion">...</section>
```

## Copy Button

Use for commands, API keys, snippets, URLs, or prompts.

Requirement:

- Button has visible text or `aria-label`.
- Behavior is local and can set a fake copied state.


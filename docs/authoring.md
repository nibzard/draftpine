# Authoring

Draftpine v3 authoring starts with page JSON.

```json
{
  "schemaVersion": "3.0",
  "id": "pricing",
  "path": "/pricing/",
  "title": "Pricing",
  "type": "pricing",
  "primaryAction": { "label": "Contact sales", "href": "../contact/" },
  "sections": [
    {
      "id": "hero",
      "block": "hero",
      "props": {
        "headline": "Choose the right website prototype path.",
        "primaryAction": "Contact sales",
        "primaryHref": "../contact/"
      }
    }
  ]
}
```

Each section names a block registered in `themes/<theme>/theme.json` and passes `props` to that block.

## Theme Blocks

Blocks are ordinary HTML partials:

```html
<section class="dp-section">
  <div class="dp-container">
    <h1>{{headline}}</h1>
    <a href="{{primaryHref}}" data-draftpine-action="primary">{{primaryAction}}</a>
  </div>
</section>
```

Supported template syntax:

- `{{value}}` for escaped values
- `{{nested.value}}` for dotted paths
- `{{#items}}...{{/items}}` for truthy values or arrays
- `{{^items}}...{{/items}}` for empty states
- `{{! comment }}` for comments

Raw HTML insertion and JavaScript expressions are not supported in blocks.

## Add A Block

```bash
pnpm draftpine new block timeline
```

This creates `themes/default/blocks/timeline.html` and registers it in `themes/default/theme.json`.

## Public Website Blocks

The default theme is website-first. Start with public page blocks such as `hero`, `logo-cloud`, `feature-icons`, `feature-showcase`, `pricing`, `comparison`, `faq`, `contact`, `blog-list`, `article`, `team`, and `values`.

See `docs/website-blocks.md` for the block families, page coverage matrix, and starter route model.

## Validate

```bash
pnpm draftpine generate --json
pnpm draftpine check --json
pnpm draftpine eval --strict --json
```

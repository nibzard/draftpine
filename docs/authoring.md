# Authoring

Edit these files:

- `draftpine.config.json`
- `routes.json`
- `recipes/*.json`
- `content/**/*.json`
- `primitives/*`
- `layouts/*`

Do not hand-edit files in `prototype/`; they are generated.

## Project CSS Overrides

For small project-level visual adjustments, configure a safe override file:

```json
{
  "source": {
    "overrides": "overrides.css"
  }
}
```

Override CSS is bundled after core layouts and primitives. It is checked for common overflow hazards such as `width: 100vw`, negative margins, and large fixed `width` values. Unlike reusable primitives, an override file does not need a manifest, demo, eval fixture, or README.

Use overrides for scoped project polish. Use `primitives/` or `layouts/` when the behavior should become a reusable component.

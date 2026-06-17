# Architecture

Draftpine v2 has three hard boundaries:

- Source files are JSON, primitive manifests, templates, and scoped styles.
- Generated files live in `prototype/` and are owned by the compiler.
- Reports live in `reports/` and are written for agents first.

The compiler loads config, route maps, recipes, content, layouts, and primitives into a normalized project model. The evaluator runs source checks plus Playwright browser checks against generated output.

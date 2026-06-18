# Architecture

Draftpine v3 has four hard boundaries:

- Source files live in `pages/` and `themes/`.
- Generated prototype files live in `prototype/` and are owned by the compiler.
- Reports and screenshots live in `reports/` and are owned by eval.
- The runtime is static JavaScript copied into generated output.

The compiler loads `draftpine.config.json`, discovers `pages/*.json`, loads the selected theme from `themes/<theme>/theme.json`, renders each section through its block HTML partial, wraps the route in `shell.html`, writes static output, and records a manifest.

The evaluator runs source checks, theme safety checks, generated-output checks, route/link checks, and Playwright browser checks. Findings point back to editable source files whenever possible.

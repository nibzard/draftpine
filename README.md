# Draftpine v3

Draftpine v3 is a static prototype compiler where agents write page JSON, teams edit HTML themes, and Draftpine generates and evaluates deployable wireframes.

## Quick Start

```bash
pnpm install
pnpm draftpine init /tmp/draftpine-v3-demo --force
pnpm draftpine generate /tmp/draftpine-v3-demo --json
pnpm draftpine check /tmp/draftpine-v3-demo --json
pnpm draftpine eval /tmp/draftpine-v3-demo --strict --json
```

Users edit:

- `pages/*.json`
- `themes/<theme>/theme.json`
- `themes/<theme>/shell.html`
- `themes/<theme>/styles.css`
- `themes/<theme>/blocks/*.html`

Draftpine writes generated static output to `prototype/` and eval reports to `reports/`. Do not hand-edit generated output as source.

## Commands

- `draftpine init [path] [--starter single-screen|browsable|docs] [--force]`
- `draftpine generate [workspace] [--json]`
- `draftpine check [workspace] [--json] [--scope source|generated|all]`
- `draftpine eval [workspace] [--json] [--strict] [--routes /,/pricing/]`
- `draftpine dev [--port 5173] [--report-port 5174]`
- `draftpine new block <name>`
- `draftpine docs`

## Quality Gate

`draftpine eval --strict` runs generate, static checks, local route/link checks, Playwright screenshots, console error checks, horizontal overflow checks, accessibility checks, theme toggle checks, and unresolved-template checks.

See [SPECIFICATION_v3.md](./SPECIFICATION_v3.md), [docs/authoring.md](./docs/authoring.md), [docs/architecture.md](./docs/architecture.md), and [docs/eval.md](./docs/eval.md).

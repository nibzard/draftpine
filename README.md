# Draftpine v3

Draftpine v3 is a static prototype compiler where agents write page JSON, teams edit HTML themes, and Draftpine generates and evaluates deployable wireframes.

## Quick Start

```bash
pnpm install
pnpm draftpine init /tmp/draftpine-v3-demo --starter browsable --prompt "customer support platform" --force
pnpm draftpine eval /tmp/draftpine-v3-demo --strict --json
```

That creates a six-route static prototype in `/tmp/draftpine-v3-demo`, writes generated HTML to `prototype/`, and writes screenshots plus reports to `reports/`. `eval --strict` runs generation and static checks before the browser pass.

## Agent One-Prompt Happy Path

Paste this into a coding agent from the repository root:

```text
Create a browsable public website prototype with Draftpine.

Product: <what this website is for>
Audience: <who visits it>
Visitor goal: <what they need to understand or decide>
Primary action: <the main CTA>
Routes: Home, Pricing, About, Contact, Resources, 404
Style: compact, modern, public-facing, inspired by Vercel/Cal.com/shadcn
Leave out: real auth, real backend calls, real analytics, production integrations

Implement it in Draftpine source files only, run `pnpm draftpine eval --strict --json`, fix every error, and summarize the generated routes, blocks used, and screenshots.
```

For a single landing page, change `Routes` to `Home only` and initialize with `--starter single-screen`.

Users edit:

- `pages/*.json`
- `themes/<theme>/theme.json`
- `themes/<theme>/shell.html`
- `themes/<theme>/styles.css`
- `themes/<theme>/blocks/*.html`

Draftpine writes generated static output to `prototype/` and eval reports to `reports/`. Do not hand-edit generated output as source.

## Commands

- `draftpine init [path] [--starter single-screen|browsable|docs] [--prompt "..."] [--force]`
- `draftpine generate [workspace] [--json]`
- `draftpine check [workspace] [--json] [--scope source|generated|all]`
- `draftpine eval [workspace] [--json] [--strict] [--routes /,/pricing/]`
- `draftpine dev [--port 5173] [--report-port 5174]`
- `draftpine new block <name>`
- `draftpine docs`

## Quality Gate

`draftpine eval --strict` runs generate, static checks, local route/link checks, Playwright screenshots, console error checks, horizontal overflow checks, accessibility checks, theme toggle checks, and unresolved-template checks.

See [SPECIFICATION_v3.md](./SPECIFICATION_v3.md), [docs/authoring.md](./docs/authoring.md), [docs/architecture.md](./docs/architecture.md), and [docs/eval.md](./docs/eval.md).

# Draftpine v3

Draftpine v3 is a static prototype compiler where agents write page JSON, teams edit HTML themes, and Draftpine generates and evaluates deployable wireframes.

## One-paste agent experience

Paste this single prompt into a coding agent (Claude Code, Cursor, GitHub Copilot Workspace, Cline) in **any directory** and get a finished, strict-eval-passing prototype with zero manual commands. Edit the sample brief to your real product before pasting, or run `draftpine agent --bare` for placeholder fields.

The canonical prompt lives in the binary — run `draftpine agent` to print it. The block below is pinned to that output by a test; do not hand-edit it.

What you will still approve: sandboxed agents will ask you to OK the `git clone`, the `pnpm install`, and the one-time Chromium download. Those approvals are unavoidable — "one paste" means you type zero commands, not that the agent never asks.

Draftpine is not yet published to npm, so the prompt's pinned `git clone --branch v3.0.0` is the working path today; the `npx` fast-path activates automatically once the maintainer publishes.

<!-- AGENT_PROMPT_START -->
```text
You are building a static website prototype with Draftpine v3 — a compiler that turns page JSON and editable HTML themes into static HTML/CSS/JS and evaluates it (screenshots, accessibility, horizontal-overflow, route/link, console-error, and unresolved-template checks). Work autonomously this turn: do not stop to ask me to install or clone anything — make reasonable decisions and report when finished.

PRODUCT BRIEF (edit the sample below to your real product; if a field is blank, infer a sensible default):
- Product: "Acme Analytics" — product analytics for small engineering teams
- Audience: engineering managers and founders evaluating analytics tools
- Visitor goal: understand what Acme does and decide whether to start a trial
- Primary action: "Start free trial"
- Routes: Home, Pricing, About, Contact, Resources, 404
- Style: compact, modern, public-facing; inspired by Vercel / Linear / Cal.com
- Leave out: real auth, real backend/API calls, real analytics, payment processing

<!-- The init --prompt value below only sets the project NAME ("Acme Analytics SaaS website"). You must still author all real copy in STEP 3. -->

STEP 0 — Runtime (do this silently first; adapt the shell idiom — bash/zsh/PowerShell/cmd — to your host):
- Node.js >= 20 (`node -v`). If missing, try `nvm install 20` then `corepack enable`; if neither is permitted, STOP and tell me the environment cannot run Draftpine.
- pnpm (`pnpm -v`). If missing, run `corepack enable && corepack prepare pnpm@latest --activate`.

STEP 1 — Get Draftpine into a hidden `.draftpine/` in the current working directory (NEVER inside the prototype folder):
1. FAST PATH (works only once the maintainer publishes to npm): `npx -y draftpine@3.0.0 --version`. If it prints EXACTLY `3.0.0`, set PREFIX=`npx -y draftpine@3.0.0` and SKIP TO STEP 2. If it 404s or prints anything else, treat it as "not ours" and fall through — do NOT proceed with an unexpected package.
2. PINNED CLONE (the production path today): if `.draftpine/.git` does NOT already exist:
   `git clone --depth 1 --branch v3.0.0 https://github.com/nibzard/draftpine.git .draftpine`
   INTEGRITY (the real tamper check; `--version` is only a smoke test): run `git -C .draftpine rev-parse HEAD` and report the SHA and its date. If the `v3.0.0` tag is missing, STOP and tell me — do not fall back to an unpinned branch.
   Install dependencies (reuse the cache; NO build step — tsx runs the TypeScript source directly): `pnpm --dir .draftpine install --frozen-lockfile || pnpm --dir .draftpine install`
   Smoke test: `pnpm --dir .draftpine draftpine --version` must print `3.0.0`.
   Set PREFIX=`pnpm --dir .draftpine draftpine`.

STEP 2 — Initialize the prototype in the current directory, then read the seeded rules:
  $PREFIX init "$PWD/prototype" --starter browsable --prompt "<one-line product description>" --force
This creates `prototype/` with `pages/*.json`, `themes/default/{theme.json,shell.html,styles.css,blocks/*.html}`, `draftpine.config.json`, AND a seeded `AGENTS.md` with the exact commands for THIS workspace. Read `prototype/AGENTS.md` and follow it.

STEP 3 — Author the site by editing ONLY Draftpine SOURCE files under `prototype/`. Cover EVERY route in the brief with real copy, clear H1s, working local links, and sample data:
- `prototype/pages/*.json` (one per route)
- `prototype/themes/default/{theme.json,shell.html,styles.css,blocks/*.html}` and `prototype/draftpine.config.json`
- Templates support ONLY `{{value}}`, `{{#items}}…{{/items}}`, `{{^items}}…{{/items}}`. No `<script>`, no inline event handlers, no root-absolute or remote asset URLs, no remote fetches.
- Reuse existing default blocks; add a new one ONLY if a screen genuinely needs it: `$PREFIX new block <name> "$PWD/prototype"`.
- NEVER hand-edit `prototype/prototype/` or `prototype/reports/` — they are generated.

STEP 4 — Quality gate (loop until ZERO error-severity findings):
  $PREFIX generate "$PWD/prototype" --json
  $PREFIX check "$PWD/prototype" --json
  $PREFIX eval "$PWD/prototype" --strict --json
- eval auto-installs Chromium on first run (a one-time ~150–300 MB download, up to several minutes). Do NOT wrap it in a short shell timeout — let it finish. If the sandbox forbids the download, set `DRAFTPINE_SKIP_BROWSER_INSTALL=1`, still pass the generate+check gate, and clearly flag that browser eval was skipped.
- Strict eval covers screenshots, accessibility, horizontal-overflow, route/link, console-error, and unresolved-template checks. Fix findings in SOURCE files only, then rerun from generate.

STEP 5 — When strict eval passes with zero findings, report:
(a) whether npx or git-clone was used, plus the resolved commit SHA and its date (so I can tell if the pin is stale);
(b) the exact routes generated;
(c) the blocks used per route;
(d) the screenshot and report paths under `prototype/reports/`;
(e) one line on how to change the site: edit `prototype/` source files and rerun the STEP-4 gate;
(f) a supply-chain note: "Draftpine was cloned at pinned tag/SHA <x> and ran `pnpm install`, which executes install scripts of third-party packages — review `.draftpine/pnpm-lock.yaml`."
Do not deploy unless I explicitly ask.

Note on approvals: pasting one prompt means you type zero commands, but sandboxed agents (Claude Code, Cursor, Cline) will still ask you to approve tool use for the `git clone`, the `pnpm install`, and the one-time Chromium download. Those approvals are unavoidable.
```
<!-- AGENT_PROMPT_END -->

## From this repository (contributors)

```bash
pnpm install
pnpm draftpine init /tmp/draftpine-v3-demo --starter browsable --prompt "customer support platform" --force
pnpm draftpine eval /tmp/draftpine-v3-demo --strict --json
```

That creates a six-route static prototype in `/tmp/draftpine-v3-demo`, writes generated HTML to `prototype/`, and writes screenshots plus reports to `reports/`. `eval --strict` runs generation and static checks before the browser pass. If Chromium is missing, Draftpine installs it and retries once.

## Commands

- `draftpine init [path] [--starter single-screen|browsable|docs] [--prompt "..."] [--force] [--no-agent-files] [--agent-targets cursor,copilot]`
- `draftpine generate [workspace] [--json]`
- `draftpine check [workspace] [--json] [--scope source|generated|all]`
- `draftpine eval [workspace] [--json] [--strict] [--routes /,/pricing/]`
- `draftpine setup`
- `draftpine dev [--port 5173] [--report-port 5174]`
- `draftpine new block <name> [workspace]` (run from inside the workspace, or pass the workspace path)
- `draftpine agent [--bare] [--pin] [--starter ...] [--json]`
- `draftpine docs`
- `draftpine --version`

## What gets generated

`init` scaffolds a workspace and seeds an `AGENTS.md` + `CLAUDE.md` with the exact commands for that workspace. Users edit:

- `pages/*.json`
- `themes/<theme>/theme.json`
- `themes/<theme>/shell.html`
- `themes/<theme>/styles.css`
- `themes/<theme>/blocks/*.html`

Draftpine writes generated static output to `prototype/` and eval reports to `reports/`. Do not hand-edit generated output as source.

## Quality Gate

`draftpine eval --strict` runs generate, static checks, local route/link checks, Playwright screenshots, console error checks, horizontal overflow checks, accessibility checks, theme toggle checks, and unresolved-template checks.

See [SPECIFICATION_v3.md](./SPECIFICATION_v3.md), [docs/authoring.md](./docs/authoring.md), [docs/architecture.md](./docs/architecture.md), and [docs/eval.md](./docs/eval.md).

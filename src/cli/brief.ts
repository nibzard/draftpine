import pkg from "../../package.json" with { type: "json" };

export type BriefStarter = "single-screen" | "browsable" | "docs";

export interface AgentPromptOptions {
  /** Replace the sample brief with `<...>` placeholders. */
  bare?: boolean;
  /** Omit the optional npx fast-path; git-tag clone only (most trusted). */
  pin?: boolean;
  starter?: BriefStarter;
}

export const DRAFTPINE_VERSION = pkg.version;
export const DRAFTPINE_TAG = `v${pkg.version}`;
const REPO_URL = "https://github.com/nibzard/draftpine.git";

/**
 * The canonical one-paste agent prompt. This is the single source of truth:
 * `draftpine agent` prints it, the README mirrors it between sentinels, and a
 * drift test keeps them identical. Never hand-edit the README copy.
 */
export function renderAgentPrompt(options: AgentPromptOptions = {}): string {
  const bare = options.bare ?? false;
  const pin = options.pin ?? false;
  const starter = options.starter ?? "browsable";
  return [intro(), brief(bare, starter), step0(), step1(pin), step2(starter), step3(), step4(), step5(), approvals()].join("\n\n").trim() + "\n";
}

function intro(): string {
  return [
    "You are building a static website prototype with Draftpine v3 — a compiler that turns page JSON and editable HTML themes into static HTML/CSS/JS and evaluates it (screenshots, accessibility, horizontal-overflow, route/link, console-error, and unresolved-template checks). Work autonomously this turn: do not stop to ask me to install or clone anything — make reasonable decisions and report when finished.",
  ].join("\n");
}

function brief(bare: boolean, starter: BriefStarter): string {
  const routes = starter === "single-screen" ? "Home only" : "Home, Pricing, About, Contact, Resources, 404";
  const label = bare ? "PRODUCT BRIEF (fill in your real product; if a field is blank, infer a sensible default):" : "PRODUCT BRIEF (edit the sample below to your real product; if a field is blank, infer a sensible default):";
  const product = bare ? "<one line: what this website is for>" : '"Acme Analytics" — product analytics for small engineering teams';
  const audience = bare ? "<who visits it>" : "engineering managers and founders evaluating analytics tools";
  const goal = bare ? "<what they need to understand or decide>" : "understand what Acme does and decide whether to start a trial";
  const action = bare ? "<the main call-to-action>" : '"Start free trial"';
  const initPrompt = bare ? "<one-line product description>" : "Acme Analytics SaaS website";
  return [
    label,
    `- Product: ${product}`,
    `- Audience: ${audience}`,
    `- Visitor goal: ${goal}`,
    `- Primary action: ${action}`,
    `- Routes: ${routes}`,
    "- Style: compact, modern, public-facing; inspired by Vercel / Linear / Cal.com",
    "- Leave out: real auth, real backend/API calls, real analytics, payment processing",
    "",
    `<!-- The init --prompt value below only sets the project NAME ("${initPrompt}"). You must still author all real copy in STEP 3. -->`,
  ].join("\n");
}

function step0(): string {
  return [
    "STEP 0 — Runtime (do this silently first; adapt the shell idiom — bash/zsh/PowerShell/cmd — to your host):",
    "- Node.js >= 20 (`node -v`). If missing, try `nvm install 20` then `corepack enable`; if neither is permitted, STOP and tell me the environment cannot run Draftpine.",
    "- pnpm (`pnpm -v`). If missing, run `corepack enable && corepack prepare pnpm@latest --activate`.",
  ].join("\n");
}

function step1(pin: boolean): string {
  const fast = pin
    ? []
    : [
        '1. FAST PATH (works only once the maintainer publishes to npm): `npx -y draftpine@' + DRAFTPINE_VERSION + ' --version`. If it prints EXACTLY `' + DRAFTPINE_VERSION + '`, set PREFIX=`npx -y draftpine@' + DRAFTPINE_VERSION + '` and SKIP TO STEP 2. If it 404s or prints anything else, treat it as "not ours" and fall through — do NOT proceed with an unexpected package.',
      ];
  const stepNum = pin ? "1" : "2";
  return [
    "STEP 1 — Get Draftpine into a hidden `.draftpine/` in the current working directory (NEVER inside the prototype folder):",
    ...fast,
    stepNum + ". PINNED CLONE (the production path today): if `.draftpine/.git` does NOT already exist:",
    "   `git clone --depth 1 --branch " + DRAFTPINE_TAG + " " + REPO_URL + " .draftpine`",
    "   INTEGRITY (the real tamper check; `--version` is only a smoke test): run `git -C .draftpine rev-parse HEAD` and report the SHA and its date. If the `" + DRAFTPINE_TAG + "` tag is missing, STOP and tell me — do not fall back to an unpinned branch.",
    "   Install dependencies (reuse the cache; NO build step — tsx runs the TypeScript source directly): `pnpm --dir .draftpine install --frozen-lockfile || pnpm --dir .draftpine install`",
    "   Smoke test: `pnpm --dir .draftpine draftpine --version` must print `" + DRAFTPINE_VERSION + "`.",
    "   Set PREFIX=`pnpm --dir .draftpine draftpine`.",
  ].join("\n");
}

function step2(starter: BriefStarter): string {
  return [
    "STEP 2 — Initialize the prototype in the current directory, then read the seeded rules:",
    '  $PREFIX init "$PWD/prototype" --starter ' + starter + ' --prompt "<one-line product description>" --force',
    "This creates `prototype/` with `pages/*.json`, `themes/default/{theme.json,shell.html,styles.css,blocks/*.html}`, `draftpine.config.json`, AND a seeded `AGENTS.md` with the exact commands for THIS workspace. Read `prototype/AGENTS.md` and follow it.",
  ].join("\n");
}

function step3(): string {
  return [
    "STEP 3 — Author the site by editing ONLY Draftpine SOURCE files under `prototype/`. Cover EVERY route in the brief with real copy, clear H1s, working local links, and sample data:",
    "- `prototype/pages/*.json` (one per route)",
    "- `prototype/themes/default/{theme.json,shell.html,styles.css,blocks/*.html}` and `prototype/draftpine.config.json`",
    "- Templates support ONLY `{{value}}`, `{{#items}}…{{/items}}`, `{{^items}}…{{/items}}`. No `<script>`, no inline event handlers, no root-absolute or remote asset URLs, no remote fetches.",
    '- Reuse existing default blocks; add a new one ONLY if a screen genuinely needs it: `$PREFIX new block <name> "$PWD/prototype"`.',
    "- NEVER hand-edit `prototype/prototype/` or `prototype/reports/` — they are generated.",
  ].join("\n");
}

function step4(): string {
  return [
    "STEP 4 — Quality gate (loop until ZERO error-severity findings):",
    '  $PREFIX generate "$PWD/prototype" --json',
    '  $PREFIX check "$PWD/prototype" --json',
    '  $PREFIX eval "$PWD/prototype" --strict --json',
    "- eval auto-installs Chromium on first run (a one-time ~150–300 MB download, up to several minutes). Do NOT wrap it in a short shell timeout — let it finish. If the sandbox forbids the download, set `DRAFTPINE_SKIP_BROWSER_INSTALL=1`, still pass the generate+check gate, and clearly flag that browser eval was skipped.",
    "- Strict eval covers screenshots, accessibility, horizontal-overflow, route/link, console-error, and unresolved-template checks. Fix findings in SOURCE files only, then rerun from generate.",
  ].join("\n");
}

function step5(): string {
  return [
    "STEP 5 — When strict eval passes with zero findings, report:",
    "(a) whether npx or git-clone was used, plus the resolved commit SHA and its date (so I can tell if the pin is stale);",
    "(b) the exact routes generated;",
    "(c) the blocks used per route;",
    "(d) the screenshot and report paths under `prototype/reports/`;",
    "(e) one line on how to change the site: edit `prototype/` source files and rerun the STEP-4 gate;",
    "(f) a supply-chain note: \"Draftpine was cloned at pinned tag/SHA <x> and ran `pnpm install`, which executes install scripts of third-party packages — review `.draftpine/pnpm-lock.yaml`.\"",
    "Do not deploy unless I explicitly ask.",
  ].join("\n");
}

function approvals(): string {
  return "Note on approvals: pasting one prompt means you type zero commands, but sandboxed agents (Claude Code, Cursor, Cline) will still ask you to approve tool use for the `git clone`, the `pnpm install`, and the one-time Chromium download. Those approvals are unavoidable.";
}

# Draftpine Findings

Analysis date: 2026-06-17

## Executive Read

Draftpine's intended product is strong: a no-build, agent-first static wireframe kit that turns a product prompt into a constrained Pico + Alpine prototype, with `AGENTS.md`, pattern recipes, `draftpine.config.json`, `scripts/check.py`, and `scripts/visual_qa.py` acting as guardrails.

The current implementation does enforce basic stack/runtime/route contracts better than the first prototype did. The original "green check but broken Alpine page" failure appears to have been addressed: local `app.js` now loads before Alpine, the checker verifies that order, and `python3 scripts/check.py --runtime --json` passes for the Draftpine starter.

The unresolved problem is product quality. The checker can say "pass" while the output is still visually inconsistent, over-scoped, horizontally overflowing on mobile, and template-like. `visual_qa.py` captures screenshots, but its JSON status means "screenshots were captured", not "the screenshots are good." This makes the product-quality gate advisory even though the README presents it as a gate.

## Evidence Collected

- Current Draftpine root check: `python3 scripts/check.py --runtime --json` returns `status: pass`, `errors: 0`, `warnings: 0`, `passes: 26`.
- Current Draftpine examples check: `python3 scripts/check.py --examples --json` returns `status: pass`.
- Current Draftpine visual QA captures desktop/mobile starter screenshots and returns `status: pass`.
- Generated Steel wireframe at `/Users/nikola/dev/steel/growth-tools/competitors-content/work/wireframe` has `117` configured routes and still returns checker `status: pass` with only one CSS-size warning.
- Generated Steel wireframe visual QA captures home/platform/pricing screenshots and returns `status: pass`, despite obvious mobile horizontal overflow.
- Relevant prior sessions in `~/.codex/history.jsonl` show the first-use failure mode: a Draftpine-created Steel page passed static checks while Alpine expressions were undefined. Later sessions focused on fixing head order, runtime smoke checks, JSON/fetch contradiction, global skill installation, route generation, and visual QA.

Screenshot artifacts inspected:

- `/Users/nikola/dev/Draftpine/work/visual-qa/home-desktop.png`
- `/Users/nikola/dev/Draftpine/work/visual-qa/home-mobile.png`
- `/Users/nikola/dev/steel/growth-tools/competitors-content/work/wireframe/work/visual-qa-audit/home-desktop.png`
- `/Users/nikola/dev/steel/growth-tools/competitors-content/work/wireframe/work/visual-qa-audit/home-mobile.png`
- `/Users/nikola/dev/steel/growth-tools/competitors-content/work/wireframe/work/visual-qa-audit/platform-desktop.png`
- `/Users/nikola/dev/steel/growth-tools/competitors-content/work/wireframe/work/visual-qa-audit/pricing-mobile.png`

## Intended Workflow

The README promises a tight agent loop:

1. Agent reads `AGENTS.md`.
2. Agent chooses patterns, design profile, and prototype mode.
3. Agent edits static HTML/CSS/JS and config.
4. Agent runs `python3 scripts/check.py --runtime --json` until pass.
5. Agent runs `python3 scripts/visual_qa.py --json`.
6. Agent declares done only after quality pass.

Source evidence:

- `README.md:16` says Draftpine gives agents strict rules, reusable patterns, examples, and a checker so the result is a throwaway wireframe or browsable prototype "in one pass".
- `README.md:64-75` documents the intended pipeline from prompt to patterns, checker, visual QA, and deploy.
- `README.md:121-124` says the checker is the mechanical gate and `visual_qa.py` is the product-quality gate.
- `AGENTS.md:40-59` defines the happy path, including design profile selection, checker pass, visual QA, and a final quality pass.
- `AGENTS.md:201-216` defines the acceptance bar: composed first viewport, concrete product proof, real interactions, responsive layout, and checker pass.

## Actual Behavior

The mechanical gate is real but narrow. It checks required files, banned stack files/literals, Pico/Alpine links, semantic landmarks, primary action marker, required state/interaction markers, basic labels, CSS line count, route existence/linking, theme bootstrap, and a Node-based Alpine expression smoke test.

Source evidence:

- `scripts/check.py:18-46` defines required files, forbidden build files/patterns, design profile names, and CSS line limit.
- `scripts/check.py:67-138` defines the Node runtime smoke harness.
- `scripts/check.py:620-639` only partially validates quality by checking raw Markdown dumps and whether a filter has an `x-for`.
- `scripts/check.py:735-820` validates route config shape, route file existence, link reachability, and page runtime contract.
- `scripts/check.py:1108-1181` validates root state/interaction markers, labels, CSS size, page contract, routes, content files, and runtime smoke.

The visual gate is not a real gate. It captures screenshots and emits a manual checklist, then returns `pass` when Chrome exists and screenshots were written.

Source evidence:

- `scripts/visual_qa.py:43-68` samples only a small route subset.
- `scripts/visual_qa.py:111-121` emits checklist text for a human to inspect.
- `scripts/visual_qa.py:157-163` sets `status: pass` when captures are successful; it does not evaluate screenshot content.

## Findings

### 1. Visual QA returns "pass" for broken-looking layouts

Impact: High. This directly explains why the user sees layout inconsistency while the tooling claims success.

Evidence:

- Draftpine starter mobile screenshot clips the nav, headline, notice, and primary CTA horizontally.
- Steel wireframe mobile screenshots clip nav actions, hero text, chip rows, code panels, and pricing controls.
- `scripts/visual_qa.py:157-163` marks the run as pass if screenshots exist.

Why this happens:

`visual_qa.py` is a screenshot capture helper, not a verifier. The README calls it a product-quality gate, but it cannot fail for horizontal overflow, occluded text, repeated components, weak hierarchy, route sameness, or inconsistent design profile use.

Repair direction:

- Change `visual_qa.py` status semantics: `captured` or `manual_required`, not `pass`.
- Add automated browser checks before visual inspection:
  - `document.documentElement.scrollWidth <= window.innerWidth`
  - no element bounding box extends materially outside viewport
  - no fixed/min-width components wider than viewport on mobile
  - visible primary action in first viewport
  - no console errors on sampled routes
- Add a `--strict` mode that exits nonzero on mobile horizontal overflow.

### 2. The starter screen teaches the wrong visual lesson

Impact: High. Agents copy the shipped root screen's structure and tone.

Evidence:

- Draftpine starter desktop first viewport is dominated by duplicated onboarding-question cards.
- Primary CTA is detached on the far right on desktop and clipped on mobile.
- The screen reads as an internal instruction dashboard rather than an exemplar product wireframe.
- `index.html` root screen is a "Prototype brief workspace", while README positions Draftpine as a kit for "wireframes your coding agent can actually build".

Why this matters:

The docs say examples are references, but agents heavily imitate the current root files. If the root screen is a contract/status dashboard, generated screens inherit cards, pills, dark/light toggle placement, and instruction-copy habits instead of learning a strong single product screen.

Repair direction:

- Replace the root starter with a small, polished, real product wireframe exemplar.
- Keep onboarding instructions in `AGENTS.md`, not as the primary visible page.
- Preserve the checker markers, but make the visible UI prove the quality bar: clear first viewport, one primary action, one realistic artifact, one real interaction, one empty/success state.

### 3. Draftpine allows massive route explosion without forcing depth or prioritization

Impact: High. The generated Steel prototype has breadth instead of coherent design.

Evidence:

- The Steel wireframe declares `117` routes in `draftpine.config.json`.
- The checker passes with all route files and route links present.
- `AGENTS.md:89` sends 10+ route prototypes to `agent-workflows/large-browsable-site.md`.
- `agent-workflows/large-browsable-site.md:8-15` tells agents to build the route graph, generate every route as a minimal shell, pass the checker, then enrich by route group.

Why this happens:

The large-site workflow optimizes for route coverage before visual quality. Once the checker sees route files and literal links, it cannot tell whether the prototype is useful, differentiated, or scoped appropriately. This encourages agents to generate dozens of same-shaped pages.

Repair direction:

- Add an explicit route budget for first passes, for example:
  - default browsable prototype: 3-7 routes
  - large IA sketch: route map only plus 3 representative designed pages
  - full route shell generation only after user approval
- Change large-site workflow from "generate every route" to "design route types": home, hub, detail, utility/legal.
- Require a route-type matrix in config so the checker/QA can sample representative types intentionally.

### 4. Design profiles are descriptive, not enforceable

Impact: Medium-high. The project says agents choose one design profile, but nothing binds layout decisions to it.

Evidence:

- `AGENTS.md:42-44` requires choosing a small pattern recipe and one design profile.
- `patterns/design-profiles.md` defines profile guidance, but it is prose only.
- `scripts/check.py:41` only validates that a `designProfile` value is one of five strings.
- The Steel wireframe uses the same dark, bordered, pill-heavy grammar across marketing, pricing, platform, route hubs, and legal-type pages.

Repair direction:

- Make design profiles operational:
  - each profile should define required/forbidden layout primitives
  - e.g. `marketing`: first viewport must include hero + proof artifact + next-section hint
  - `saas`: table/filter/metric density expected; large heroes discouraged
  - `docs`: TOC/code panel/copy button expected
- Add profile-specific QA checklist output and, where possible, static checks.
- Include profile-specific reference screenshots or golden exemplars.

### 5. The CSS guardrail detects size but not system drift

Impact: Medium-high. CSS size warning is too late and too weak.

Evidence:

- Generated Steel wireframe has `1376` screen-specific CSS lines and checker still returns `status: pass`.
- `scripts/check.py:45-46` sets `SCREEN_HELPERS_MARKER` and `SCREEN_CSS_LINE_LIMIT = 220`.
- `scripts/check.py:1164-1174` reports CSS size as a warning unless strict mode is used.
- Generated Steel CSS misses the exact `/* ---- Screen helpers ---- */` marker, so the whole file is counted and reported only as warning.

Why this matters:

The project promise says custom CSS stays small and focused. In practice, a generated prototype can become a custom mini design system and still be accepted.

Repair direction:

- Make CSS budget an error for generated wireframes, or require the agent to explain why the budget is exceeded.
- Split base theme, shell primitives, and screen CSS into counted buckets.
- Add checks for inline styles in HTML. The generated Steel homepage uses several inline style attributes in core sections, which makes consistency harder.
- Add named layout primitives (`.dp-shell`, `.dp-hero`, `.dp-card-grid`, `.dp-code-panel`) so agents reuse a small system instead of inventing page-local CSS.

### 6. Runtime smoke checks only the root page deeply

Impact: Medium. Multi-route prototypes can hide route-specific Alpine issues.

Evidence:

- `scripts/check.py:1176-1181` runs `run_runtime_smoke(parser, ...)` only for the root parser when `--runtime` is passed.
- `validate_routes()` calls `validate_page_runtime_contract()` for route pages, but that only checks theme bootstrap and factory definition, not expression evaluation.
- Prior session history shows the original serious failure was a runtime/Alpine mismatch that static checks missed.

Repair direction:

- Run the runtime smoke harness against each sampled route page, not only root.
- For large route sets, sample by route type and include all routes edited in the current run.
- Fail on console errors from captured Chrome pages in `visual_qa.py`.

### 7. Interactions are marker-complete, not behavior-complete

Impact: Medium. Agents can satisfy required interactions without meaningful product behavior.

Evidence:

- `scripts/check.py:1122-1134` checks only that required interaction markers exist.
- `scripts/check.py:622-635` adds one behavior-ish check: if a filter exists, `x-for` must exist.
- `AGENTS.md:213` says filter, tabs, modal, and theme interactions must change visible UI state.

Repair direction:

- Add interaction-specific checks:
  - tablist has associated tab panels and at least two panels
  - modal trigger opens a dialog and submit/cancel changes state
  - filter input affects collection and has an empty state path
  - theme toggle changes `documentElement.dataset.theme`
- Prefer Playwright/Chrome smoke for this over static parsing when possible.

### 8. Session history shows the team has been fixing guardrail holes reactively

Impact: Medium. The project improved, but the pattern is patching symptoms after failed generations.

Relevant prior-session lessons:

- First Steel wireframe failure: static checker passed while Alpine expressions were undefined. This led to fixes around `app.js` before Alpine and runtime smoke checking.
- JSON mode had a documented/factual contradiction at one point: docs suggested `fetch()`, checker banned fetch. Current docs/checker now allow literal local JSON fetches.
- Global skill installation had to be added because running Draftpine from the parent folder meant local `wireframe/.agents` skills were not discovered.
- Footer/list bullet artifacts and light/dark theme default were added after visual issues appeared.
- Current remaining failure mode is the same class: the system says "pass", but human visual inspection says "not good enough."

Repair direction:

Move from individual patches to acceptance tests based on representative generated outputs. Keep a `fixtures/generated/` or `examples/generated-failures/` set with known bad cases and make the checker/visual QA fail them.

## Most Important Product Gap

Draftpine has a stronger contract for what files should exist than for what the prototype should feel like.

The current checker can prove:

- no React/Tailwind/build step
- Pico/Alpine linked
- required markers exist
- config shape is sane
- root Alpine expressions mostly evaluate
- routes exist and are linked

It cannot prove:

- mobile layout fits
- first viewport is composed
- visual profile is consistent
- route pages are meaningfully distinct
- copy is real enough for product thinking
- controls are ergonomic
- generated scope is appropriate

That mismatch is why the project can be technically green and still feel like a mess.

## Recommended Repair Order

1. Fix `visual_qa.py` semantics and add mobile overflow detection.
   - Highest leverage because it makes "pass" mean less of a lie.

2. Replace the root starter with a high-quality exemplar screen.
   - Agents need a better visual anchor than the current instruction dashboard.

3. Rework large browsable workflow around route types and budgets.
   - Stop generating 100+ route shells as a default success path.

4. Make design profiles operational.
   - Turn each profile into a checklist and small set of reusable layout primitives.

5. Expand runtime/interaction smoke to sampled routes.
   - Preserve the gains from the first runtime fixes and prevent route-specific regressions.

6. Add generated-output regression fixtures.
   - Use the current Steel wireframe as a negative fixture for mobile overflow and route explosion.

## Concrete Acceptance Criteria For A Better Draftpine

A future Draftpine run should not be considered done unless:

- `scripts/check.py --runtime --json` passes.
- `scripts/visual_qa.py --strict --json` passes and fails on mobile horizontal overflow.
- The first generated pass has a route budget or explicitly asks before generating a large site.
- At least one desktop and one mobile screenshot are inspected or machine-scored.
- The output names its design profile and shows profile-specific structure.
- The generated CSS stays within a budget or gives a reasoned exception.
- Representative route pages are visually distinct by route type, not only by text.

## Conclusion: The Future-Proof Direction

The most elegant fix is not to keep adding hand-written design rules forever. Draftpine should become an eval harness for agent-generated wireframes.

The second major conclusion is that agents should not be trusted to invent layout and grid systems on every page. Draftpine should own deterministic layout primitives, while agents choose recipes, provide content, and make constrained variant decisions.

The durable model is:

```text
screen packet
→ generated prototype
→ rendered screenshots + DOM/runtime facts
→ evaluator report
→ repair loop
→ accepted artifact
```

This matches how coding agents actually improve: not through ever-longer instruction files, but through tight feedback loops, observable outputs, regression cases, and repair actions.

### The Three-Layer System

1. Hard deterministic gates

These catch objective failures:

- no React/Tailwind/build step
- Pico and Alpine present
- no console/runtime errors
- no mobile horizontal overflow
- route links work
- primary CTA exists
- required states/interactions exist
- CSS budget is not wildly exceeded

2. Visual/UX evaluator

This should be model-assisted, not only static code. Feed desktop/mobile screenshots plus the screen packet into an evaluator that answers:

- Does the first viewport satisfy the user's goal?
- Is there clear visual hierarchy?
- Is the mobile layout usable?
- Are controls clipped, crowded, or overlapping?
- Does the output match the chosen design profile?
- Is this a real product UI, or a generic card dump?
- What are the top repairs?

3. Regression corpus

Keep examples of:

- good outputs
- bad outputs
- historical failures
- user-rejected wireframes
- mobile-overflow cases
- route-explosion cases
- stale runtime/Alpine failure cases

Then Draftpine improves by running agents against this corpus and measuring whether the checker/evaluator catches known failures.

### The Product Shift

Build `draftpine eval`, not only `draftpine check`.

Example shape:

```bash
python3 scripts/eval.py --task fixtures/tasks/steel-homepage.json --json
```

It should:

- run the mechanical checker
- start a local server
- capture desktop/mobile screenshots
- collect DOM metrics
- collect console errors
- run deterministic layout checks
- optionally run a multimodal model evaluator
- emit structured repair actions

The output should distinguish hard failures from design findings:

```json
{
  "status": "fail",
  "hard_failures": ["mobile.horizontal-overflow"],
  "model_findings": [
    "The primary CTA is clipped on mobile.",
    "The route set is over-scoped for a first-pass wireframe.",
    "The pricing page uses the same visual pattern as the homepage and needs a distinct decision layout."
  ],
  "next_actions": []
}
```

This is more future-proof than encoding hundreds of design heuristics into `check.py`. Static checks should handle objective invariants. The evaluator should judge whether the rendered artifact solves the screen packet.

### Practical First Version

1. Rename or reframe current `visual_qa.py` so `pass` means only "screenshots captured", not "quality accepted".
2. Add deterministic DOM/layout checks, especially mobile horizontal overflow.
3. Add `fixtures/tasks/` and `fixtures/bad-outputs/`.
4. Add optional `--ai-review` that reviews screenshots against the screen packet.
5. Make every generated wireframe produce an eval report before it can be called done.

In short: Draftpine should become a benchmarked wireframe generation environment, not just a static kit with a checker. The repo already has the right ingredients: screen packets, examples, patterns, runtime checks, screenshots, and prior failed outputs. The next step is to connect those into an eval-and-repair loop.

## Conclusion: Deterministic Layout And Primitive Recipes

Draftpine should add a small static primitive system, but not a framework-style component system with deep inheritance. The goal is to narrow the action space for agents so they compose safe, tested layouts instead of generating arbitrary CSS.

Recommended ownership split:

- Draftpine owns layout math, responsive behavior, spacing, tap targets, overflow rules, and reusable primitive markup.
- Agents own information architecture, copy, fake data, route type selection, primitive selection, and section ordering.
- The evaluator verifies the rendered output.

### Prefer Recipes And Primitives Over Inheritance

Use route recipes and layout primitives:

```text
patterns/
  route-types/
    home.json
    pricing.json
    comparison.json
    docs.json
    hub.json
    detail.json

primitives/
  shell.html
  hero-proof.html
  pricing-table.html
  comparison-table.html
  card-grid.html
  code-panel.html
  state-panel.html
  filterable-list.html
  modal-form.html

content/
  pages/pricing.json
```

Agents should mostly edit:

1. content JSON
2. recipe JSON
3. small enum-style variants

Agents should rarely edit primitive HTML/CSS directly. If a primitive cannot express the desired layout, the agent should propose a new primitive or variant rather than writing arbitrary page-local CSS.

Good customization shape:

```json
{
  "component": "heroProof",
  "variant": "developer",
  "spacing": "compact",
  "tone": "neutral",
  "accent": "teal",
  "title": "The open infrastructure for AI agents.",
  "primaryAction": {
    "label": "Start for free",
    "href": "https://app.steel.dev/signup"
  },
  "proof": {
    "type": "code",
    "language": "js",
    "filename": "session.js",
    "code": "const session = await client.sessions.create();"
  }
}
```

Avoid customization shape:

```json
{
  "customCss": "...",
  "extends": "baseHero",
  "overrideRenderMethod": "..."
}
```

Inheritance sounds elegant but is a bad fit for coding agents. They can create hidden coupling, override the wrong layer, and make drift harder to evaluate. Composition with named variants is safer.

### Lock Layout As A Draftpine Layer

Agents should not write fresh grid and flex math for every page. Draftpine should provide tested layout primitives such as:

```text
.dp-container
.dp-section
.dp-stack
.dp-cluster
.dp-split
.dp-grid-2
.dp-grid-3
.dp-grid-auto
.dp-sidebar
.dp-scroll-x
.dp-hero-proof
.dp-toolbar
.dp-card
.dp-card-grid
```

Example generated content/recipe:

```json
{
  "section": "proofGrid",
  "layout": "grid-auto",
  "density": "compact",
  "items": [
    { "title": "Fast sessions", "body": "Start browser sessions quickly." },
    { "title": "Proxy support", "body": "Route traffic through managed proxies." },
    { "title": "Replay traces", "body": "Debug every run after completion." }
  ]
}
```

Renderer output should use known safe primitives:

```html
<section class="dp-section">
  <div class="dp-container">
    <div class="dp-grid-auto">
      ...
    </div>
  </div>
</section>
```

Primitive CSS should contain the responsive behavior:

```css
.dp-grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--dp-gap);
}
```

This is better than telling agents to "make it responsive." The agent still chooses and composes, but it operates with safe moves.

### Layout Rules To Enforce

Add deterministic layout constraints:

- no raw `grid-template-columns` in generated page CSS unless explicitly allowed
- no `width: 100vw`
- no fixed desktop widths without `max-width`
- no horizontal overflow except inside `data-draftpine-overflow="allowed"`
- no inline layout styles
- CSS grid/flex primitives come from Draftpine tokens and primitives
- code/table overflow must be wrapped in an approved scroll container

Allowed agent controls should be enum-like:

```json
{
  "layout": "split",
  "ratio": "60-40",
  "align": "center",
  "collapse": "mobile-stack",
  "gap": "lg"
}
```

Disallowed freeform output:

```css
grid-template-columns: 1.17fr 0.83fr;
margin-left: -48px;
width: 1120px;
```

This does not fight the bitter lesson. It gives models a better action space. Draftpine should make the safe layout moves easy and the dangerous layout moves visible, rare, and reviewable.

## Notes On Tooling

The requested browser skill could not be used directly because the required Node REPL browser-control tool was unavailable in this Codex session after tool discovery. I used Draftpine's own `visual_qa.py` and local Chrome headless screenshots as the browser fallback.

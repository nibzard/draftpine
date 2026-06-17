# Draftpine v2 Specification

Status: Draft v0.1
Date: 2026-06-17
Audience: Draftpine product and engineering team
Implementation language: TypeScript

## 1. Executive Summary

Draftpine v2 is an agent-extensible wireframe compiler and evaluator.

The v1 prototype proved that agents benefit from a constrained static workspace, but it also exposed the core problem: coding agents can satisfy structural checks while producing messy layouts, mobile overflow, over-scoped route sets, repetitive pages, and weak visual hierarchy.

Draftpine v2 must change the product model from "a static repo agents directly edit" to "a compiler/evaluator loop where agents author structured intent and Draftpine renders, validates, evaluates, and reports."

The v2 loop:

```text
agent writes intent, content, recipes, and optional extensions
Draftpine validates source contracts
Draftpine compiles to static HTML/CSS/JS
Draftpine evaluates rendered output with deterministic checks
Draftpine optionally runs AI screenshot review
Draftpine emits repair actions
agent repairs source files
repeat quickly
```

The generated prototype remains simple static output:

- HTML
- CSS
- small vanilla JavaScript
- Pico CSS CDN
- Alpine.js CDN when local interaction state is needed
- no React, Vue, Svelte, Tailwind, bundler, router, backend, or runtime server requirement

The Draftpine toolchain itself should be written in TypeScript and run on Node.js. Python should be removed from the v2 implementation path.

## 2. Product North Star

Draftpine should feel like a fast design instrument for coding agents.

The user gives product intent. The agent chooses safe moves. Draftpine renders the prototype, evaluates it, and gives exact feedback. Iteration should be fast, clean, and concrete.

North-star promise:

> Describe the screen or prototype. Draftpine gives the agent safe layout moves, renders static pages, evaluates the result, and tells the agent exactly what to repair.

Draftpine v2 is not:

- a design system for production apps
- a React component library
- a no-code builder
- a Figma replacement
- a web framework
- a CMS
- a static site generator for final production websites

Draftpine v2 is:

- a structured generation environment for coding agents
- a static prototype compiler
- a layout-safe primitive system
- a feedback and eval harness
- a regression corpus for generated UI quality
- a fast iteration loop for product wireframes

## 3. Core Principles

### 3.1 Compiler-owned output

Agents should not primarily hand-edit generated `index.html`, route HTML, global CSS, or runtime JS.

Agents should primarily edit source files:

- screen packets
- route definitions
- content JSON
- route recipes
- primitive manifests
- primitive templates
- primitive demo fixtures

Draftpine owns generation of the static output.

Direct output editing may exist as an escape hatch, but it should be discouraged and detectable.

### 3.2 Deterministic layout first

Agents are weak at responsive layout math. Draftpine must own layout primitives, grid behavior, mobile collapse behavior, tap target constraints, spacing, overflow rules, and design tokens.

Agents should choose layout primitives and variants, not invent `grid-template-columns`, negative margins, fixed widths, and arbitrary inline layout styles.

### 3.3 Extensible, but contract-driven

Agents must be able to add new primitives, layouts, variants, and route recipes. Extension is a core feature.

Every extension must include:

- manifest
- schema or slot contract
- template
- scoped styles
- demo content
- screenshot/eval fixture
- documentation

An extension is accepted only when it compiles and evaluates successfully.

### 3.4 Composition over inheritance

No deep component inheritance.

Avoid:

```text
BaseHero -> MarketingHero -> DeveloperHero -> SteelHero
```

Prefer:

```json
{
  "primitive": "heroProof",
  "variant": "developer",
  "layout": "split",
  "proofType": "code"
}
```

Agents may add new primitives and variants, but should not create hidden class hierarchies or override chains.

### 3.5 Static checks plus rendered evals

Static checks catch objective contract failures.

Rendered evals catch browser, mobile, and visual output failures.

AI review is optional and additive. Deterministic browser checks must cover the most important hard failures, especially mobile horizontal overflow and console errors.

### 3.6 Fast feedback

Draftpine must optimize for iteration speed.

Targets:

- compile a small single-screen prototype in under 300 ms after warm start
- compile a 10 route prototype in under 1 s after warm start
- deterministic eval of 3 sampled routes in under 8 s on a normal laptop
- watch mode updates the report automatically after source edits

### 3.7 Domain-driven and boring

The codebase should reflect the product domain:

- Project
- Workspace
- ScreenPacket
- Route
- RouteType
- Recipe
- Section
- Primitive
- Layout
- Variant
- Content
- CompileArtifact
- EvalRun
- Finding
- RepairAction

Avoid clever abstractions. Keep APIs explicit. Prefer plain data and small functions.

### 3.8 DRY, but not magical

Shared behavior should live in:

- design tokens
- layout primitives
- primitive templates
- route type contracts
- evaluator checks

Do not hide behavior behind complex inheritance or plugin magic. If a file affects output, it must be discoverable from manifests and reports.

## 4. TypeScript Decision

Draftpine v2 should be implemented in TypeScript.

Reasons:

- Agents are strong at TypeScript/JSON/HTML/CSS workflows.
- TypeScript gives shared schema/types between compiler, CLI, evaluator, and docs generator.
- Playwright integration is first-class in Node/TypeScript.
- A future npm package or `npx draftpine` workflow is natural.
- Generated prototypes can remain plain static files even if the compiler uses TypeScript.

Runtime requirements:

- Node.js 20 LTS or newer
- TypeScript 5.x
- pnpm preferred for repository development
- package manager lockfile committed for Draftpine itself

Generated prototype requirements:

- Must not require Node.js to view after generation.
- Must open from a static server.
- Must deploy to GitHub Pages, Cloudflare Pages, Netlify static, or any static host.
- Must not depend on the Draftpine compiler at runtime.

## 5. High-Level Architecture

Draftpine v2 has these bounded contexts:

1. Source Authoring
2. Registry
3. Compiler
4. Static Runtime
5. Evaluation
6. Reporting
7. Dev Loop
8. Extension Authoring
9. Documentation Generation

### 5.1 Source Authoring

Source files are structured JSON plus primitive/layout templates.

Agents edit source files, not generated output.

Source authoring concerns:

- project config
- route map
- route recipes
- content data
- local primitive definitions
- local layout definitions
- eval settings
- route budgets
- exceptions

### 5.2 Registry

The registry resolves primitives, layouts, route types, tokens, and profiles.

Lookup order:

1. project-local registry
2. installed workspace registry
3. Draftpine core registry

Names must be explicit and collision-safe.

Recommended naming:

```text
core.heroProof
core.pricingTable
project.steelSessionHero
project.benchmarkMatrix
```

Unqualified names may resolve to core only when unambiguous. Reports should always print fully-qualified names.

### 5.3 Compiler

The compiler turns source files into static output.

Pipeline:

```text
load project
parse source
validate schemas
normalize domain model
resolve registry references
expand route recipes
bind content to primitive slots
render HTML
collect required CSS and JS
write static output
emit compile manifest
```

The compiler must be deterministic. Same source input should produce byte-stable output except timestamps when explicitly enabled.

### 5.4 Static Runtime

Generated output uses:

- static HTML
- static CSS
- minimal JavaScript
- Alpine.js for local state when needed
- Pico CSS for base UI defaults

The static runtime should be small and predictable.

Common runtime helpers:

- theme toggle
- route href helper
- tabs
- filters
- modal open/close
- copy button
- simple local state transitions

Runtime helper output must be generated from known primitives and interactions. Agents should not write arbitrary global JavaScript for common interactions.

### 5.5 Evaluation

Evaluation runs after compile.

Evaluation includes:

- source checks
- generated file checks
- browser runtime checks
- mobile layout checks
- route differentiation checks
- primitive fixture checks
- optional AI screenshot review

Evaluation returns structured findings and repair actions.

### 5.6 Reporting

Reports are agent-facing and human-readable.

Required report outputs:

- JSON report for agents
- concise terminal summary
- HTML dashboard in dev mode
- screenshot references
- route-level findings
- primitive-level findings
- repair actions with file paths

### 5.7 Dev Loop

`draftpine dev` should watch source files, compile on change, run fast checks, update screenshots when needed, and keep a local preview/report UI open.

The dev loop must not require the user to manually run several commands.

### 5.8 Extension Authoring

Agents can create new primitives, layouts, and route recipes through scaffolding commands.

Every extension must have its own contract and fixture. Draftpine must validate extension quality before it can be used without warnings.

### 5.9 Documentation Generation

Draftpine should generate docs from manifests:

- primitive catalog
- layout catalog
- route type catalog
- slot reference
- variant reference
- examples
- anti-patterns

Docs should be generated, not manually duplicated.

## 6. Repository Layout

Recommended v2 repository layout:

```text
Draftpine/
  package.json
  pnpm-lock.yaml
  tsconfig.json
  vitest.config.ts
  playwright.config.ts

  src/
    cli/
    domain/
    schemas/
    io/
    registry/
    compiler/
    renderer/
    runtime/
    eval/
    report/
    dev/
    docs/
    utils/

  core/
    route-types/
    profiles/
    layouts/
    primitives/
    tokens/
    runtime/

  starters/
    single-screen/
    browsable/
    docs/

  fixtures/
    tasks/
    good/
    bad/
    primitive-demos/
    route-demos/

  examples/
    generated/
    source/

  docs/
    architecture.md
    authoring.md
    primitives.md
    layouts.md
    eval.md
    extension-authoring.md
    migration-v1-to-v2.md

  tests/
    unit/
    integration/
    fixtures/

  SPECIFICATION.md
  README.md
  AGENTS.md
```

Recommended user project layout:

```text
wireframe/
  draftpine.config.json
  routes.json

  content/
    site.json
    pages/
      home.json
      pricing.json
      compare-browserbase.json

  recipes/
    home.json
    pricing.json
    compare-browserbase.json

  primitives/
    steel-session-hero/
      primitive.json
      template.html
      styles.css
      demo.json
      eval.json
      README.md

  layouts/
    benchmark-grid/
      layout.json
      template.html
      styles.css
      demo.json
      eval.json
      README.md

  exceptions.json

  prototype/
    index.html
    pricing/
      index.html
    assets/
      draftpine.css
      draftpine.js

  reports/
    latest.json
    latest.html
    screenshots/
```

Default source directory: project root.

Default output directory: `prototype/`.

Rationale:

- Keeps source and generated output separate.
- Makes it clear what agents should edit.
- Keeps static output deployable.
- Avoids root clutter.
- Allows existing v1 style output with `--out .` if needed, but that should not be the default.

## 7. CLI Specification

Command binary: `draftpine`

Development invocation:

```bash
pnpm draftpine <command>
```

User invocation after package install:

```bash
npx draftpine <command>
```

### 7.1 `draftpine init`

Initializes a Draftpine project.

Usage:

```bash
draftpine init [path] [--starter single-screen|browsable|docs] [--force]
```

Behavior:

- creates `draftpine.config.json`
- creates `routes.json`
- creates `content/`
- creates `recipes/`
- creates `prototype/`
- copies starter source files
- does not create React/Vite/Next/etc.
- runs initial compile and check

Must ask before overwriting existing source unless `--force` is set.

### 7.2 `draftpine generate`

Compiles source into static output.

Usage:

```bash
draftpine generate [--config draftpine.config.json] [--out prototype] [--clean]
```

Behavior:

- validates source
- resolves registry
- renders static pages
- writes CSS/JS assets
- writes `prototype/draftpine.manifest.json`
- prints summary

`--clean` removes stale generated files before writing.

### 7.3 `draftpine check`

Runs static and source checks without browser rendering.

Usage:

```bash
draftpine check [--json] [--strict] [--scope source|generated|all]
```

Checks:

- source schema validity
- route config validity
- recipe validity
- primitive/layout manifest validity
- disallowed framework/build artifacts in generated output
- generated file presence
- generated HTML contract markers
- CSS scope rules
- route link rules
- extension fixture presence

### 7.4 `draftpine eval`

Runs compiler plus rendered evaluation.

Usage:

```bash
draftpine eval [--json] [--strict] [--ai-review] [--routes /,/pricing/] [--changed]
```

Behavior:

- runs `generate`
- runs `check`
- starts local static server
- launches Playwright Chromium
- captures screenshots for configured viewports
- collects console errors
- collects DOM metrics
- runs deterministic layout checks
- runs route type checks
- optionally runs AI screenshot review
- writes report files

Default status semantics:

- `pass`: no errors and all required evals passed
- `fail`: one or more hard failures
- `review-required`: deterministic gates passed, but AI/human review is required by config

### 7.5 `draftpine dev`

Runs watch mode, preview server, and report UI.

Usage:

```bash
draftpine dev [--port 5173] [--report-port 5174] [--ai-review off|manual|auto]
```

Behavior:

- watches source files
- compiles incrementally
- serves `prototype/`
- serves report dashboard
- runs fast checks on every save
- runs browser eval on route-affecting changes
- displays latest repair actions

Dev server terminal output should be concise:

```text
Draftpine dev
Prototype: http://localhost:5173
Report:    http://localhost:5174

compile pass: 8 routes, 14 primitives, 196 ms
eval fail: /pricing/ mobile.horizontalOverflow
```

### 7.6 `draftpine new primitive`

Scaffolds a primitive.

Usage:

```bash
draftpine new primitive hero-proof [--namespace project] [--variant developer]
```

Creates:

```text
primitives/hero-proof/
  primitive.json
  template.html
  styles.css
  demo.json
  eval.json
  README.md
```

### 7.7 `draftpine new layout`

Scaffolds a layout primitive.

Usage:

```bash
draftpine new layout split
```

Creates:

```text
layouts/split/
  layout.json
  template.html
  styles.css
  demo.json
  eval.json
  README.md
```

### 7.8 `draftpine test primitive`

Compiles and evaluates primitive demos.

Usage:

```bash
draftpine test primitive hero-proof [--json] [--update-screenshots]
```

Must fail when:

- manifest invalid
- slot contract invalid
- demo invalid
- template cannot render
- mobile overflow exists
- unlabeled controls exist
- CSS scope violations exist
- screenshot expectations fail

### 7.9 `draftpine test layout`

Compiles and evaluates layout demos.

Usage:

```bash
draftpine test layout split [--json]
```

### 7.10 `draftpine docs`

Generates local documentation from manifests.

Usage:

```bash
draftpine docs [--out docs/generated]
```

Outputs:

- primitive catalog
- layout catalog
- route type catalog
- schema reference
- eval rule reference

### 7.11 `draftpine migrate v1`

Assists migration from v1 root-file prototypes.

Usage:

```bash
draftpine migrate v1 [path] [--out wireframe-v2]
```

Behavior:

- reads v1 `draftpine.config.json`
- identifies existing routes
- creates route definitions
- copies existing HTML/CSS/JS into an `imported/` area
- creates initial recipes when possible
- marks manual migration findings

This command should not pretend conversion is perfect. It should create a safe starting point.

## 8. Domain Model

### 8.1 Workspace

A workspace is the root folder containing Draftpine source files.

Fields:

- root path
- config path
- source directories
- output directory
- registry directories
- report directory

### 8.2 Project

Project is the normalized in-memory representation of a Draftpine workspace.

Fields:

- schema version
- project metadata
- design tokens
- profiles
- routes
- recipes
- content references
- registry references
- eval settings
- exceptions

### 8.3 ScreenPacket

ScreenPacket describes product intent.

Required fields:

- screen
- audience
- userGoal
- primaryAction

Optional fields:

- doNotInclude
- successCriteria
- tone
- domain
- constraints
- requiredStates
- requiredInteractions
- routeBudget

### 8.4 Route

A route is a static page to render.

Fields:

- id
- path
- title
- file
- routeType
- profile
- recipe
- content
- priority
- status
- tags

`status` values:

- `draft`
- `ready`
- `hidden`
- `deprecated`

Hidden routes may compile but should not appear in public navigation.

### 8.5 RouteType

RouteType defines page composition contracts.

Core route types:

- `home`
- `hub`
- `detail`
- `pricing`
- `comparison`
- `docs`
- `article`
- `legal`
- `contact`
- `appDashboard`
- `settings`
- `onboarding`
- `utility`

RouteType contract fields:

- required sections
- optional sections
- forbidden sections
- first viewport requirements
- allowed primitive kinds
- required interactions
- route differentiation rules
- default eval rubric
- documentation

### 8.6 Recipe

A recipe describes page composition.

Fields:

- route id
- route type
- profile
- sections
- interactions
- states
- content bindings
- local variants

### 8.7 Section

A section is one rendered page region.

Fields:

- id
- primitive
- layout
- variant
- content
- visibility
- states
- interactions
- eval hints

### 8.8 Primitive

A primitive is a reusable UI block with a slot contract.

Examples:

- heroProof
- pricingTable
- comparisonTable
- cardGrid
- codePanel
- filterableList
- statePanel
- modalForm
- faq
- testimonialStrip
- metricBand

### 8.9 Layout

A layout defines deterministic spatial behavior.

Examples:

- stack
- cluster
- split
- sidebar
- gridAuto
- gridTwo
- gridThree
- toolbar
- scrollX
- heroProof

### 8.10 Variant

A variant is a named configuration for a primitive or layout.

Variant values must be enumerable and documented.

Examples:

- `compact`
- `spacious`
- `developer`
- `marketing`
- `app`
- `centered`
- `split`

### 8.11 Content

Content is structured data bound to primitive slots.

Content must be separate from layout whenever possible.

Content file examples:

- `content/site.json`
- `content/pages/home.json`
- `content/pages/pricing.json`

### 8.12 Finding

A finding is an eval/check result.

Fields:

- id
- severity
- category
- message
- route
- file
- selector
- primitive
- layout
- evidence
- suggested repair
- blocking

Severity values:

- `error`
- `warning`
- `info`

### 8.13 RepairAction

A repair action is an agent-ready instruction.

Fields:

- priority
- target file
- target JSON pointer when applicable
- action type
- message
- example patch or example source value
- related findings

Action types:

- `edit-json`
- `change-recipe`
- `change-primitive`
- `wrap-overflow`
- `choose-layout`
- `reduce-routes`
- `add-demo`
- `fix-template`
- `fix-css`
- `manual-review`

## 9. Source Schemas

TypeScript types should be the source of truth.

Recommendation:

- define schemas with Zod or TypeBox
- infer TypeScript types from schemas
- generate JSON Schema for documentation and editor support
- validate all source files at runtime

### 9.1 `draftpine.config.json`

Example:

```json
{
  "schemaVersion": "2.0",
  "project": {
    "name": "Steel website wireframe",
    "description": "Static prototype for Steel marketing site",
    "owner": "Steel"
  },
  "source": {
    "routes": "routes.json",
    "contentDir": "content",
    "recipesDir": "recipes",
    "primitivesDir": "primitives",
    "layoutsDir": "layouts"
  },
  "output": {
    "dir": "prototype",
    "clean": true,
    "assetsDir": "assets"
  },
  "theme": {
    "profile": "productMarketing",
    "tokens": "tokens/theme.json",
    "defaultMode": "light",
    "allowThemeToggle": true
  },
  "routeBudget": {
    "defaultMaxRoutes": 7,
    "largePrototypeRequiresApproval": true,
    "representativeRoutesRequired": true
  },
  "eval": {
    "required": true,
    "strict": true,
    "viewports": ["mobile", "desktop"],
    "aiReview": "manual",
    "sampleStrategy": "route-type-plus-changed"
  }
}
```

### 9.2 `routes.json`

Example:

```json
{
  "routes": [
    {
      "id": "home",
      "path": "/",
      "title": "Home",
      "file": "index.html",
      "routeType": "home",
      "profile": "productMarketing",
      "recipe": "recipes/home.json",
      "content": "content/pages/home.json",
      "priority": 1,
      "status": "ready"
    },
    {
      "id": "pricing",
      "path": "/pricing/",
      "title": "Pricing",
      "file": "pricing/index.html",
      "routeType": "pricing",
      "profile": "productMarketing",
      "recipe": "recipes/pricing.json",
      "content": "content/pages/pricing.json",
      "priority": 2,
      "status": "ready"
    }
  ]
}
```

Rules:

- `path` must start and end with `/` except root.
- `file` must be relative and end in `.html`.
- route ids must be stable and kebab-case.
- route ids must be unique.
- route paths must be unique.
- `routeType` is required for v2.
- `recipe` is required unless route is hidden/imported.
- `content` is required unless recipe uses inline content.

### 9.3 Recipe file

Example:

```json
{
  "schemaVersion": "2.0",
  "routeId": "pricing",
  "routeType": "pricing",
  "profile": "productMarketing",
  "sections": [
    {
      "id": "hero",
      "primitive": "core.decisionHero",
      "layout": "core.stack",
      "variant": "compact",
      "content": "hero"
    },
    {
      "id": "plans",
      "primitive": "core.pricingTable",
      "layout": "core.gridAuto",
      "variant": "threePlan",
      "content": "plans",
      "interactions": ["billingToggle"]
    },
    {
      "id": "objections",
      "primitive": "core.objectionGrid",
      "layout": "core.gridAuto",
      "variant": "compact",
      "content": "objections"
    }
  ],
  "states": ["default", "empty", "success"],
  "interactions": ["theme", "billingToggle"]
}
```

Rules:

- section ids must be unique within a recipe.
- every primitive must resolve in registry.
- every layout must resolve in registry.
- section `content` references a key in the route content file unless it is an inline object.
- route type contract determines required/allowed sections.

### 9.4 Content file

Example:

```json
{
  "hero": {
    "eyebrow": "Pricing",
    "title": "Start usage-based. Run production workloads on Priority.",
    "description": "Use credits for trials and early usage, then move workloads to higher limits and support.",
    "primaryAction": {
      "label": "Start for free",
      "href": "https://app.steel.dev/signup"
    },
    "secondaryAction": {
      "label": "Talk to sales",
      "href": "/contact/"
    }
  },
  "plans": {
    "billingMode": "usage",
    "items": [
      {
        "name": "Free and Pay as you go",
        "price": "$0",
        "description": "For trials and spiky workloads.",
        "features": ["$30 trial credit", "$10 minimum top-up", "Usage-based billing"],
        "action": { "label": "Start free", "href": "https://app.steel.dev/signup" }
      }
    ]
  },
  "objections": {
    "items": [
      {
        "title": "No seat pricing",
        "body": "Pay for browser runtime, not team size."
      }
    ]
  }
}
```

Rules:

- content should be plain JSON.
- rich text support should be explicit and limited.
- markdown dumping into UI is not allowed as a main body.
- links must be explicit action/link objects when possible.

## 10. Core Route Types

Route types should be contracts, not prose suggestions.

Each route type defines:

- purpose
- required composition
- allowed primitives
- first viewport requirements
- mobile requirements
- route differentiation rules
- eval prompts

### 10.1 `home`

Purpose:

- introduce product/category
- explain core value
- show proof
- drive primary action

Required composition:

1. hero with primary action
2. proof artifact in first viewport
3. outcome or feature section
4. social proof or credibility
5. final CTA

First viewport requirements:

- H1 visible
- primary action visible
- proof artifact visible or partially visible
- next section hint visible on desktop and mobile

Forbidden:

- generic card grid as first meaningful section
- large empty hero with no proof
- more than two primary CTAs

### 10.2 `pricing`

Purpose:

- help user make a buying/plan decision

Required composition:

1. decision hero
2. pricing table or plan comparison
3. billing/usage explanation
4. objection handling
5. FAQ or support CTA

First viewport requirements:

- pricing or decision context visible
- at least one price/plan signal visible without scrolling on desktop
- primary action visible

Forbidden:

- generic feature grid as main body
- pricing hidden below multiple marketing sections
- more than four primary plan cards unless using table mode

### 10.3 `comparison`

Purpose:

- help user compare Draftpine user's product against an alternative

Required composition:

1. decision-framed hero
2. at-a-glance comparison table
3. fit guidance
4. evidence/proof
5. migration or next-step CTA

Rules:

- claims must be marked as measured, sourced, or placeholder.
- table must not overflow without approved scroll container.

### 10.4 `hub`

Purpose:

- organize a route group

Required composition:

1. hub header
2. filter or category control if more than eight items
3. item grid/list
4. empty state when filter exists

Rules:

- item cards must have clear titles and links.
- hub must link to child detail routes.

### 10.5 `detail`

Purpose:

- explain one feature/use case/integration/industry

Required composition:

1. detail hero
2. concrete product artifact or workflow
3. use cases or steps
4. related links

Rules:

- detail pages should not be visually identical to hubs.

### 10.6 `docs`

Purpose:

- explain usage or implementation

Required composition:

1. docs shell with local nav or TOC
2. code or command block
3. steps
4. callout/state where relevant

Rules:

- code blocks must use approved scroll wrappers.
- copy button primitive should visibly update state when present.

### 10.7 `legal`

Purpose:

- present legal/static policy content

Required composition:

1. simple header
2. readable content layout
3. date/version metadata
4. related legal links

Rules:

- no marketing CTA dominance.
- legal page should not use product hero layout.

### 10.8 `contact`

Purpose:

- let user choose contact path or submit intent

Required composition:

1. clear contact context
2. contact options
3. form or external action
4. success state

## 11. Layout System

Draftpine must ship deterministic layout primitives.

Agents should not write raw layout CSS in most cases.

### 11.1 Core layout classes

Core classes:

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
.dp-toolbar
.dp-scroll-x
.dp-hero-proof
.dp-card-grid
```

### 11.2 Tokens

Required tokens:

```css
:root {
  --dp-space-0: 0;
  --dp-space-1: 0.25rem;
  --dp-space-2: 0.5rem;
  --dp-space-3: 0.75rem;
  --dp-space-4: 1rem;
  --dp-space-5: 1.5rem;
  --dp-space-6: 2rem;
  --dp-space-7: 3rem;
  --dp-space-8: 4rem;

  --dp-container-sm: 48rem;
  --dp-container-md: 64rem;
  --dp-container-lg: 75rem;
  --dp-container-xl: 86rem;

  --dp-radius-sm: 0.375rem;
  --dp-radius-md: 0.625rem;
  --dp-radius-pill: 999px;

  --dp-line: var(--pico-border-color);
  --dp-surface: var(--pico-card-background-color);
  --dp-surface-muted: var(--pico-card-sectioning-background-color);
  --dp-ink: var(--pico-color);
  --dp-muted: var(--pico-muted-color);
  --dp-accent: #0f766e;
}
```

### 11.3 Safe grid pattern

Use this form for auto grids:

```css
.dp-grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--dp-grid-min, 18rem)), 1fr));
  gap: var(--dp-grid-gap, var(--dp-space-5));
}
```

### 11.4 Split layout

Split layout must collapse on mobile.

Agent controls:

```json
{
  "layout": "core.split",
  "ratio": "60-40",
  "align": "center",
  "collapse": "mobile-stack",
  "gap": "lg"
}
```

Allowed ratios:

- `50-50`
- `60-40`
- `40-60`
- `70-30`
- `30-70`

No arbitrary `1.17fr 0.83fr`.

### 11.5 Overflow policy

Default:

- horizontal overflow is forbidden.

Allowed overflow:

- code blocks
- comparison tables
- data tables
- wide timeline artifacts

Allowed overflow must be marked:

```html
<div class="dp-scroll-x" data-draftpine-overflow="allowed">
  ...
</div>
```

The evaluator must fail any other horizontal overflow.

### 11.6 Layout CSS restrictions

Generated page-local CSS must not contain:

- `width: 100vw`
- negative margins
- fixed widths above mobile viewport without `max-width`
- raw `grid-template-columns` unless the file is a layout primitive
- inline layout styles
- absolute positioning for page layout unless primitive manifest allows it

Exceptions require `exceptions.json`.

## 12. Primitive System

### 12.1 Primitive folder

Each primitive:

```text
primitives/<name>/
  primitive.json
  template.html
  styles.css
  demo.json
  eval.json
  README.md
```

### 12.2 Primitive manifest

Example:

```json
{
  "schemaVersion": "2.0",
  "name": "heroProof",
  "namespace": "core",
  "type": "primitive",
  "description": "Hero with primary copy, CTA, and proof artifact.",
  "slots": {
    "eyebrow": { "type": "string", "required": false },
    "title": { "type": "string", "required": true },
    "description": { "type": "string", "required": true },
    "primaryAction": { "type": "action", "required": true },
    "secondaryAction": { "type": "action", "required": false },
    "proof": {
      "type": "object",
      "required": true,
      "variants": ["code", "metric", "browserMock", "table"]
    }
  },
  "variants": ["developer", "marketing", "app"],
  "layouts": ["core.split", "core.stack"],
  "interactions": [],
  "states": ["default"],
  "accessibility": {
    "requiresHeading": true,
    "requiresPrimaryAction": true
  },
  "responsive": {
    "mobile": "stack"
  }
}
```

### 12.3 Slot types

Required slot types:

- `string`
- `text`
- `richText`
- `number`
- `boolean`
- `enum`
- `action`
- `link`
- `image`
- `icon`
- `code`
- `metric`
- `table`
- `array`
- `object`
- `reference`

`richText` must be sanitized and limited. It should not allow arbitrary HTML by default.

### 12.4 Template syntax

Template syntax should be simple, safe, and deterministic.

Requirements:

- escaped output by default
- explicit unescaped output only for sanitized rich text
- loops
- conditionals
- partial include for approved subtemplates
- no arbitrary JavaScript execution in templates

Recommended syntax can be Handlebars-like or Liquid-like. The exact engine can be chosen by implementation, but the allowed subset must be documented and enforced.

Example:

```html
<section class="dp-section dp-hero-proof" data-primitive="core.heroProof">
  <div class="dp-container dp-split" data-layout="{{layout}}">
    <div class="dp-stack">
      {{#if eyebrow}}<p class="dp-eyebrow">{{eyebrow}}</p>{{/if}}
      <h1>{{title}}</h1>
      <p>{{description}}</p>
      {{> actionPair primaryAction secondaryAction}}
    </div>
    {{> proofArtifact proof}}
  </div>
</section>
```

### 12.5 CSS scoping

Primitive CSS must be scoped.

Rules:

- every primitive root must include `data-primitive="namespace.name"`
- CSS selectors should start with `.dp-<primitive-name>` or `[data-primitive="namespace.name"]`
- primitive CSS must not target `body`, `html`, generic `section`, or generic `article` unless allowed by manifest
- primitive CSS must not override global tokens directly

### 12.6 Required core primitives

MVP core primitives:

- `core.siteShell`
- `core.themeToggle`
- `core.heroProof`
- `core.decisionHero`
- `core.cardGrid`
- `core.metricBand`
- `core.codePanel`
- `core.pricingTable`
- `core.comparisonTable`
- `core.filterableList`
- `core.statePanel`
- `core.modalForm`
- `core.faq`
- `core.finalCta`
- `core.footer`

## 13. Layout Extension System

Layout folder:

```text
layouts/<name>/
  layout.json
  template.html
  styles.css
  demo.json
  eval.json
  README.md
```

Layout manifest fields:

- name
- namespace
- description
- allowed children
- parameters
- responsive behavior
- overflow behavior
- accessibility notes
- examples

Example:

```json
{
  "schemaVersion": "2.0",
  "name": "split",
  "namespace": "core",
  "parameters": {
    "ratio": {
      "type": "enum",
      "values": ["50-50", "60-40", "40-60", "70-30", "30-70"],
      "default": "60-40"
    },
    "align": {
      "type": "enum",
      "values": ["start", "center", "end", "stretch"],
      "default": "center"
    },
    "gap": {
      "type": "enum",
      "values": ["sm", "md", "lg", "xl"],
      "default": "lg"
    }
  },
  "responsive": {
    "mobile": "stack"
  },
  "overflow": "forbidden"
}
```

## 14. Compiler Details

### 14.1 Compile stages

Stages:

1. Discover workspace
2. Load config
3. Load route map
4. Load registry
5. Load recipes
6. Load content
7. Validate schemas
8. Normalize domain model
9. Enforce route budget
10. Resolve primitive/layout references
11. Validate route type contracts
12. Render routes
13. Bundle used CSS
14. Bundle used runtime helpers
15. Write output
16. Write compile manifest

### 14.2 Compile manifest

Generated file:

```text
prototype/draftpine.manifest.json
```

Fields:

- compile timestamp
- Draftpine version
- source hashes
- routes rendered
- primitives used
- layouts used
- CSS assets
- JS assets
- warnings
- output files

### 14.3 CSS bundling

Compiler should include only CSS for used primitives/layouts.

CSS order:

1. Pico CDN link in HTML
2. Draftpine tokens
3. core layout CSS
4. used primitive CSS
5. project local primitive CSS
6. approved overrides

Compiler should deduplicate by content hash.

### 14.4 Runtime helper bundling

Runtime helpers should be included only when needed.

Examples:

- theme helper when theme toggle exists
- tabs helper when tab primitive exists
- filter helper when filterable list exists
- modal helper when modal primitive exists

No dead runtime helpers for unused interactions.

### 14.5 Static output HTML rules

Generated HTML must:

- include `<!doctype html>`
- include `lang`
- include viewport meta
- include color-scheme meta
- include title and description
- include Pico CDN
- include generated CSS
- include app JS before Alpine when Alpine is used
- include Alpine CDN only when needed
- use relative asset paths
- avoid root-absolute local links by default
- include semantic landmarks

## 15. Evaluation System

### 15.1 Eval categories

Eval categories:

- source
- compile
- runtime
- layout
- accessibility
- route
- composition
- differentiation
- content
- primitive
- visual
- performance

### 15.2 Deterministic hard gates

Hard gates must fail eval:

- compile error
- schema error
- missing route file
- broken local route link
- JavaScript console error
- Alpine expression error
- mobile horizontal overflow
- element extends outside viewport without allowed overflow wrapper
- missing primary action when route type requires one
- missing H1
- unlabeled interactive control
- primitive manifest invalid
- primitive demo missing
- route budget exceeded without approval

### 15.3 Browser eval

Use Playwright.

Default viewports:

```json
{
  "mobile": { "width": 390, "height": 844 },
  "desktop": { "width": 1440, "height": 1000 }
}
```

Optional additional viewports:

- `mobileSmall`: 360 x 800
- `tablet`: 768 x 1024
- `desktopWide`: 1728 x 1117

Browser eval collects:

- screenshot
- full page screenshot when configured
- console messages
- network failures
- document dimensions
- visible element bounding boxes
- focused route metadata
- first viewport metrics

### 15.4 Mobile overflow detection

Fail when:

```text
document.documentElement.scrollWidth > window.innerWidth + tolerance
```

Default tolerance: 2 px.

Also fail when visible element bounding box:

- `x < -2`
- `x + width > viewportWidth + 2`

Ignore elements inside:

```html
data-draftpine-overflow="allowed"
```

But the overflow wrapper itself must fit the viewport.

### 15.5 First viewport checks

For route types requiring product composition, check:

- H1 visible in first viewport
- primary action visible in first viewport
- first meaningful proof/content artifact visible or partially visible
- next section hint visible where route type requires it
- no huge empty vertical band before content

### 15.6 Route differentiation checks

Route differentiation should detect repetitive shells.

For each route, compute a fingerprint:

- route type
- section primitive sequence
- layout sequence
- first viewport primitive sequence
- dominant interaction set

Warn when:

- too many routes share the exact same fingerprint
- detail pages use hub layout
- pricing page does not use pricing primitive
- comparison page does not use comparison primitive
- legal page uses product hero primitive

### 15.7 AI review

AI review is optional and should run after deterministic checks.

Inputs:

- screen packet
- route type
- route recipe summary
- desktop screenshot
- mobile screenshot
- DOM summary
- deterministic findings

Output schema:

```json
{
  "status": "pass|fail|review-required",
  "scores": {
    "composition": 1,
    "mobileUsability": 1,
    "visualHierarchy": 1,
    "routeDifferentiation": 1,
    "contentSpecificity": 1
  },
  "findings": [
    {
      "severity": "warning",
      "message": "Pricing page reads like a generic marketing page.",
      "repair": "Use core.pricingTable and core.objectionGrid before generic cardGrid."
    }
  ]
}
```

Scores use 1 to 5.

Default pass threshold:

- no score below 3
- average score at least 3.5

AI review must never override hard deterministic failures.

### 15.8 Report format

JSON report:

```json
{
  "draftpineVersion": "2.0.0",
  "status": "fail",
  "summary": {
    "errors": 1,
    "warnings": 2,
    "routesEvaluated": 3,
    "screenshots": 6
  },
  "findings": [
    {
      "id": "mobile.horizontalOverflow",
      "severity": "error",
      "category": "layout",
      "route": "/pricing/",
      "viewport": "mobile",
      "message": "The page has horizontal overflow at 390px.",
      "evidence": {
        "scrollWidth": 428,
        "viewportWidth": 390
      },
      "repair": {
        "type": "choose-layout",
        "file": "recipes/pricing.json",
        "message": "Use core.gridAuto or stack layout for the pricing cards on mobile."
      }
    }
  ],
  "artifacts": {
    "screenshots": [
      "reports/screenshots/pricing-mobile.png"
    ]
  }
}
```

## 16. Exceptions

Exceptions are allowed but must be explicit.

File:

```text
exceptions.json
```

Example:

```json
{
  "exceptions": [
    {
      "rule": "css.rawGridTemplateColumns",
      "file": "primitives/benchmark-grid/styles.css",
      "reason": "Custom benchmark matrix requires fixed metric columns.",
      "expires": "2026-08-01",
      "approvedBy": "Niko"
    }
  ]
}
```

Rules:

- exceptions require reason
- exceptions require file scope
- exceptions should expire
- expired exceptions fail eval
- exceptions appear in reports

## 17. Agent Workflow

### 17.1 New screen

Agent steps:

1. Read `AGENTS.md`.
2. Normalize prompt into screen packet.
3. Choose route type.
4. Choose profile.
5. Choose recipe or create recipe.
6. Fill content JSON.
7. Run `draftpine generate`.
8. Run `draftpine eval --strict`.
9. Repair source files.
10. Repeat until pass.

### 17.2 New primitive

Agent steps:

1. Run `draftpine new primitive <name>`.
2. Fill `primitive.json`.
3. Write `template.html`.
4. Write scoped `styles.css`.
5. Write `demo.json`.
6. Write `eval.json`.
7. Write `README.md`.
8. Run `draftpine test primitive <name>`.
9. Use primitive in recipe only after test passes.

### 17.3 Large site

Agent must not generate every route by default.

Default large-site workflow:

1. Create route map.
2. Classify each route by route type.
3. Select representative routes:
   - home
   - one hub
   - one detail
   - one pricing or decision route if present
   - one docs/legal route if present
4. Generate only representatives first.
5. Eval representatives.
6. Ask before expanding to all routes.

Route shell generation for all routes requires explicit approval or config flag.

## 18. Documentation Requirements

Every core primitive must have:

- what it is for
- when to use it
- when not to use it
- slot reference
- variants
- layout compatibility
- accessibility notes
- mobile behavior
- good example
- bad example

Every route type must have:

- purpose
- required composition
- allowed primitives
- forbidden patterns
- first viewport requirements
- eval rubric
- example recipe

Every eval rule must have:

- id
- category
- severity default
- what triggers it
- why it matters
- repair guidance
- examples

Generated docs should be available through:

```bash
draftpine docs
```

## 19. Testing Strategy

Test layers:

1. Unit tests
2. Schema tests
3. Compiler snapshot tests
4. Primitive fixture tests
5. Layout fixture tests
6. Browser eval tests
7. Regression corpus tests
8. CLI integration tests

Recommended tools:

- Vitest for unit/integration tests
- Playwright for browser eval tests
- TypeScript type tests where helpful

Required CI checks:

```bash
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm draftpine check fixtures/good/basic
pnpm draftpine eval fixtures/good/basic --strict
pnpm draftpine eval fixtures/bad/mobile-overflow --strict
```

Bad fixtures must fail for the expected reason.

Good fixtures must pass.

## 20. Regression Corpus

Draftpine should keep a corpus of generated outputs.

Folders:

```text
fixtures/
  good/
    pricing-basic/
    homepage-developer/
    docs-quickstart/
  bad/
    mobile-overflow/
    route-explosion/
    generic-card-dump/
    alpine-runtime-error/
    unlabeled-controls/
    raw-markdown-dump/
```

Each fixture includes:

- source files
- expected eval result
- screenshots when useful
- explanation

The current Steel wireframe should inform bad fixtures:

- mobile nav clipping
- chip row overflow
- code panel overflow without correct containment
- route explosion
- repeated generic route shape
- excessive CSS

## 21. Migration From v1

v1 concepts map to v2:

```text
draftpine.config.json -> draftpine.config.json + routes.json
index.html -> generated output or imported route
styles.css -> generated CSS plus imported override review
app.js -> generated runtime helpers plus imported custom runtime review
patterns/*.md -> route type and primitive docs
examples/ -> source fixtures and generated examples
scripts/check.py -> TypeScript check/eval commands
scripts/visual_qa.py -> TypeScript eval screenshot subsystem
```

Migration priorities:

1. Preserve static output promise.
2. Preserve agent-readable instructions.
3. Preserve no-framework generated prototypes.
4. Move checks/evals to TypeScript.
5. Split source and generated output.
6. Add route types, primitives, and deterministic layout.

## 22. Implementation Plan

### Phase 0: TypeScript foundation

Deliverables:

- `package.json`
- TypeScript config
- Vitest
- Playwright
- CLI entrypoint
- basic logger/report utilities

Done when:

- `pnpm typecheck` passes
- `pnpm test` passes
- `draftpine --help` works

### Phase 1: Source schemas and registry

Deliverables:

- config schema
- route schema
- recipe schema
- content validation
- primitive manifest schema
- layout manifest schema
- core registry loader

Done when:

- invalid fixture source produces structured findings
- core primitive/layout manifests load

### Phase 2: Compiler MVP

Deliverables:

- render routes from recipes/content
- bundle CSS
- bundle minimal runtime JS
- output static prototype
- compile manifest

Done when:

- a home page fixture compiles to static HTML
- generated page opens from static server

### Phase 3: Core primitives and layouts

Deliverables:

- core layout primitives
- core heroProof
- core cardGrid
- core pricingTable
- core codePanel
- core comparisonTable
- core filterableList
- core statePanel
- core modalForm

Done when:

- primitive demos compile
- primitive demos pass browser eval

### Phase 4: Deterministic eval

Deliverables:

- Playwright runner
- screenshot capture
- console error detection
- mobile overflow detection
- first viewport checks
- route link checks
- report JSON

Done when:

- mobile overflow bad fixture fails
- good fixture passes

### Phase 5: Dev loop

Deliverables:

- `draftpine dev`
- watch mode
- preview server
- report dashboard
- incremental compile

Done when:

- editing content updates prototype and report automatically

### Phase 6: Extension workflow

Deliverables:

- `draftpine new primitive`
- `draftpine new layout`
- `draftpine test primitive`
- `draftpine test layout`
- extension docs generation

Done when:

- an agent can scaffold, implement, test, and use a new primitive

### Phase 7: AI review

Deliverables:

- provider abstraction
- screenshot packaging
- route packet prompt
- structured AI review schema
- opt-in config

Done when:

- AI review can run after deterministic eval
- AI findings appear as structured repair actions

### Phase 8: Migration

Deliverables:

- v1 migration helper
- migration guide
- compatibility docs

Done when:

- a v1 root prototype can be imported into v2 as an imported route with findings

## 23. Non-Goals For v2 MVP

Do not build in MVP:

- WYSIWYG editor
- drag-and-drop builder
- live collaborative editing
- production CMS
- production deployment dashboard
- Figma import/export
- arbitrary npm component imports
- Tailwind support
- React output
- backend functions
- database

## 24. Product Quality Bar

A Draftpine v2 prototype is acceptable when:

- source validates
- compile succeeds
- deterministic eval passes
- mobile has no horizontal overflow
- no console errors
- route type contracts pass
- first viewport satisfies route type
- generated CSS stays within constraints
- required interactions function
- representative routes differ by route type
- eval report has no blocking findings

## 25. KISS Rules

The implementation should follow these rules:

- plain JSON source first
- no hidden inheritance
- no database
- no required cloud service
- generated output is static
- one obvious place for each concept
- strict manifests for extensions
- small core primitive set
- explicit escape hatches
- reports over magic

## 26. Open Decisions

These need product/engineering decisions:

1. Template engine: Handlebars-like, Liquid-like, or custom minimal renderer.
2. Schema library: Zod or TypeBox.
3. Package manager: pnpm recommended.
4. AI review provider abstraction: OpenAI first or provider-neutral from day one.
5. Output directory default: `prototype/` recommended.
6. Whether v2 should preserve root-output compatibility as a first-class mode.
7. How strict CSS budget should be for local project primitives.
8. Whether report dashboard should be custom static HTML or a small local app.

## 27. First Build Slice

The first useful internal milestone should be small:

Input:

```text
draftpine.config.json
routes.json
content/pages/home.json
recipes/home.json
core.heroProof
core.cardGrid
core.finalCta
```

Command:

```bash
draftpine generate
draftpine eval --strict
```

Output:

```text
prototype/index.html
prototype/assets/draftpine.css
prototype/assets/draftpine.js
reports/latest.json
reports/screenshots/home-mobile.png
reports/screenshots/home-desktop.png
```

Must prove:

- TypeScript CLI works
- source validates
- compiler renders static output
- CSS is deterministic
- Playwright screenshots work
- mobile overflow failure can be detected
- report contains agent-readable repair actions

This slice is the foundation. Everything else should build on it.


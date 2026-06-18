# Draftpine v3 Specification

Status: Draft v0.1
Date: 2026-06-18
Audience: Draftpine product and engineering team
Implementation language: TypeScript

## 1. Executive Summary

Draftpine v3 is a themeable static prototype compiler and evaluator for coding agents.

The user-facing model is intentionally smaller than Draftpine v2:

```text
pages/*.json + themes/<theme>/blocks/*.html + themes/<theme>/styles.css
        -> Draftpine compiler
        -> prototype/**/*.html + assets
        -> Draftpine eval report
```

Agents write structured page JSON. Designers and developers can edit normal HTML block templates and theme CSS. Draftpine renders deployable static pages, evaluates the rendered result in a browser, and reports concrete repair actions against source files.

The v3 promise:

> Write page JSON, edit HTML themes, generate static prototypes, and let Draftpine catch the layout, accessibility, route, and runtime failures before a human reviews the screen.

Draftpine v3 keeps the strongest part of v2: deterministic quality gates over generated static output. It simplifies the part that felt too heavy: the default authoring surface.

## 2. Product Positioning

Draftpine v3 is not:

- a production design system
- a React component library
- a general static site generator
- a no-code website builder
- a CMS
- a Figma replacement
- a backend or app framework

Draftpine v3 is:

- a static prototype compiler for agents
- a page JSON authoring format
- an editable HTML theme system
- a browser-based evaluation harness
- a repair loop that points back to source files
- a fast way to create disposable but coherent wireframes and linked prototypes

The generated prototype remains:

- static HTML
- static CSS
- small vanilla JavaScript helpers
- optionally Pico CSS and Alpine.js from CDNs when the theme/runtime needs them
- deployable to GitHub Pages or any static host
- independent of the compiler at runtime

## 3. Design Principles

### 3.1 Simplify Authoring, Not Evaluation

The main simplification is the source model. Draftpine should not require ordinary users to understand routes, recipes, content files, primitive manifests, layout manifests, slot contracts, demo fixtures, and eval fixtures before they can build a good screen.

The default path is:

```text
edit pages/home.json
edit themes/default/blocks/hero.html if needed
edit themes/default/styles.css if needed
run draftpine generate
run draftpine eval --strict
```

The evaluator remains strict. Removing authoring ceremony must not reduce quality checks.

### 3.2 Pages Declare Intent And Data

A page file describes one generated route. It includes the page title, path, type, primary action, and sections. Each section names a block and passes props.

The page file is source of truth for ordinary prototypes.

### 3.3 Themes Provide Editable HTML Blocks

A theme is a directory of normal files:

```text
themes/default/
  theme.json
  shell.html
  styles.css
  blocks/
    hero.html
    metrics.html
    table.html
    pricing.html
```

Blocks are partial HTML templates. They are meant to be read and edited directly.

### 3.4 Draftpine Owns The Dangerous Parts

Draftpine owns:

- route output paths
- relative links
- generated shell metadata
- static asset linking
- theme runtime helpers
- mobile overflow checks
- accessibility checks
- console error checks
- unresolved template marker checks
- eval reports

Theme authors should not need to solve GitHub Pages path safety, source mapping, or browser evaluation.

### 3.5 Safe Templates Over Mini Apps

Block templates use a tiny Mustache-like language. They do not run arbitrary JavaScript.

Supported features:

- escaped variables
- array sections
- inverted sections for empty states
- simple dotted paths

Unsupported by default:

- arbitrary JavaScript expressions
- imports
- remote fetches
- inline event-handler logic
- framework components

### 3.6 Extension In Layers

Draftpine v3 has extension levels:

1. Page authoring: edit page JSON.
2. Theme editing: edit block HTML and theme CSS.
3. Local block authoring: add a block file and register it in `theme.json`.
4. Theme pack authoring: add stricter docs, fixtures, and visual tests.

Users should not meet level 4 during first run.

## 4. Core Concepts

### 4.1 Project

A Draftpine project is a directory containing:

```text
draftpine.config.json
pages/
themes/
prototype/       # generated
reports/         # generated
```

`prototype/` and `reports/` are compiler/evaluator output. Users should not hand-edit them.

### 4.2 Page

A page is a JSON file that generates one route.

Example:

```json
{
  "schemaVersion": "3.0",
  "id": "dashboard",
  "path": "/dashboard/",
  "title": "Usage billing dashboard",
  "type": "dashboard",
  "description": "Track current usage, spend, limits, and invoices.",
  "audience": "Startup founder",
  "userGoal": "Understand current usage before upgrading",
  "primaryAction": {
    "label": "Upgrade plan",
    "href": "#upgrade"
  },
  "sections": [
    {
      "id": "hero",
      "block": "hero",
      "props": {
        "eyebrow": "Billing",
        "headline": "Understand usage before it surprises you.",
        "body": "See spend, limits, and invoices in one focused workspace.",
        "primaryAction": "Upgrade plan",
        "primaryHref": "#upgrade"
      }
    },
    {
      "id": "summary",
      "block": "metrics",
      "props": {
        "items": [
          { "label": "Current spend", "value": "$428" },
          { "label": "Projected", "value": "$690" },
          { "label": "Limit used", "value": "71%" }
        ]
      }
    },
    {
      "id": "usage",
      "block": "table",
      "props": {
        "title": "Recent usage",
        "columns": ["Service", "Units", "Cost"],
        "rows": [
          ["Browser sessions", "1,240", "$188"],
          ["Screenshots", "8,900", "$94"],
          ["Exports", "320", "$42"]
        ]
      }
    }
  ]
}
```

### 4.3 Theme

A theme defines the shell, styles, and block templates used by pages.

Example:

```json
{
  "schemaVersion": "3.0",
  "name": "Default",
  "description": "Default Draftpine v3 theme.",
  "shell": "shell.html",
  "styles": "styles.css",
  "blocks": {
    "hero": {
      "file": "blocks/hero.html",
      "description": "Page hero with copy, proof, and primary action.",
      "requires": ["headline"],
      "markers": ["primaryAction"]
    },
    "metrics": {
      "file": "blocks/metrics.html",
      "description": "Compact metric strip.",
      "requires": ["items"]
    },
    "table": {
      "file": "blocks/table.html",
      "description": "Static data table.",
      "requires": ["columns", "rows"]
    }
  }
}
```

### 4.4 Block

A block is an HTML partial rendered with section props.

Example:

```html
<section class="dp-hero">
  <p class="dp-eyebrow">{{eyebrow}}</p>
  <h1>{{headline}}</h1>
  <p>{{body}}</p>
  <a href="{{primaryHref}}" data-draftpine-action="primary">{{primaryAction}}</a>
</section>
```

Repeated content:

```html
<section class="dp-metrics" aria-label="{{title}}">
  {{#items}}
    <article class="dp-metric">
      <strong>{{value}}</strong>
      <span>{{label}}</span>
    </article>
  {{/items}}
  {{^items}}
    <p>No metrics yet.</p>
  {{/items}}
</section>
```

### 4.5 Shell

The shell wraps page sections with document-level markup. It receives shell props from Draftpine:

- `project.name`
- `page.title`
- `page.description`
- `page.path`
- `theme.name`
- `nav`
- `footer`
- `sections`
- `assetPrefix`
- `runtimeScripts`
- `styleLinks`

Themes may provide `shell.html`. If omitted, Draftpine uses a built-in shell.

The shell must preserve:

- `<!doctype html>`
- responsive viewport meta tag
- document title
- description meta tag
- theme init script
- generated CSS links
- generated runtime script
- literal route links for public routes

## 5. File Layout

### 5.1 Minimal Single-Screen Project

```text
draftpine.config.json
pages/
  home.json
themes/
  default/
    theme.json
    shell.html
    styles.css
    blocks/
      hero.html
      metrics.html
      table.html
```

### 5.2 Browsable Project

```text
draftpine.config.json
pages/
  home.json
  pricing.json
  dashboard.json
  settings.json
themes/
  default/
    theme.json
    shell.html
    styles.css
    blocks/
      hero.html
      card-grid.html
      pricing.html
      table.html
      settings.html
prototype/
reports/
```

### 5.3 Generated Output

For the browsable project above:

```text
prototype/
  index.html
  pricing/
    index.html
  dashboard/
    index.html
  settings/
    index.html
  assets/
    draftpine.css
    draftpine.js
  draftpine.manifest.json
reports/
  latest.json
  latest.html
  screenshots/
    home-mobile.png
    home-desktop.png
```

## 6. Configuration

`draftpine.config.json` controls project-level behavior.

Example:

```json
{
  "schemaVersion": "3.0",
  "project": {
    "name": "Acme Billing Prototype",
    "description": "Static billing dashboard prototype"
  },
  "source": {
    "mode": "pages",
    "pagesDir": "pages",
    "theme": "default",
    "themesDir": "themes"
  },
  "output": {
    "dir": "prototype",
    "clean": true,
    "assetsDir": "assets"
  },
  "theme": {
    "defaultMode": "light",
    "allowThemeToggle": true
  },
  "eval": {
    "required": true,
    "strict": true,
    "viewports": ["mobile", "desktop"],
    "aiReview": "off"
  }
}
```

### 6.1 Required Config Fields

- `schemaVersion`
- `project.name`
- `source.mode`
- `source.pagesDir`
- `source.theme`
- `source.themesDir`
- `output.dir`
- `output.assetsDir`

### 6.2 Source Modes

`source.mode` values:

- `pages`: v3 default page/theme/block model.

Draftpine v3 supports the `pages` source mode. New projects default to `pages`.

## 7. Page Schema

### 7.1 Page Fields

Required:

- `schemaVersion`
- `id`
- `path`
- `title`
- `type`
- `sections`

Optional:

- `description`
- `audience`
- `userGoal`
- `primaryAction`
- `status`
- `priority`
- `tags`
- `navLabel`
- `theme`
- `layout`

### 7.2 Page Field Rules

- `id` must be lowercase kebab case.
- `path` must be `/` or start and end with `/`.
- `title` must be non-empty.
- `sections` must contain at least one visible section.
- `status` defaults to `ready`.
- Public statuses are `ready` and `draft`.
- Non-public statuses are `hidden` and `deprecated`.

### 7.3 Section Fields

Required:

- `id`
- `block`
- `props`

Optional:

- `slot`
- `visibility`
- `states`
- `interactions`
- `evalHints`

Rules:

- `id` must be lowercase kebab case.
- `block` must reference a registered theme block.
- `props` must be an object.
- `visibility` defaults to `visible`.
- `slot` defaults to `main`.

## 8. Theme Schema

### 8.1 Theme Fields

Required:

- `schemaVersion`
- `name`
- `blocks`

Optional:

- `description`
- `shell`
- `styles`
- `scripts`
- `tokens`
- `supportsDarkMode`
- `requiredRuntime`

### 8.2 Block Metadata Fields

Required:

- `file`

Optional:

- `description`
- `requires`
- `optional`
- `markers`
- `states`
- `interactions`
- `allowedRawHtml`
- `overflow`
- `accessibility`

Example:

```json
{
  "file": "blocks/filter-table.html",
  "description": "Filterable table with empty state.",
  "requires": ["title", "columns", "rows"],
  "markers": ["primaryAction"],
  "states": ["empty"],
  "interactions": ["filter"],
  "overflow": "conditional",
  "accessibility": {
    "requiresHeading": true,
    "requiresLabels": true
  }
}
```

### 8.3 Theme Validation

Draftpine must validate that:

- `theme.json` exists.
- registered block files exist.
- `shell.html` exists if declared.
- `styles.css` exists if declared.
- block names are unique.
- block names are lowercase kebab case.
- theme file paths do not escape the theme directory.
- required props are present in sections using that block.

## 9. Template Language

### 9.1 Goals

The template language must be small, deterministic, and safe. It exists to render static HTML from JSON data, not to become an application language.

### 9.2 Syntax

Escaped variable:

```text
{{headline}}
```

Dotted path:

```text
{{primaryAction.label}}
```

Array or truthy section:

```text
{{#items}}
  <article>{{label}}</article>
{{/items}}
```

Inverted section:

```text
{{^items}}
  <p>No items yet.</p>
{{/items}}
```

Comments:

```text
{{! This is a template comment }}
```

### 9.3 Escaping

All variable insertion is HTML-escaped by default.

Escaped characters:

- `&`
- `<`
- `>`
- `"`
- `'`

### 9.4 Raw HTML

Raw HTML insertion is not supported in v3 default mode.

If a future version adds raw HTML, it must be:

- explicit in syntax
- opt-in per block metadata
- flagged in reports
- covered by static checks

### 9.5 Missing Values

Missing optional values render as empty strings.

Missing required values produce a source finding before browser eval.

Unresolved template markers in generated output produce an eval finding.

### 9.6 Unsupported Features

The renderer must not support:

- JavaScript expressions
- loops with arbitrary conditions
- helper imports
- remote includes
- file reads from templates
- event-handler generation

## 10. Default Theme

The default theme should cover common wireframe needs without becoming a large UI library.

Required default blocks:

- `hero`
- `proof`
- `metrics`
- `card-grid`
- `table`
- `pricing`
- `comparison`
- `form`
- `settings`
- `directory`
- `detail`
- `timeline`
- `callout`

### 10.1 Visual Bar

The default theme should:

- look intentional rather than like raw Pico
- use a restrained neutral palette with one accent
- support light and dark mode
- keep typography compact and readable
- avoid oversized hero typography in app-like pages
- use stable layout dimensions for repeated UI
- avoid card-inside-card composition
- keep mobile layouts free of horizontal overflow

### 10.2 Default Theme CSS

Theme CSS should focus on:

- tokens
- layout primitives
- block spacing
- responsive behavior
- density
- border and panel treatment
- interaction states

Theme CSS must avoid:

- `width: 100vw`
- negative margins without an explicit exception
- large fixed widths without max-width containment
- global element overrides that break generated shell behavior
- root-absolute asset URLs

## 11. Runtime

Draftpine runtime JavaScript is small and static.

Required helpers:

- theme initialization
- theme toggle
- route href helper if needed by shell templates
- tabs
- filter
- modal

Runtime helpers must:

- work without a build step
- avoid remote API calls
- avoid persistent state except local theme preference
- avoid production backend simulation
- be safe under GitHub Pages project paths

### 11.1 Theme Initialization

Generated pages must apply theme before CSS renders:

```html
<script>
  (function(){
    var t=localStorage.getItem('draftpine-theme');
    if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    document.documentElement.dataset.theme=t;
  })();
</script>
```

The runtime must keep the document theme and stored preference in sync.

### 11.2 Interactions

Supported named interactions:

- `theme`
- `tabs`
- `filter`
- `modal`

Optional future interactions:

- `accordion`
- `stepper`
- `toast`
- `copy`

Theme blocks may declare interactions, but the implementation must come from Draftpine runtime helpers or static HTML behavior.

## 12. Compiler Pipeline

### 12.1 Generate Command

Primary command:

```bash
draftpine generate
```

Equivalent dev command:

```bash
pnpm draftpine generate
```

### 12.2 Generate Steps

1. Load `draftpine.config.json`.
2. Determine source mode.
3. Load pages from `source.pagesDir`.
4. Load selected theme from `source.themesDir`.
5. Validate page and theme schemas.
6. Validate page-to-block references.
7. Render each section through its block template.
8. Render the shell with page sections, nav, footer, assets, and metadata.
9. Write route HTML files.
10. Write CSS and runtime JS assets.
11. Write `prototype/draftpine.manifest.json`.
12. Return compile artifact and findings.

### 12.3 Determinism

Repeated generation from the same source must produce byte-stable HTML and CSS, except for explicitly timestamped report files. The compile manifest may include timestamps, but generated route HTML and CSS should remain stable.

### 12.4 Route Output

Route output rules:

- `/` writes `prototype/index.html`.
- `/pricing/` writes `prototype/pricing/index.html`.
- nested routes write nested `index.html` files.
- links and assets are relative from each generated route.
- generated output must not use root-absolute local paths.

### 12.5 Manifest

`prototype/draftpine.manifest.json` should include:

- Draftpine version
- source mode
- active theme
- source hashes
- routes rendered
- pages rendered
- blocks used
- CSS assets
- JS assets
- warnings
- output files

## 13. Evaluation

### 13.1 Eval Command

Primary command:

```bash
draftpine eval --strict
```

Equivalent dev command:

```bash
pnpm draftpine eval --strict
```

### 13.2 Eval Steps

1. Run generate.
2. Run static checks.
3. Serve generated `prototype/` from a local static server.
4. Open selected routes in Playwright.
5. Capture screenshots for configured viewports.
6. Collect console errors and page errors.
7. Check horizontal overflow.
8. Check required document structure.
9. Check labels and accessible controls.
10. Check theme toggle behavior.
11. Check declared interactions.
12. Check unresolved template markers.
13. Write `reports/latest.json`.
14. Write `reports/latest.html`.
15. Return pass, fail, or pass-with-review.

### 13.3 Static Checks

Static checks must detect:

- invalid config
- invalid page JSON
- invalid theme metadata
- missing theme files
- unknown block references
- missing required props
- disallowed local root-absolute paths
- broken generated local links
- disallowed generated framework artifacts
- unsafe theme CSS
- unsafe block HTML

### 13.4 Browser Checks

Browser checks must detect:

- JavaScript console errors
- page errors
- mobile horizontal overflow
- missing H1
- missing primary action marker
- unlabeled controls
- unresolved template markers
- no-op theme toggle
- no-op declared interactions where feasible

### 13.5 Viewports

Supported viewport names:

- `mobileSmall`
- `mobile`
- `tablet`
- `desktop`
- `desktopWide`

Default:

```json
["mobile", "desktop"]
```

### 13.6 Eval Status

Statuses:

- `pass`: deterministic checks passed and no manual review is required.
- `fail`: one or more errors were found.
- `pass-with-review`: deterministic checks passed, but manual review is configured.

## 14. Findings And Repair Actions

Findings are agent-facing. They must be precise and actionable.

Finding fields:

- `id`
- `severity`
- `category`
- `message`
- `file`
- `route`
- `viewport`
- `evidence`
- `repair`

Severity values:

- `error`
- `warning`
- `info`

Repair action fields:

- `priority`
- `type`
- `file`
- `message`

For v3 projects, findings should point to:

- `pages/*.json` for page data problems
- `themes/<theme>/theme.json` for theme metadata problems
- `themes/<theme>/blocks/*.html` for block markup problems
- `themes/<theme>/styles.css` for theme CSS problems
- generated files only when the issue cannot be mapped back to source

## 15. Reports

Draftpine writes reports for agents first and humans second.

### 15.1 JSON Report

`reports/latest.json` includes:

- Draftpine version
- source mode
- status
- deterministic status
- manual review flag
- summary counts
- active theme
- routes evaluated
- screenshots
- findings
- artifacts

### 15.2 HTML Report

`reports/latest.html` should provide:

- summary status
- route list
- screenshot links or previews
- findings grouped by severity
- findings grouped by source file
- repair actions
- theme and block usage

## 16. CLI

### 16.1 Commands

Required commands:

```bash
draftpine init [path] [--starter single-screen|browsable|docs] [--force]
draftpine generate [workspace] [--json]
draftpine check [workspace] [--json] [--scope source|generated|all]
draftpine eval [workspace] [--json] [--strict] [--routes /,/pricing/]
draftpine dev [--port 5173] [--report-port 5174]
draftpine new block <name>
draftpine docs
```

### 16.2 Init

`draftpine init` should create a v3 pages-mode project by default.

Default starter:

```text
draftpine.config.json
pages/home.json
themes/default/theme.json
themes/default/shell.html
themes/default/styles.css
themes/default/blocks/*.html
```

The starter must pass:

```bash
draftpine generate
draftpine check
draftpine eval --strict
```

### 16.3 New Block

`draftpine new block timeline` should:

- create `themes/default/blocks/timeline.html`
- add a `timeline` entry to `themes/default/theme.json`
- include a minimal editable block template
- avoid creating primitive/layout manifests by default

## 17. Migration

Draftpine v3 does not preserve v2 source compatibility. Existing v2 projects should be manually re-authored into `pages/*.json` and editable theme blocks.

## 18. Security And Safety

Draftpine v3 should be safe for local static generation.

Rules:

- Templates cannot execute JavaScript.
- Block HTML should not include `<script>` tags by default.
- Inline event handlers such as `onclick` are disallowed by default.
- Remote fetches are disallowed in generated runtime.
- Theme file paths cannot escape the theme directory.
- Page discovery cannot read outside the workspace.
- Generated output cannot include TypeScript, JSX, Vue, Svelte, or framework source files.
- Static checks must block common CSS overflow hazards.

## 19. Accessibility

Generated pages must satisfy baseline accessibility checks:

- exactly one clear H1 is preferred, at least one H1 is required
- interactive controls need visible text, a label, `aria-label`, or `aria-labelledby`
- forms need labels
- buttons need text or accessible labels
- dialogs need accessible names
- focusable controls must not be hidden offscreen
- theme contrast should be manually reviewed, with automated checks added later if practical

Accessibility findings are errors when they affect basic operation.

## 20. GitHub Pages Compatibility

Generated output must work under project-path hosting such as:

```text
https://owner.github.io/repo/
```

Rules:

- use relative local links
- do not generate root-absolute local `href` or `src`
- nested routes link assets with the correct relative prefix
- route links resolve to generated files
- static assets live under the configured assets directory

## 21. Testing And Fixtures

### 21.1 Unit Tests

Required unit coverage:

- config schema
- page schema
- theme schema
- template renderer
- page discovery
- route output paths
- asset prefix generation
- deterministic generation

### 21.2 Integration Tests

Required integration coverage:

- init starter generates
- init starter passes eval
- good Lite fixture passes strict eval
- good browsable Lite fixture passes strict eval
- bad unknown block fixture fails with expected finding
- bad duplicate route fixture fails with expected finding
- bad unsafe theme fixture fails with expected finding
- bad no-op interaction fixture fails with expected finding

### 21.3 Fixture Layout

```text
fixtures/
  good/
    lite-basic/
    lite-browsable/
    lite-custom-block/
  bad/
    lite-unknown-block/
    lite-duplicate-route/
    lite-unsafe-theme/
    lite-noop-interaction/
```

## 22. Release Gate

Before release:

```bash
pnpm typecheck
pnpm test
pnpm test:corpus
pnpm test:lite
pnpm build
```

`pnpm test:lite` should run:

- generate for good Lite fixtures
- check for good Lite fixtures
- strict eval for good Lite fixtures
- expected failures for bad Lite fixtures

## 23. Documentation

Required docs:

- README quick start
- Lite authoring guide
- theme block authoring guide
- eval and report guide

Docs must teach in this order:

1. Create a project.
2. Edit page JSON.
3. Edit a block HTML file.
4. Edit theme CSS.
5. Run generate and eval.
6. Add a new block.

Docs must not present primitive/layout manifests as first-run concepts.

## 24. Success Criteria

Draftpine v3 is successful when:

- a new user can understand the project by opening `pages/home.json` and `themes/default/blocks/hero.html`
- first-run authoring requires fewer files than v2
- generated output remains static and deployable
- strict eval catches the same core failures as v2
- findings point back to editable source
- adding a local block is a small HTML/theme metadata change
- good fixtures pass reliably
- bad fixtures fail for precise reasons
- the default theme produces intentional, compact, responsive wireframes

## 25. Open Questions

1. Should larger prototypes keep an explicit route index for ordering and visibility?
2. Should raw HTML insertion be permanently unsupported, or allowed only with explicit metadata and warnings?
3. Should Pico CSS remain in the default generated shell, or should the default theme become fully self-contained?
4. Should theme packs require fixtures before they can be reused across projects?

## 26. Implementation Phases

### Phase 1: Product Cut

- write Lite/v3 docs
- update AGENTS.md
- decide schema/version compatibility
- add v3 page and theme schemas

### Phase 2: Source Model

- load pages
- discover routes
- normalize source
- add fixtures

### Phase 3: Theme Blocks

- implement theme loader
- implement safe template renderer
- create default theme
- add custom block flow

### Phase 4: Compiler

- render pages
- render shell
- bundle CSS and runtime
- write manifest
- preserve relative links

### Phase 5: Eval

- map findings to v3 source
- check theme safety
- verify browser interactions
- update reports

### Phase 6: Release

- update README and docs
- add release gate

## 27. Final Product Sentence

Draftpine v3 is a static prototype compiler where agents write page JSON, teams edit HTML themes, and Draftpine generates and evaluates deployable wireframes.

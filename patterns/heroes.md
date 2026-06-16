# Hero Patterns

Use a hero pattern to establish what the screen is, who it is for, and what action matters most.

Baseline:

- Compose the first viewport so the hero proof and a hint of the next section are visible on common desktop and mobile sizes.
- Avoid large dead bands above, below, or between hero columns. Use `clamp()` spacing and content-sized grids instead of fixed tall sections.
- The right-side visual in a split hero must be concrete product evidence: code, output, a dashboard slice, a trace, a browser/session panel, or a live-state mock.
- A tagline or trust line should be visually integrated with the CTA/proof area, not left as a weak stray pill.

## Outcome Hero With CTA Pair

Use for broad product, marketing, pricing, or dashboard entry screens.

Structure:

- Eyebrow or compact context line.
- H1 with the literal product, screen, or offer.
- One supporting sentence.
- Primary CTA marked with `data-draftpine-action="primary"`.
- Secondary CTA for docs, sales, preview, or a lower-commitment path.

## Code / Runtime Hero

Use for developer tools, API products, automation tools, and agent infrastructure.

Structure:

- H1 and subhead on one side.
- Product proof on the other: code panel, terminal log, browser mock, trace viewer, or request/response preview.
- Status chips such as `connected`, `running`, `queued`, or `saved` when useful.

Implementation notes:

- Prefer a `.hero-split` style grid with `grid-template-columns: minmax(0, 1.05fr) minmax(20rem, 0.95fr)` and responsive collapse.
- Use a `.proof-panel`-style wrapper with a header, body, and status/footer row so the proof panel reads as a product surface rather than a quiet placeholder.
- Include at least one stateful detail in the proof: session ID, latency, region, method, queue state, trace status, or output count.
- Keep code panels high-contrast enough to be the dominant proof object.

## Try-It-In-The-Hero Input

Use when the product promise can be shown with a single input: URL scrape, prompt, search, import, upload, or command.

Requirements:

- Label or `aria-label` the input.
- Keep behavior fake and local.
- Show deterministic preview output after submit.

## Install-Command Hero

Use for open-source or developer-first products where trying locally is more persuasive than signing up.

Structure:

- Copyable command field.
- Primary action such as `Copy install command` or `Open quickstart`.
- Reassurance line like `No signup needed`.

## Benchmark-As-Headline Hero

Use when the page's strongest argument is one quantitative proof point.

Structure:

- Eyebrow with the benchmark name.
- H1 that contains the result.
- Simple CSS bar or table, not a chart library.
- Link-style affordance to methodology, even if the wireframe uses placeholder copy.

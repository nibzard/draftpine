# Hero Patterns

Use a hero pattern to establish what the screen is, who it is for, and what action matters most.

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


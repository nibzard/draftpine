# Draftpine AI Contribution Policy

**Version:** 1.0  
**Adopted:** 2026-06-16  
**License:** MIT

---

## Overview

Draftpine welcomes AI-assisted contributions. This project is built for coding agents, so responsible agent use is part of the expected workflow.

This policy applies to code, documentation, examples, templates, scripts, issues, pull requests, and project discussions.

## Our Stance

AI tools and coding agents are allowed when there is clear human accountability.

You may use tools such as Codex, Claude Code, GitHub Copilot, Cursor, ChatGPT, or similar systems to draft, review, test, or revise contributions. The human contributor remains responsible for everything submitted.

## Core Principles

### Human Accountability

You are responsible for your contribution, even if an AI tool generated part of it.

Requirements:

- You understand the submitted changes.
- You can explain why the changes are needed.
- You reviewed the output before submitting it.
- You verified behavior with the relevant Draftpine checks.
- "The AI generated it" is not an acceptable explanation for broken, unsafe, or low-quality work.

### Agent-Friendly Contributions

Draftpine encourages agent-friendly changes when they make the project easier for coding agents to use.

Good contributions include:

- clearer `AGENTS.md` instructions
- better `agent-workflows/` docs
- more reliable `scripts/check.py` feedback
- new templates with `template.json`
- examples that pass Draftpine check
- improved schemas or guardrails
- documentation that helps agents follow the happy path

Contributions should preserve Draftpine's core constraint: static Pico + Alpine wireframes with no build step.

### Disclosure

Routine AI assistance, such as autocomplete, grammar edits, or small suggestions, does not need disclosure.

If AI generated or substantially rewrote a meaningful part of the contribution, disclose it in the pull request description:

- which tool was used
- what parts were AI-assisted
- how you reviewed or tested the result

Optional commit trailer:

```text
Assisted-by: Tool Name
```

Example:

```text
Assisted-by: Codex
```

## Quality Requirements

All contributions must be reviewable and scoped.

For wireframe, template, checker, or workflow changes, run:

```bash
python3 scripts/check.py --json
```

If the checker reports errors, fix them before opening a pull request unless the pull request is specifically about improving the checker.

Expected standards:

- no npm, bundlers, TypeScript, React, Vue, Svelte, Tailwind, or backend calls unless maintainers explicitly approve a change in project direction
- root `index.html` remains static and GitHub Pages compatible
- templates include `index.html`, `styles.css`, `app.js`, and `template.json`
- required states and interactions use `data-draftpine-*` markers
- docs are accurate, concise, and agent-actionable
- generated code is not pasted blindly

Low-effort, unreviewed AI output may be closed without detailed review.

## Copyright And Licensing

By contributing, you certify that:

1. You have the right to submit the contribution under the MIT license.
2. Your contribution does not knowingly include third-party code with incompatible licensing.
3. AI-assisted output has been reviewed for obvious licensing, attribution, and provenance issues.
4. You did not ask an AI tool to reproduce proprietary or copyrighted source material.

## Prohibited Uses

Do not:

- submit autonomous agent PRs without a human reviewing and approving them
- file hallucinated bugs, fake benchmarks, or unverified claims
- perform broad AI-generated rewrites without a clear reason
- add dependencies or infrastructure that violate Draftpine's no-build promise
- use AI to impersonate another person or maintainer
- submit generated media, logos, or brand assets without clear rights to use them

## Maintainer Use

Maintainers may use AI tools and coding agents at their discretion. Maintainers remain responsible for all merged content.

## Enforcement

Non-compliant contributions may be closed or returned for changes.

Maintainers may ask contributors to:

- disclose AI assistance
- explain generated code
- reduce scope
- run Draftpine checks
- remove unverified or inappropriate generated content

Repeated abuse may result in restricted contribution privileges.

## Questions

Open a GitHub issue or discussion for questions about this policy.

## Version History

- 2026-06-16: Initial AI contribution policy.


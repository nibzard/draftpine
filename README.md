# Draftpine v2

Draftpine v2 is an agent-extensible wireframe compiler and evaluator. Agents author structured JSON source, Draftpine compiles static HTML/CSS/JS, then evaluates the rendered result and reports repair actions.

## Quick Start

```bash
pnpm install
pnpm draftpine init demo --starter single-screen
cd demo
pnpm --dir .. draftpine generate
pnpm --dir .. draftpine eval --strict
```

Generated prototypes remain static and deployable from `prototype/`.

`draftpine eval` reports deterministic hard-gate status separately from optional manual review. A result of `pass-with-review` means the generated prototype passed deterministic checks, while `manualReviewRequired` remains true.

## Commands

- `draftpine init [path]`
- `draftpine generate`
- `draftpine check`
- `draftpine eval`
- `draftpine dev`
- `draftpine new primitive <name>`
- `draftpine new layout <name>`
- `draftpine test primitive <name>`
- `draftpine test layout <name>`
- `draftpine docs`
- `draftpine migrate v1 [path]`

See [SPECIFICATION.md](./SPECIFICATION.md) for the product contract.

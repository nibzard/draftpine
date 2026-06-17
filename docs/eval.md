# Evaluation

`draftpine eval --strict` runs:

- source and generated file checks
- local route link checks
- Playwright console collection
- mobile and desktop screenshots
- horizontal overflow checks
- H1, primary action, and control label checks
- route type composition checks

## Status Semantics

`status: "fail"` means deterministic checks found one or more errors.

`status: "pass"` means deterministic checks passed and no manual review gate is configured.

`status: "pass-with-review"` means deterministic checks passed, but the project has `eval.aiReview: "manual"` configured, so a human or AI screenshot review is still requested.

Every JSON report also includes:

- `deterministicStatus`: `pass` or `fail`
- `manualReviewRequired`: boolean

Use `deterministicStatus` when automation needs to know whether hard gates passed.

## Artifact Hygiene

Eval cleans `reports/screenshots/` before taking new screenshots so stale route images from previous runs do not remain in `latest.json` or `latest.html`.

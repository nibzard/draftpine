# Visual QA Workflow

Run this after `python3 scripts/check.py --runtime --json` passes.

```bash
python3 scripts/visual_qa.py --json
```

If Chrome or Chromium is available, the helper starts a local server, captures
desktop and mobile screenshots for representative routes, and writes them under
`work/visual-qa/`. If Chrome is unavailable, use the emitted checklist manually.

Inspect:

- First viewport composition: title, primary action, proof/context, and a hint
  of the next section.
- Shared nav/footer consistency across root, hub, and detail pages.
- Light and dark theme state.
- Required interactions: tabs, filters, modals, theme, and visible state
  changes.
- Mobile layout: no clipped text, horizontal overflow, overlapping controls, or
  unusable tap targets.
- Motion: purposeful, not fatiguing, and respectful of reduced motion.

Checker pass is the mechanical gate. Visual QA is the product-quality gate.


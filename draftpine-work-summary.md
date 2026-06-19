# Draftpine Work Summary

We have been trying to make Draftpine v2 a useful agent-first static wireframe kit, not just a Pico-styled HTML starter.

## What We Did

- Read and implemented the Draftpine specification.
- Expanded the browsable starter from a small default into a 10-route prototype: `home`, `dashboard`, `directory`, `detail`, `pricing`, `compare`, `checkout`, `settings`, `support`, and `editorial`.
- Added more route types, primitives, and layouts: tables, stepper flows, settings lists, support panels, timeline feeds, app shell, inspector sidebar, split forms, table layouts, and related building blocks.
- Added prompt-aware content presets for different domains: music teacher marketplace, clinic nurse operations, and museum exhibit planning.
- Ran live tests in `/tmp` with multiple generated prototypes.
- Used `agent-browser` to preview and screenshot examples.
- Fixed concrete issues around dark-mode card contrast, oversized typography, weak route differentiation, nav/title collision, stepper label wrapping, and full-width-feeling pages.
- Committed and pushed the work in multiple commits.

## Problems We Found

- The early outputs looked too much like default Pico.
- Even after adding more routes, the page structure still felt repetitive: top nav, hero, cards, section, repeat.
- Route content became more specific, but the visual silhouette stayed too similar.
- The default typography and spacing initially felt oversized.
- Dark mode had low contrast in some cards and category panels.
- Containers were inconsistent: some content felt full-width or weakly bounded.
- The shadcn-inspired pass improved details but did not change the overall look enough.
- The core issue is not only tokens. It is composition: Draftpine needs stronger screen-level layout recipes, not just nicer CSS.

## User Expectations

- Draftpine should produce decent, clean, elegant, flexible wireframes by default.
- It should not look like raw Pico.
- It should not feel oversized.
- It should have consistent containers and borders.
- Dark mode should have usable contrast.
- Different prompts and route types should produce visibly different layouts.
- Generated examples should have enough variety for designers and coding agents to evaluate product structure.
- It does not need to be high-fidelity production design, but it must look intentional.
- It should stay useful for static wireframes and agents, likely without migrating the default to React/shadcn.
- A shadcn-quality static theme is preferred before considering a separate React/shadcn mode.

## Current State

We made progress, especially on structure and static theme quality, but the visual result still has not met the bar. The next real improvement should focus on screen composition and recipe diversity, not another small styling pass.

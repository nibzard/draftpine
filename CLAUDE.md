# Claude Code Instructions

Read and follow `AGENTS.md`. Draftpine's source of truth is agent-neutral; the Claude skills in `.claude/skills/` mirror the same workflows.

Useful skills:

- `/wireframe` builds or revises a Pico + Alpine wireframe from a screen packet.
- `/wireframe-review` audits an existing wireframe against the quality bar.
- `/wireframe-template` selects a pattern recipe and can inspect examples for reference.
- `/wireframe-check` runs the checker and repairs errors.
- `/wireframe-deploy` publishes the static wireframe to GitHub Pages after explicit user approval.

Before finishing a wireframe task, run:

```bash
python3 scripts/check.py --json
```

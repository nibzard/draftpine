# Check And Repair

Run:

```bash
python3 scripts/check.py --json
```

If the checker returns `"status": "fail"`, read `next_actions` in priority order. Apply the suggested fixes, then run the checker again.

Do not finish a Draftpine wireframe while checker errors remain.


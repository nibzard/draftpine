# Draftpine Specification

Draftpine's active product and technical contract is [SPECIFICATION_v3.md](./SPECIFICATION_v3.md).

The v3 model is:

```text
pages/*.json + themes/<theme>/blocks/*.html + themes/<theme>/styles.css
        -> Draftpine compiler
        -> prototype/**/*.html + assets
        -> Draftpine eval report
```

Generated output remains static HTML/CSS/JS in `prototype/`. Reports remain in `reports/`. The repository does not preserve v2 source compatibility as the default model.

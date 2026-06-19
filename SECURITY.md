# Security & trust model

Draftpine is a developer tool you run locally (or inside a coding agent) to generate and evaluate static prototypes. This document is honest about what is and isn't verified.

## How code gets onto your machine

The canonical one-paste prompt (printed by `draftpine agent`) obtains Draftpine in one of two ways:

1. **Pinned git-tag clone (default, works today).** `git clone --depth 1 --branch v3.0.0 https://github.com/nibzard/draftpine.git .draftpine`. The tag is an immutable ref. The real tamper check is `git -C .draftpine rev-parse HEAD` matching the tag — `draftpine --version` is only a smoke test (it prints a hardcoded constant and cannot detect substitution or a stale checkout).
2. **npx fast-path (once published).** `npx -y draftpine@<version>`. npm verifies the registry tarball sha512 automatically, and releases are published with `--provenance` (SLSA build attestation) from GitHub Actions.

There is **no `curl | sh` installer** and no separate download endpoint.

## Supply-chain surface you should know about

Both paths run `pnpm install`, which executes the install/lifecycle scripts of third-party dependencies (notably `esbuild`, listed in `pnpm-workspace.yaml` `onlyBuiltDependencies`). Pinning the Draftpine tag/commit pins Draftpine's own code; `--frozen-lockfile` pins dependency versions, but **neither pins transitive install-script behavior**. The one-paste prompt's final report states this plainly and points at `.draftpine/pnpm-lock.yaml` for review. Publishing to npm (which ships prebuilt `dist/`) removes the local build step for npx consumers but not the dependency-install surface for the clone path.

## Reporting

Report security issues via the repository's private vulnerability reporting (GitHub Security Advisories), not public issues.

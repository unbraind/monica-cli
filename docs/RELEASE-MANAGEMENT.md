# Release Management and CI/CD

This repository uses manual, safety-gated release management with Bun as the primary package manager and npm-compatible publish/smoke checks.

## Workflows

- `CI`: commit message lint (PR), Bun validation, Node/npm validation, packed-artifact `bunx` + `npx` smoke checks, and git-history secret scan
- `Security`: gitleaks secret scan, local history secret scan, dependency review on PRs, CodeQL on push/schedule, npm audit on push/schedule
- `Release Draft`: continuously updates draft release notes
- `Prepare Release`: validates and packages without publishing; fails if target release tag already exists
- `Publish Release`: manual npm publish workflow (environment-gated) with explicit confirmation, npm provenance, tag creation, and GitHub release publication

## Required repository settings

Configure branch protection for `master`:

1. Require pull request before merging
2. Require status checks:
   - `Validate (Bun)`
   - `Validate (Node + npm/npx)`
3. Require branches to be up to date before merging
4. Restrict force pushes (allow maintainers only if needed)
5. Require conversation resolution

## Release checklist

1. Ensure release PR is merged to `master`
2. Run `Prepare Release` workflow on `master`
3. Review generated `.tgz` and `RELEASE_PREP.md` artifact
4. Trigger `Publish Release` with:
   - `dry_run=false`
   - `confirm=PUBLISH`
5. Verify npm package metadata, pushed tag, and generated GitHub release metadata

## Required secrets

- `NPM_TOKEN` in GitHub environment `release` for package publishing

## Local release verification

Run this before cutting release tags:

```bash
bun run verify:release
```

This enforces:

1. deterministic release version rule check (based on existing `vYYYY.M.D[-N]` release tags, not commit count)
2. typecheck/build/test gates
3. `npx` smoke execution against packed artifact
4. `bunx` smoke execution against packed artifact
5. full git-history secret scan
6. full version-history policy scan (`YYYY.M.D` / `YYYY.M.D-N`, no zero-padding)

Internal release versions are already npm-safe SemVer (`YYYY.M.D` / `YYYY.M.D-N`), and publish packaging preserves that format.

## Historical commit hygiene

Before the first public release, maintainers may rewrite commit history for secret-remediation or commit-message normalization. Always create a backup bundle first:

```bash
git bundle create .backup/repo-before-history-rewrite-$(date +%Y%m%d-%H%M%S).bundle --all
```

After any rewrite, re-run `bun run verify:release` and force-push `master` only after maintainer sign-off.

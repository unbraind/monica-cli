# Release Management and CI/CD

This repository uses a change-aware automatic release pipeline modeled after
`pm-cli`. Bun is the primary development package manager. Packages are
published once to the npm registry with provenance, then the exact public
version is verified through both Node/npm (`npx`) and Bun (`bunx`). Bun does
not require a second registry publication: its default package registry is
`registry.npmjs.org`.

## Workflows

- `CI`: commit message lint (PR), Bun validation, Node/npm validation,
  `pm-changelog` drift detection, packed-artifact `bunx` + `npx` smoke checks,
  and git-history secret scan
- `Security`: gitleaks secret scan, local history secret scan, dependency review on PRs, CodeQL on push/schedule, npm audit on push/schedule
- `Release Draft`: continuously updates draft release notes
- `Prepare Release`: validates and packages without publishing; fails if target release tag already exists
- `Auto Release`: runs daily at `02:35 UTC` and supports manual dry runs. It
  compares `master` with the latest `v*` tag, skips cleanly when there are no
  commits or only `.agents/pm` tracker files changed, enforces one automatic
  release per UTC day, computes `YYYY.M.D[-N]`, regenerates the full changelog,
  runs all release gates, and atomically pushes the release commit and tag.
- `Publish Release`: runs from a pushed `v*.*.*` tag (or a manual recovery
  dispatch), validates that tag/package/changelog agree, publishes to npm with
  provenance, verifies npm metadata plus npx and bunx execution, uploads the
  tarball, and creates the GitHub release from the pm-generated changelog.

## Changelog ownership and preservation

`CHANGELOG.md` is generated data. Do not edit it by hand. Closed `pm` items are
the release-note source of truth, and git tags define the historical release
windows.

The migration to generated release notes backfilled every fact from the former
hand-maintained changelog:

- March 2026 facts carry explicit `release: v2026.3.6` or
  `release: v2026.3.6-2` metadata so creating the tracker record in July cannot
  move the fact into the wrong release.
- July unreleased facts have granular preservation items where the earlier
  roadmap item title was too broad to reproduce the release note safely.
- Generated entries link back to committed `.toon` records, while `.jsonl`
  histories retain who added or corrected the evidence.
- The previous custom `Tests` heading is normalized into keep-a-changelog
  categories, but every individual test contract remains a separately named pm
  item; no test fact is discarded.

Regenerate and verify locally:

```bash
bun run changelog:pm
bun run changelog:pm:check
```

Both commands use the pinned `@unbrained/pm-cli` and `pm-changelog`
development dependencies. Full-history generation requires a non-shallow clone
with all release tags.

## Required repository settings

Configure branch protection for `master`:

1. Require pull request before merging
2. Require status checks:
   - `Validate (Bun)`
   - `Validate (Node + npm/npx)`
3. Require branches to be up to date before merging
4. Restrict force pushes (allow maintainers only if needed)
5. Require conversation resolution
6. Leave administrator enforcement disabled when `RELEASE_PAT` belongs to a
   repository administrator. This matches pm-cli and permits only the
   administrator release identity to perform the checked atomic release push;
   the pull-request and status-check rules continue to protect other writers.

## Automatic release behavior

The release pipeline entrypoint is:

```bash
bun run release:pipeline:dry-run
```

The dry run does not change package version, changelog, commits, or tags. It
generates the pending changelog in a temporary directory and runs the build,
typecheck, lint, unit, npm-pack/npx, Bun/bunx, history-secret, and version-history
gates.

Production automation runs `bun run release:pipeline -- --push`. A production
run:

1. Requires a clean, full-history checkout.
2. Finds the latest `v*` tag and changed files after it.
3. Returns success with `no_changes_since_last_tag` when no commits exist.
4. Returns success with `tracker_only_changes_since_last_tag` when only
   `.agents/pm` files changed.
5. Returns success with `release_already_cut_today` when the daily release
   already exists. A maintainer can explicitly allow a same-day `-N` release
   from manual dispatch.
6. Sets the calendar version, synchronizes `bun.lock`, and generates the full
   changelog with a pending release section.
7. Runs `verify:release`, creates the release commit/tag, and atomically pushes
   both refs.
8. Waits for the tag-triggered `Publish Release` workflow. Scheduled failures
   create or update the `Auto Release blocked: scheduled run failed` issue;
   the next successful scheduled publication closes it.

## Manual release and recovery checklist

1. Dispatch `Auto Release` with `dry_run=true`, `push=false` and review all
   gates.
2. For an intentional release, dispatch it with `dry_run=false`, `push=true`.
3. For a second same-day release, also set `allow_same_day_release=true`.
4. If npm publication succeeded but GitHub Release creation failed, rerun
   `Publish Release` with the existing tag. Duplicate npm publication is
   detected and skipped before public verification resumes.
5. Verify the exact public version:

```bash
npm view monica-cli@<version> version dist.integrity dist.unpackedSize --json
npx --yes monica-cli@<version> --version
bunx --bun monica-cli@<version> --version
gh release view v<version> --json tagName,isDraft,isPrerelease,url
bun run release:verify-published -- --version <version>
```

## Required secrets

- `RELEASE_PAT` in GitHub environment `release`, with repository contents write
  and protected-branch bypass capability. For an administrator-owned token on
  legacy branch protection, administrator enforcement must be disabled as
  described above. A normal `GITHUB_TOKEN` push cannot trigger the downstream
  tag workflow, so production Auto Release fails fast when this secret is
  absent.
- `NPM_TOKEN` in GitHub environment `release` for npm publication. The publish
  job also grants `id-token: write` and uses `npm publish --provenance`.

## Local release verification

Run this before cutting release tags:

```bash
bun run verify:release
```

This enforces:

1. deterministic release version rule check (based on existing `vYYYY.M.D[-N]` release tags, not commit count)
2. a byte-for-byte pm-generated changelog check
3. typecheck/build/test gates
4. `npx` smoke execution against packed artifact
5. `bunx` smoke execution against packed artifact
6. full git-history secret scan
7. full version-history policy scan (`YYYY.M.D` / `YYYY.M.D-N`, no zero-padding)

Internal release versions are already npm-safe SemVer (`YYYY.M.D` / `YYYY.M.D-N`), and publish packaging preserves that format.

## Historical commit hygiene

Before the first public release, maintainers may rewrite commit history for secret-remediation or commit-message normalization. Always create a backup bundle first:

```bash
git bundle create .backup/repo-before-history-rewrite-$(date +%Y%m%d-%H%M%S).bundle --all
```

After any rewrite, re-run `bun run verify:release` and force-push `master` only after maintainer sign-off.

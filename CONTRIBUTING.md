# Contributing to monica-cli

Thanks for contributing.

## Prerequisites

- Bun `1.3.5`+
- Node.js `18+`
- Git

## Local setup

```bash
bun install
bun run typecheck
bun run build
bun test
npm run smoke:npx
bun run smoke:bunx
bun run audit:history
```

## Branch and PR flow

1. Create a branch from `master`
2. Make focused changes with tests
3. Run local quality gates:
   - `bun run typecheck`
   - `bun run build`
   - `bun test`
4. Open a PR using the template

## Commit message convention

Use Conventional Commits:

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `refactor: ...`
- `test: ...`
- `chore: ...`

PR commit messages are linted in CI.

## Versioning policy

This project uses mandatory date/release versioning:

- First release of day: `YYYY.M.D`
- Subsequent releases that day: `YYYY.M.D-N`
- No zero-padding (`2026.3.4`, not `2026.03.04`)
- `N` is the release count for that date (tags/releases, not commit count)

- Run `bun run version:set` before release/version commits
- Run `bun run version:check` to verify correctness
- Run `bun run audit:version-history` before first public release/history rewrites

## Security and secrets

- Never commit real API keys, JWTs, `.env` secrets, or private host URLs
- Run `bun dist/index.js --json audit` before pushing release-related changes
- Run `bun run audit:history` before release PRs

## Release process (maintainers)

- Prepare (no publish): GitHub Action `Prepare Release`
- Publish (manual, guarded): GitHub Action `Publish Release`

The publish workflow requires:

- `dry_run=false`
- `confirm=PUBLISH`
- `NPM_TOKEN` configured in the GitHub `release` environment

## Release readiness command

Run this locally before opening a release PR:

```bash
bun run verify:release
```

# First Public Release Checklist

Use this checklist before changing repository visibility to public and publishing the first npm release.

## 1. Security and history hygiene

1. Run `bun run audit:history` locally.
2. Run `bun dist/index.js --json audit` with a representative project setup.
3. Confirm no real credentials exist in tracked files or commit history.
4. If sensitive data was ever exposed outside the repo, rotate/revoke it before release.

## 2. Repository settings (GitHub)

1. Enable branch protection on `master`:
   - Require pull request before merging
   - Require status checks: `Validate (Bun)`, `Validate (Node + npm/npx)`
   - Require branches to be up to date
   - Require conversation resolution
   - Leave administrator enforcement disabled when the release PAT belongs to
     a repository administrator, matching the pm-cli release-push model
2. Enable secret scanning and push protection (GitHub Advanced Security settings).
3. Ensure `CODEOWNERS`, issue templates, and PR template are present and current.

## 3. Repository secrets and permissions

1. Add `NPM_TOKEN` to the GitHub `release` environment secrets (scoped to package publish only).
2. Add `RELEASE_PAT` to the same environment with contents-write and the
   protected-branch bypass needed for the scheduled release commit/tag push.
3. Keep default `GITHUB_TOKEN` permissions minimal (`contents: read` by default).
4. Ensure publish workflow has `id-token: write` for npm provenance.

## 4. Version and changelog policy

1. Confirm all release-note facts are represented by closed `pm` items and run
   `bun run changelog:pm` followed by `bun run changelog:preservation:check`.
2. Use version format:
   - First release of day: `YYYY.M.D`
   - Subsequent releases same day: `YYYY.M.D-N`
   - No zero-padding (`2026.3.4`, not `2026.03.04`)
   - `N` counts releases/tags for the date, not commits
3. Run `bun run version:set` before the release/version commit.
4. Run `bun run version:check` after commit creation.
5. Run `bun run audit:version-history` after any history rewrite.

## 5. Local quality gates

Run full local verification:

```bash
bun run verify:release
npm run typecheck
npm run build
npm test
npm run smoke:npx
```

## 6. CI/CD release flow

1. Trigger `Auto Release` with `dry_run=true` and `push=false`.
2. Review the complete dry-run gate output.
3. Trigger `Auto Release` with `dry_run=false` and `push=true`.
4. Verify npm metadata, npx execution, bunx execution, and the final GitHub
   release. Use the manual `Publish Release` tag input only for recovery of an
   existing tag.

## 7. Post-release contributor readiness

1. Confirm `CONTRIBUTING.md` instructions are still accurate.
2. Confirm docs links in `README.md` and `docs/README.md` are valid.
3. Confirm `bun run build` output includes `dist/index.js` and CLI entry points.

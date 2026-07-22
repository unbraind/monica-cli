# Changelog

## 2026.7.22 - 2026-07-22

### Added

- Complete Monica 4.x API parity and resilient instance diagnostics ([monica-api-4x-parity](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/features/monica-api-4x-parity.toon))

### Fixed

- Migrate Release Drafter category configuration before legacy removal ([monica-release-drafter-categories](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/issues/monica-release-drafter-categories.toon))
- Classify Monica server infrastructure failures with actionable diagnostics ([monica-server-diagnostics](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/issues/monica-server-diagnostics.toon))

### Security

- Prevent configuration secrets from reaching logging sinks ([monica-config-output-secret-sink](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/issues/monica-config-output-secret-sink.toon))

### Other

- Deliver Monica stable 4.x API parity ([monica-api-4x-parity-plan](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/plans/monica-api-4x-parity-plan.toon))

## 2026.7.21 - 2026-07-21

### Added

- Automate release publication after repository changes ([monica-auto-release](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/features/monica-auto-release.toon))
- Added coverage floors for the Vitest 4 coverage baseline ([monica-changelog-coverage-floors](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-changelog-coverage-floors.toon))
- Added explicit Conventional Commit configuration and local commit-lint tooling ([monica-changelog-conventional-commits](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-changelog-conventional-commits.toon))
- Added strict repository-local pm governance with committed settings, schema, bundled packages, roadmap items, TOON state, and JSONL history ([monica-changelog-pm-governance](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-changelog-pm-governance.toon))

### Changed

- Made Node and web platform types explicit for TypeScript 6 and preserved original errors as cause when wrapping request or fallback failures ([monica-changelog-types-and-causes](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-changelog-types-and-causes.toon))
- Upgraded checkout, setup-node, upload-artifact, CodeQL, dependency review, release-drafter, and GitHub release Actions to Node 24-capable majors with an immutable Gitleaks 3 pin ([monica-changelog-actions-matrix](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-changelog-actions-matrix.toon))
- Switched Dependabot to native Bun support, grouped compatible minor and patch updates, and held TypeScript 7 and Node type majors beyond the supported toolchain ([monica-changelog-dependabot-policy](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-changelog-dependabot-policy.toon))
- Raised the supported Node.js floor to 22.13 and the Bun floor to 1.3.11 ([monica-changelog-runtime-floors](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-changelog-runtime-floors.toon))
- Upgraded the runtime and development toolchain including Commander 15, ESLint 10, TypeScript 6, Vitest 4, and the matching coverage provider ([monica-changelog-toolchain-versions](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-changelog-toolchain-versions.toon))

### Fixed

- Validate prepared release changelog in release context ([monica-prepared-changelog-check](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/issues/monica-prepared-changelog-check.toon))
- Configure RELEASE_PAT for protected-master auto-release pushes ([monica-release-pat-secret](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/issues/monica-release-pat-secret.toon))
- Simplified pagination termination to remove a stale assignment exposed by ESLint 10 ([monica-changelog-pagination-cleanup](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-changelog-pagination-cleanup.toon))
- Added formatter escaping and settings permissions regression coverage ([monica-changelog-regression-coverage](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-changelog-regression-coverage.toon))
- Fixed TOON and Markdown output ambiguity for backslashes next to quotes or table delimiters ([monica-output-escaping](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/issues/monica-output-escaping.toon))
- Fixed generated Dependabot commit bodies failing body line-length rules while retaining Conventional Commit subject validation ([monica-dependabot-commitlint](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/issues/monica-dependabot-commitlint.toon))
- Fixed Dependabot updates so bun.lock is maintained ([monica-bun-dependabot](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/issues/monica-bun-dependabot.toon))

### Security

- Verified zero production vulnerabilities through both Bun and isolated npm audit paths ([monica-changelog-zero-production-vulns](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-changelog-zero-production-vulns.toon))
- Upgrade Gitleaks action to Node 24 generation ([monica-gitleaks-node24](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-gitleaks-node24.toon))
- Security and dependency modernization tranche ([monica-security-modernization](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/milestones/monica-security-modernization.toon))
- Execute monica-cli security modernization ([monica-remediation-plan](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/plans/monica-remediation-plan.toon))
- Fixed settings saves so pre-existing files and directories regain restrictive POSIX modes ([monica-settings-permissions](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/issues/monica-settings-permissions.toon))
- Upgrade GitHub Actions to Node 24 generations ([monica-actions-node24](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-actions-node24.toon))
- Removed the critical Vitest 1.6 vulnerability GHSA-5xrq-8626-4rwp and CVE-2026-47429 ([monica-vulnerable-vitest](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/issues/monica-vulnerable-vitest.toon))

### Other

- Integrate remaining current GitHub Actions majors ([monica-actions-remaining-majors](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-actions-remaining-majors.toon))
- Adopt current Bun and Node 22 toolchain with constrained TypeScript ([monica-toolchain-decision](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/decisions/monica-toolchain-decision.toon))

## 2026.3.6-2 - 2026-03-06

### Added

- Expanded coverage for optional prompt fallback, accept, decline, and failure paths ([monica-hist-2026-3-6-2-prompt-tests](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-2-prompt-tests.toon))
- Expanded coverage for startup prompt-state persistence and CLI skip guards ([monica-hist-2026-3-6-2-startup-tests](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-2-startup-tests.toon))
- Expanded coverage for the info missing-subcommand guidance output contract ([monica-hist-2026-3-6-2-info-tests](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-2-info-tests.toon))

### Changed

- Improved monica info missing-subcommand UX with structured guidance, subcommand descriptions, and an example invocation ([monica-hist-2026-3-6-2-info-ux](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-2-info-ux.toon))

## 2026.3.6 - 2026-03-06

### Added

- Added paginated formatter field-filtering parity coverage including raw output behavior ([monica-hist-2026-3-6-paginated-test](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-paginated-test.toon))
- Added runtime field-filtering coverage across JSON, YAML, table, Markdown, and TOON formats ([monica-hist-2026-3-6-runtime-format-test](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-runtime-format-test.toon))
- Added strict lint coverage for program, global options, config commands, TOON formatting, and runtime fields ([monica-hist-2026-3-6-strict-lint-scope](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-strict-lint-scope.toon))
- Added project ESLint configuration and strict-tier lint mode ([monica-hist-2026-3-6-eslint](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-eslint.toon))
- Added runtime field-selection context so field filtering applies consistently across output renderers and command levels ([monica-hist-2026-3-6-field-context](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-field-context.toon))
- Added strict CLI input parsers for output format, pagination, and field selection ([monica-hist-2026-3-6-input-parsers](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-input-parsers.toon))

### Changed

- Updated strict lint rules to permit separate value and type imports while enforcing duplicate import hygiene ([monica-hist-2026-3-6-import-lint](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-import-lint.toon))
- Centralized field parsing and removed redundant output-format parsing in pre-action handling ([monica-hist-2026-3-6-parser-centralization](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-parser-centralization.toon))
- Hardened runtime field-selection lifecycle to reset global override state at command boundaries and prevent cross-command leakage ([monica-hist-2026-3-6-fields-lifecycle](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-fields-lifecycle.toon))
- Improved field filtering for list, get, and paginated JSON and YAML outputs ([monica-hist-2026-3-6-fields-output](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-fields-output.toon))
- Updated development documentation with the staged lint-hardening workflow and strict module rollout guidance ([monica-hist-2026-3-6-lint-docs](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-lint-docs.toon))
- Updated Bun and npm CI validation to run linting before build and test ([monica-hist-2026-3-6-ci-lint](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-ci-lint.toon))
- Updated verify:release and prepublishOnly release gates to include linting ([monica-hist-2026-3-6-release-lint](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-release-lint.toon))

### Fixed

- Added regression coverage for field parsing and formatter field-filtering behavior ([monica-hist-2026-3-6-fields-test](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-fields-test.toon))
- Added regression coverage for invalid page and limit handling ([monica-hist-2026-3-6-pagination-test](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-pagination-test.toon))
- Added regression coverage for invalid output-format handling ([monica-hist-2026-3-6-format-test](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-format-test.toon))
- Added regression coverage for info missing-subcommand behavior ([monica-hist-2026-3-6-info-test](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-info-test.toon))
- Made config set and setup default-format parsing reject invalid formats instead of silently coercing ([monica-hist-2026-3-6-default-format-validation](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-default-format-validation.toon))
- Made invalid page and limit values fail fast instead of being silently normalized by API behavior ([monica-hist-2026-3-6-pagination-validation](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-pagination-validation.toon))
- Made invalid output format values fail fast instead of silently falling back ([monica-hist-2026-3-6-format-validation](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-format-validation.toon))
- Made monica info fail with an explicit actionable error when no subcommand is provided ([monica-hist-2026-3-6-info-error](https://github.com/unbraind/monica-cli/blob/master/.agents/pm/chores/monica-hist-2026-3-6-info-error.toon))

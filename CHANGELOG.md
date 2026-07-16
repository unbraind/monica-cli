# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Added

- Added strict repository-local `pm` governance with committed project settings,
  schema, bundled packages, detailed roadmap items, `.toon` state, and `.jsonl`
  history.
- Added explicit Conventional Commit configuration and local commit-lint tooling.
- Added regression coverage for formatter escaping and settings permission repair.
- Added coverage floors for the Vitest 4 coverage baseline.

### Changed

- Upgraded the runtime and development toolchain, including Commander 15,
  ESLint 10, TypeScript 6, and Vitest 4 with its matching coverage provider.
- Raised the supported Node.js floor to 22.13 and the Bun floor to 1.3.11.
- Switched Dependabot from npm lockfile semantics to native Bun support and
  grouped compatible minor/patch updates, with scoped holds for TypeScript 7
  and Node type majors that exceed the supported toolchain.
- Upgraded checkout, setup-node, upload-artifact, CodeQL, and release-drafter
  Actions to their Node 24-capable major versions, including Gitleaks 3 for
  secret scanning.
- Made Node and web platform types explicit for TypeScript 6 and preserved
  original errors as `cause` when wrapping request or fallback failures.

### Fixed

- Fixed Dependabot PRs failing because `bun.lock` was not updated.
- Fixed generated Dependabot commit bodies failing the body line-length rule
  while retaining Conventional Commit subject validation.
- Fixed TOON and Markdown output ambiguity when values contain backslashes next
  to quotes or table delimiters.
- Fixed settings saves leaving pre-existing files or directories with permissive
  POSIX modes.
- Simplified pagination termination to remove a stale assignment exposed by
  ESLint 10.

### Security

- Removed the critically vulnerable Vitest 1.6 dependency reported as
  GHSA-5xrq-8626-4rwp / CVE-2026-47429.
- Verified zero production vulnerabilities through both Bun and isolated npm
  audit paths.

## [2026.3.6-2] - 2026-03-06

### Changed

- Improved `monica info` missing-subcommand UX with structured guidance, subcommand descriptions, and an example invocation.

### Tests

- Expanded coverage for:
  - `info` missing-subcommand guidance output contract
  - startup prompt-state persistence and CLI skip guards
  - optional prompt fallback/accept/decline/failure paths

## [2026.3.6] - 2026-03-06

### Added

- Added strict CLI input parsers for:
  - output format (`--format`)
  - pagination (`--page`, `--limit`)
  - field selection (`--fields`)
- Added runtime field-selection context so `--fields` applies consistently across output renderers and command levels.
- Added project ESLint setup (`eslint.config.cjs`) and strict-tier lint mode (`bun run lint:strict`).
- Added strict lint coverage for:
  - `src/program.ts`
  - `src/commands/global-options.ts`
  - `src/commands/config*.ts`
  - `src/formatters/toon.ts`
  - `src/formatters/runtime-fields.ts`

### Changed

- Updated release quality gates to include linting in:
  - `verify:release`
  - `prepublishOnly`
- Updated CI workflows (Bun and npm validation jobs) to run linting before build/test.
- Updated development documentation with staged lint-hardening workflow and strict module rollout guidance.
- Improved formatter behavior so `--fields` filtering now consistently affects:
  - list outputs
  - get outputs
  - paginated JSON/YAML output payloads
- Hardened runtime field-selection lifecycle to reset global override state at command execution boundaries, preventing cross-command leakage in long-lived processes.
- Simplified global parser application by centralizing `--fields` parsing and removing redundant `--format` re-parse in pre-action handling.
- Updated strict lint config to permit separate value/type imports while still enforcing duplicate import hygiene.

### Fixed

- `monica info` now fails with an explicit, actionable error when no subcommand is provided.
- Invalid `--format` values now fail fast instead of silently falling back.
- Invalid pagination values now fail fast instead of being silently normalized by API behavior.
- `config set --default-format` and setup default-format parsing now reject invalid formats instead of silently coercing.

### Tests

- Added regression coverage for:
  - `info` missing subcommand behavior
  - invalid `--format` handling
  - invalid `--page` / `--limit` handling
  - `--fields` parsing and formatter field filtering behavior
  - runtime field filtering across `json`, `yaml`, `table`, `md`, and `toon`
  - paginated formatter filtering parity (including `--raw` behavior with runtime fields)

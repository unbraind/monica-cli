# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- No changes yet.

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

# Monica CLI Documentation

A comprehensive CLI interface for the Monica CRM API, optimized for AI agents and developers.

## Overview

Monica CLI provides complete access to all Monica CRM features through a command-line interface. It supports five output formats:

- **toon** (default): Hierarchical, human-readable format optimized for agents
- **json**: Standard JSON output for programmatic processing
- **yaml**: Structured text output for CI/CD, config-style workflows, and LLM-friendly snapshots
- **table**: ASCII table format for quick scanning
- **md**: Markdown table format for reports, documentation, and CI/CD pipelines

## Quick Links

| Document | Description |
|----------|-------------|
| [Installation](./INSTALLATION.md) | How to install and set up Monica CLI |
| [Configuration](./CONFIGURATION.md) | Environment variables and configuration options |
| [Commands](./COMMANDS.md) | Complete command reference |
| [API Reference](./API.md) | TypeScript API documentation |
| [Development](./DEVELOPMENT.md) | Guide for contributors |
| [Output Schemas](./OUTPUT-SCHEMAS.md) | Machine-readable output contracts for automation |
| [Security Audit](./SECURITY-AUDIT.md) | Secret hygiene and pre-push safety checks |
| [Instance Compatibility](./INSTANCE-COMPATIBILITY.md) | Endpoint support detection across Monica installs |
| [Release Management](./RELEASE-MANAGEMENT.md) | CI/CD pipelines, branch protection, and release checklist |
| [First Public Release Checklist](./FIRST-RELEASE-CHECKLIST.md) | Final go-live checklist for first npm/GitHub release |
| [Changelog](../CHANGELOG.md) | Release notes history (`Unreleased` until first public release) |

## Features

- **Broad API Coverage**: Monica CRM resources are implemented with capability detection for instance/version differences
- **Capability Discovery**: Detect endpoint availability on your Monica instance with `monica info capabilities`
- **Agent Planning Assist**: Derive an executable command allow-list with `monica info supported-commands`
- **Agent Context Export**: Generate sanitized planning context with `monica info agent-context`
- **Deterministic Versioning**: Enforced semver-safe `YYYY.M.D` (first release of day) / `YYYY.M.D-<daily-release-number>` versioning via bun scripts and release tags (no zero-padding; release-count-based)
- **Release Quality Gate**: `bun run verify:release` validates typecheck/build/tests, packed `npx`/`bunx` execution, and history secret scanning
- **Command Graph Export**: Emit a machine-readable CLI command graph with `monica info command-catalog`
- **Output Schema Registry**: Discover machine contracts with `monica schemas list` and `monica schemas get <id>`
- **Secret Hygiene Audit**: Run `monica --json audit` before pushing to detect tracked secrets and unsafe config perms
- **Config Diagnostics**: Run `monica --json config doctor` for read-only safety, settings permissions, cache freshness, and connectivity checks
- **API Coverage Research**: Emit endpoint/resource inventory with `monica --json api-research summary --instance-aware` (source select with `--source auto|api|monica|<path>`)
- **Coverage Scorecard**: Use `monica --json api-research coverage --instance-aware` for compact mapped/support percentages, embedded `readOnlyActionPlan`, and deterministic next-command recommendations
- **Coverage CI Gates**: Use `api-research coverage --fail-on-unmapped` and `--fail-on-unsupported` to enforce machine-checkable readiness in CI/agent pipelines (non-zero exit `2` with `gate` payload context)
- **Instance Filtered API Planning**: Use `--supported-only` / `--unsupported-only` with `api-research summary --instance-aware` to build deterministic allow/deny plans for agents
- **CLI Mapping Gap Detection**: Use `api-research summary` `cliCoverage` + per-resource `cliMapping` to identify Monica API resources not yet mapped to a CLI command
- **Backlog Extraction Filters**: Use `api-research summary --mapped-only` / `--unmapped-only` for deterministic CLI parity backlogs in CI/agent workflows
- **Scoped Backlog/Snapshot Filters**: Use the same filters directly on `api-research backlog` and `api-research snapshot` (`--resource`, `--mapped-only`, `--unmapped-only`, and instance support filters with `--instance-aware`)
- **Deterministic Backlog Output**: Use `monica --json api-research backlog` to emit prioritized parity tasks (`missing-cli-mapping`, optional `instance-unsupported`, including capability-only command gaps with `--instance-aware`)
- **Actionable Backlog Hints**: `api-research backlog` now includes per-item `recommendedAction` plus `agentActions[]` with safe fallback/planning commands for autonomous workflows
- **Flattened Agent Action Plan**: Use `monica --json api-research actions` for a direct, schema-backed command queue plus deduplicated `commands[]` for orchestration pipelines
- **Endpoint Probe Matrix**: Validate documented `GET` endpoint support with `monica --json api-research probe` for capability-aware agent planning
- **One-Shot Research Snapshot**: Use `monica --json api-research snapshot` to combine summary, backlog, and probe data in one schema-backed payload
- **Type-Safe**: Written in TypeScript with comprehensive type definitions
- **Agent-Optimized**: Default output format designed for AI agent consumption
- **Help UX Quality Gates**: Automated tests and full command-tree sweeps ensure every command supports detailed `--help` with inherited global flag guidance
- **Help E2E Audit**: Run `bun run test:e2e:help` to execute `monica [command] --help` across the full command catalog and fail on missing usage/global-option guidance
- **Pagination Support**: Automatic pagination with `--all` flag
- **Multiple Output Formats**: toon, json, yaml, table, and md formats
- **Search & Filter**: Built-in search and filtering capabilities

## Quick Start

```bash
# Install
bun install -g monica-cli

# Configure (interactive wizard)
monica setup

# Use
monica contacts list
monica contacts get 1
monica --json activities list --limit 5
```

## Architecture

```
monica-cli/
├── src/
│   ├── index.ts           # CLI entry point (boot + parse only)
│   ├── program.ts         # Reusable CLI program builder
│   ├── api/               # API client modules
│   │   ├── client.ts      # HTTP client
│   │   ├── contacts.ts    # Contacts API
│   │   └── ...            # Other resource APIs
│   ├── commands/          # CLI commands
│   │   ├── contacts.ts    # Contact commands
│   │   └── ...            # Other commands
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Utility functions
│   │   └── settings.ts    # Configuration management
│   └── formatters/        # Output formatters
│       └── toon.ts        # Toon format implementation
├── tests/                 # Test files
└── docs/                  # Documentation
```

## Support

- **Issues**: Report bugs and request features on GitHub
- **Monica API Docs**: https://www.monicahq.com/api

## License

MIT

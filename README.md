# monica-cli

CLI interface for Monica CRM API - optimized for agents.

[![npm version](https://img.shields.io/npm/v/monica-cli.svg)](https://www.npmjs.com/package/monica-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Documentation

Full documentation is available in the [docs](./docs/README.md) directory:

- [Installation Guide](./docs/INSTALLATION.md)
- [Configuration](./docs/CONFIGURATION.md)
- [Command Reference](./docs/COMMANDS.md)
- [API Reference](./docs/API.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Output Schemas](./docs/OUTPUT-SCHEMAS.md)
- [Instance Compatibility](./docs/INSTANCE-COMPATIBILITY.md)
- [Security Audit](./docs/SECURITY-AUDIT.md)
- [Release Management & CI/CD](./docs/RELEASE-MANAGEMENT.md)
- [First Public Release Checklist](./docs/FIRST-RELEASE-CHECKLIST.md)
- [Changelog](./CHANGELOG.md)
- [Contributing](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)

## Installation

Using [bun](https://bun.sh) (recommended):

```bash
bun install -g monica-cli
```

Run without global install:

```bash
bunx monica --help
npx monica --help
```

Or from source:

```bash
git clone https://github.com/unbraind/monica-cli.git
cd monica-cli
bun install
bun run build
bun link
```

## Configuration

Use global settings (recommended):

```bash
monica setup
```

This starts an interactive wizard and stores settings in `~/.monica-cli/settings.json` (not in your repo).
`monica setup` is a direct alias for `monica config setup`.
By default, setup keeps `read-only` safety mode enabled unless `--read-write` is explicitly provided.
Setup also persists `defaultFormat` (`toon` by default) so you can set a global output mode for automation.
Settings should use `readOnlyMode` (canonical key). Legacy `readOnly` is still accepted and normalized automatically.
Optional `user-email`/`user-password` prompts are only shown when those values already exist or are explicitly provided.
Setup validates URL/email/key safety (`api-key` must be non-empty without whitespace; `user-password` requires `user-email`).
For automation you can also run:

```bash
monica setup --api-url http://your-monica-instance/api --api-key your-api-key --non-interactive
monica setup --api-url http://your-monica-instance/api --api-key your-api-key --default-format json --non-interactive
```

Validate configuration without writing to disk (CI/agent-safe):

```bash
monica setup --api-url http://your-monica-instance/api --api-key your-api-key --non-interactive --dry-run
```

By default, setup performs a read-only capability probe and caches results for instance-aware agent commands (`info capabilities`, `info supported-commands`, `agent-tools ... --instance-aware`). Use `--skip-capability-probe` to disable it.

If you pass only the instance host (for example `http://your-monica-instance`), setup normalizes it to `.../api`.
If `gh` is installed and authenticated, `config setup`/`config set` will ask to star the repo until starred.

## Versioning

Release versions use a date + daily release number scheme:

- Format: `YYYY.M.D` for the first release of the day, then `YYYY.M.D-N`
- No zero-padding is allowed (for example `2026.3.4`, not `2026.03.04`)
- `N`: release sequence number for that date (release tags, not commit count)
- First release example: `2025.12.31`
- Example: `2025.12.31-2` = 2nd release on 2025-12-31

Commands:

```bash
bun run version:set    # set next release version from existing release tags
bun run version:check  # verify package version matches next release number
bun run audit:version-history # verify all historical package versions follow the same rule
```

## Release Readiness

Run the full pre-release gate locally:

```bash
bun run verify:release
```

This validates type safety, build, tests, packed-artifact execution via both `npx` and `bunx`, full git-history secret scanning, and version-history policy compliance.

## Usage

```bash
monica [options] [command]
```

### Global Options

- `-f, --format <format>` - Output format (toon|json|yaml|table|md); aliases: `yml` -> `yaml`, `markdown` -> `md` (default: saved `defaultFormat`, fallback `toon`)
- `--json` - Output as JSON (shorthand for --format json)
- `--yaml` - Output as YAML (shorthand for --format yaml)
- `--yml` - Output as YAML (shorthand for --format yaml)
- `--table` - Output as table (shorthand for --format table)
- `--md` - Output as Markdown (shorthand for --format md)
- `--markdown` - Output as Markdown (shorthand for --format md)
- `--raw` - Output raw JSON data only (for paginated responses this emits only `data[]`)
- `-q, --quiet` - Suppress non-essential output (dotenv logs)
- `--fields <fields>` - Comma-separated list of fields to display
- `--request-timeout-ms <ms>` - Per-request timeout override for this invocation
- `-v, --verbose` - Enable verbose output
- `-h, --help` - Display help for command
- `--read-only` safety mode can be enabled via `monica config setup --read-only` or `monica config set --read-only`

### Quick Examples

```bash
# List contacts
monica contacts list

# Get a contact
monica contacts get 1

# Check endpoint support on your Monica server version
monica info capabilities

# Force a fresh capability probe (skip cache)
monica info capabilities --refresh

# Build a supported command allow-list for agent workflows
monica info supported-commands

# Build an unsupported command deny-list with endpoint/status diagnostics
monica --json info unsupported-commands

# Export sanitized agent execution context
monica --json info agent-context

# Generate deterministic schema example payloads for mocks/tests/agents
monica --json schemas sample info-capabilities

# Export full machine-readable command graph for agent planners
monica --json info command-catalog

# Summarize Monica API resource/endpoint coverage from local reference docs
monica --json api-research summary --instance-aware
monica --json api-research coverage --instance-aware
monica --json api-research coverage --instance-aware --fail-on-unsupported
monica --json api-research coverage --fail-on-unmapped
monica --json api-research summary --source monica --with-endpoints
monica --json api-research summary --source monica --unmapped-only
monica --json api-research summary --source monica --mapped-only
monica --json api-research backlog
monica --json api-research backlog --instance-aware
monica --json api-research backlog --instance-aware --unsupported-only
monica --json api-research backlog --mapped-only
monica --json api-research actions --instance-aware
monica --json api-research actions --instance-aware --read-only-only
monica --json api-research probe --resource contacts
monica --json api-research probe --include-parameterized --id-replacement 1
monica --json api-research snapshot --instance-aware
monica --json api-research snapshot --instance-aware --unsupported-only

# Export tool payloads for LLM runtimes
monica --json agent-tools catalog
monica --json agent-tools openai
monica --json agent-tools anthropic
monica --json agent-tools safe-commands
monica --json agent-tools safe-commands --instance-aware
monica --json agent-tools mcp-tools
monica --json agent-tools mcp-tools --instance-aware

# Discover output contracts for strict automation workflows
monica --json schemas list
monica --json schemas get info-agent-context
monica --json schemas get info-unsupported-commands
monica --json schemas get agent-tools-safe-commands
monica --json schemas get search-results
monica --json schemas get audit-report
monica --json schemas get api-research-summary
monica --json schemas get api-research-backlog
monica --json schemas get api-research-actions
monica --json schemas get api-research-coverage
monica --json schemas get api-research-probe
monica --json schemas get api-research-snapshot
cat payload.json | monica --json schemas validate config-test
cat payload.yaml | monica --json schemas validate config-test --input-format yaml

# Emit only raw data rows for jq-friendly pipelines
monica --raw contacts list --limit 50 | jq '.[].id'
monica --raw search "john" --type contacts --limit 10 | jq '.[].id'

# Fail fast in CI if any selected search backend fails
monica --json search "john" --type all --strict

# Raise request timeout for slower Monica instances
monica --request-timeout-ms 45000 contacts list --limit 50

# Run a local secret hygiene audit before commit/push
monica --json audit

# Create a contact
monica contacts create --first-name "John" --gender-id 1

# Add a note
monica notes create --body "Important note" --contact-id 1

# Add an activity
monica activities create --summary "Meeting" --happened-at "2024-01-15" --activity-type-id 1 --contact-id 1
```

## Commands Overview

| Command | Description |
|---------|-------------|
| `contacts` | Manage contacts |
| `activities` | Manage activities |
| `notes` | Manage notes |
| `tasks` | Manage tasks |
| `reminders` | Manage reminders |
| `tags` | Manage tags |
| `companies` | Manage companies |
| `calls` | Manage calls |
| `gifts` | Manage gifts |
| `debts` | Manage debts |
| `addresses` | Manage addresses |
| `journal` | Manage journal entries |
| `groups` | Manage groups |
| `documents` | Manage documents |
| `photos` | Manage photos |
| `occupations` | Manage occupations |
| `conversations` | Manage conversations |
| `relationships` | Manage relationships |
| `pets` | Manage pets |
| `user` | User information |
| `compliance` | View compliance terms and policies |
| `genders` | Manage genders |
| `countries` | List countries |
| `currencies` | List currencies |
| `activity-types` | Manage activity types |
| `activity-type-categories` | Manage activity type categories |
| `contact-field-types` | Manage contact field types |
| `contact-fields` | Manage contact fields |
| `audit-logs` | List audit logs |
| `setup` | First-run setup wizard (alias for `config setup`) |
| `config` | Manage CLI configuration |
| `search` | Search across contacts and resources |
| `bulk` | Bulk operations |
| `info` | Quick reference commands |
| `schemas` | Output schema registry for automation |
| `agent-tools` | Export agent/LLM integration schemas |
| `audit` | Local security and secret-hygiene audit |
| `api-research` | API resource/endpoint coverage research for agents |

## Output Formats

### Toon (default)

A structured, human-readable format optimized for agents:

```
── [0] ──
  id: 1
  first_name: "John"
  last_name: "Doe"
  gender: "male"
```

### JSON

Standard JSON output for programmatic processing.

### Table

Tabular format for quick scanning:

```
id | first_name | last_name | gender
---+------------+-----------+-------
1  | John       | Doe       | male
```

## API Coverage

This CLI implements broad Monica CRM coverage (endpoint availability depends on your Monica server version):

- **Contacts**: Full CRUD + search, logs, career, contact fields
- **Activities**: Full CRUD
- **Notes**: Full CRUD
- **Tasks**: Full CRUD + complete
- **Reminders**: Full CRUD
- **Tags**: Full CRUD + set/unset/clear/contacts
- **Companies**: Full CRUD
- **Calls**: Full CRUD
- **Gifts**: Full CRUD
- **Debts**: Full CRUD
- **Addresses**: Full CRUD
- **Journal**: Full CRUD
- **Groups**: Full CRUD
- **Documents**: List, Get, Delete
- **Photos**: List, Get, Delete
- **Occupations**: Full CRUD
- **Conversations**: Full CRUD
- **Relationships**: Full CRUD + types/groups
- **Pets**: Full CRUD
- **Genders**: Full CRUD
- **Countries**: List
- **Currencies**: List, Get
- **Activity Types**: Full CRUD
- **Activity Type Categories**: Full CRUD
- **Contact Field Types**: Full CRUD
- **Contact Fields**: Full CRUD
- **Audit Logs**: List
- **User**: Get, Compliance

## Development

> **Note:** This project uses [bun](https://bun.sh) as the primary package manager and runtime.

```bash
bun run build       # Compile TypeScript
bun run build:watch # Watch mode
bun run dev         # Run in development mode
bun test            # Run tests
bun run test:e2e:readonly # Live read-only E2E against configured Monica instance
bun run test:e2e:help # Full command-tree --help audit via real monica binary
bun run test:watch  # Watch mode
bun run typecheck   # Type check without emitting
```

`bun run test:e2e:readonly` also writes a sanitized report to `~/.monica-cli/cache/e2e-readonly-last.json` for agent/CI automation and now validates default `toon` plus `json`, `yaml`, `table`, and `md` output structures.
`bun run test:e2e:help` executes `monica [command] --help` for every command in the catalog and fails if usage/global inherited options guidance is missing.

## License

MIT

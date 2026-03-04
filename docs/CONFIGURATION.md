# Configuration Guide

## Configuration Methods

Monica CLI supports three configuration methods, in order of priority:

1. **Global Settings File** (recommended) - `~/.monica-cli/settings.json`
2. **Environment Variables** - `.env` file or shell environment
3. **Programmatic Configuration** - `setConfig()` function

## Global Settings File (Recommended)

Create a settings file at `~/.monica-cli/settings.json`:

```bash
mkdir -p ~/.monica-cli
cat > ~/.monica-cli/settings.json << 'EOF'
{
  "apiUrl": "https://your-instance.com/api",
  "apiKey": "your-jwt-token",
  "defaultFormat": "toon",
  "readOnlyMode": true
}
EOF
chmod 600 ~/.monica-cli/settings.json
```

This method keeps your credentials out of your project directory and prevents accidental commits to version control.

**Security:** The file is created with `chmod 600` so only you can read it.
The canonical read-only key is `readOnlyMode`. For backward compatibility, legacy `readOnly` is accepted and normalized to `readOnlyMode`.

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONICA_API_URL` | Your Monica instance API URL | `https://monica.example.com/api` |
| `MONICA_API_KEY` | JWT authentication token | `eyJ0eXAiOi...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONICA_USER_EMAIL` | User email for authentication | - |
| `MONICA_USER_PASSWORD` | User password for authentication | - |
| `MONICA_DEFAULT_FORMAT` | Default output format (`toon|json|yaml|table|md`) | value from `~/.monica-cli/settings.json` or `toon` |
| `MONICA_READ_ONLY` | Force read-only mode (`true/false` or `1/0`) | value from `~/.monica-cli/settings.json` |
| `MONICA_MAX_GET_RETRIES` | Max retries for GET requests on HTTP 429 | `2` |
| `MONICA_REQUEST_TIMEOUT_MS` | Per-request timeout in milliseconds | `15000` |
| `MONICA_CAPABILITY_CACHE_TTL_SECONDS` | Capability probe cache TTL in seconds | `300` |
| `MONICA_CLI_HOME` | Override Monica CLI home directory (settings/cache root) | `~/.monica-cli` |

## Configuration File

Create a `.env` file in your project directory or home directory:

```env
MONICA_API_URL=https://your-instance.com/api
MONICA_API_KEY=your-jwt-token
```

**Warning:** Don't commit `.env` files to version control!

Run a local pre-push audit:

```bash
monica --json audit
```

## Configuration Commands

### Quick Setup

Configure the CLI with your API credentials:

```bash
monica setup
```

This launches an interactive wizard when values are missing.
`monica setup` is a top-level alias for `monica config setup`.
Both `monica setup --help` and `monica config setup --help` include setup-behavior guidance and inherited global flags.
If read/write mode is not explicitly chosen, setup defaults to `read-only` for safer production usage.
If `gh` CLI is installed and authenticated, setup also asks whether to star the project repository once, and will keep asking on setup/set runs until starred.
Sensitive interactive prompts (`api-key`, `user-password`) are hidden from terminal echo.
To reduce accidental secret handling, optional `user-email`/`user-password` prompts are only shown when those fields already exist (saved/env) or are explicitly provided via flags.

Non-interactive setup for automation:

```bash
monica setup --api-url https://your-instance.com/api --api-key your-jwt-token --non-interactive
monica setup --api-url https://your-instance.com/api --api-key your-jwt-token --default-format yaml --non-interactive
```

Validate setup without persisting (recommended for CI/agent preflight checks):

```bash
monica setup --api-url https://your-instance.com/api --api-key your-jwt-token --non-interactive --dry-run
```

Setup probes Monica capabilities by default (read-only `GET` probes) and writes cache metadata to `~/.monica-cli/cache/capabilities.json` so agent-aware commands can immediately use instance support data.
Disable this when desired:

```bash
monica setup --api-url https://your-instance.com/api --api-key your-jwt-token --non-interactive --skip-capability-probe
```

In non-interactive mode, missing setup values also fall back to `MONICA_*` environment variables:
- `MONICA_API_URL`
- `MONICA_API_KEY`
- `MONICA_USER_EMAIL`
- `MONICA_USER_PASSWORD`
- `MONICA_DEFAULT_FORMAT`
- `MONICA_READ_ONLY`

Precedence is deterministic: `CLI flags > existing saved config > MONICA_* env`.

Validation rules enforced by setup:
- `api-url` must start with `http://` or `https://`
- `api-key` must be non-empty and contain no whitespace
- `user-email` must be a valid email if provided
- `user-password` requires `user-email`

Force write-enabled mode during setup:

```bash
monica setup --api-url https://your-instance.com/api --api-key your-jwt-token --read-write --non-interactive
```

If you pass a base host without `/api`, setup automatically normalizes it:

```bash
monica setup --api-url https://your-instance.com --api-key your-jwt-token --non-interactive
# saved as https://your-instance.com/api
```

Set values directly:

```bash
monica config set --api-url https://your-instance.com/api --api-key your-jwt-token
monica config set --default-format json
```

Skip interactive GitHub-star prompts in automation:

```bash
monica config set --api-url https://your-instance.com/api --api-key your-jwt-token --non-interactive
```

Override timeout for a single command run (without changing saved config or env files):

```bash
monica --request-timeout-ms 45000 contacts list --limit 50
```

Enable safe read-only mode:

```bash
monica config set --read-only
```

Disable read-only mode:

```bash
monica config set --read-write
```

### Check Configuration

```bash
monica config show
```

Displays a structured payload in the selected format with:
- masked configuration values
- settings file location metadata
- connection status and resolved user identity

Programmatic example:

```bash
monica --json config show
```

See [Output Schemas](./OUTPUT-SCHEMAS.md) for canonical JSON contracts.

### Test Connection

```bash
monica config test
```

Tests the connection to the Monica API and returns a structured payload (`ok`, `apiUrl`, `user`).

### Run Config Diagnostics

```bash
monica config doctor
```

Returns a structured diagnostics payload for setup hardening and agent safety checks (`summary`, `checks`, `location`).

### Show Configuration File Location

```bash
monica config location
```

### Reset Configuration

```bash
monica config reset
```

Removes the global settings file.

## Output Format Options

The CLI supports five output formats:

### toon (Default)

Hierarchical format optimized for readability and AI agents:

```bash
monica contacts list
```

```
[2 items]

── [0] ──
  id: 1
  first_name: "John"
  last_name: "Doe"
  gender: "male"
  is_partial: false
  created_at: "2024-01-15T10:30:00Z"

── [1] ──
  id: 2
  first_name: "Jane"
  last_name: "Smith"
  gender: "female"
  is_partial: false
  created_at: "2024-01-16T14:20:00Z"
```

### JSON

Standard JSON format:

```bash
monica contacts list --format json
# or
monica contacts list --json
```

### YAML

Structured YAML format:

```bash
monica contacts list --format yaml
# or
monica contacts list --yaml
```

### Table

ASCII table format:

```bash
monica contacts list --format table
# or
monica contacts list --table
```

### Markdown

Markdown table format, ideal for reports, documentation, and CI/CD pipeline output:

```bash
monica contacts list --format md
# or
monica contacts list --md
```

```markdown
| id | first_name | last_name | gender | is_partial | created_at |
|----|------------|-----------|--------|------------|------------|
| 1 | John | Doe | male | false | 2024-01-15T10:30:00Z |
| 2 | Jane | Smith | female | false | 2024-01-16T14:20:00Z |
```

## Pagination

### Default Pagination

```bash
monica contacts list --page 1 --limit 10
```

### Fetch All Pages

```bash
monica contacts list --all
```

## Sorting

Some endpoints support sorting:

```bash
# Sort by creation date (ascending)
monica contacts list --sort created_at

# Sort by creation date (descending)
monica contacts list --sort -created_at

# Sort by update date
monica contacts list --sort updated_at
```

## Global Options

These options apply to all commands:

| Option | Description |
|--------|-------------|
| `-f, --format <format>` | Output format (toon\|json\|yaml\|table\|md) |
| `--json` | Output as JSON (shorthand) |
| `--yaml` | Output as YAML (shorthand) |
| `--yml` | Output as YAML (shorthand) |
| `--table` | Output as table (shorthand) |
| `--md` | Output as Markdown (shorthand) |
| `--markdown` | Output as Markdown (shorthand) |
| `--raw` | Output raw JSON data only (for paginated output: emit only `data[]`) |
| `-v, --verbose` | Enable verbose output |
| `-q, --quiet` | Suppress non-essential output (dotenv logs) |
| `--fields <fields>` | Comma-separated list of fields to display |
| `-p, --page <page>` | Page number |
| `-l, --limit <limit>` | Items per page |

Note: Global shorthand flags like `--json`, `--yaml`, `--yml`, `--table`, `--md`, and `--markdown` are safest when passed before the command, for example `monica --json contacts list`.

## Agent-Optimized Options

For AI agents and programmatic use:

```bash
# Quiet mode - suppress dotenv logs
monica contacts list --quiet --json

# Raw mode - just the data array
monica contacts list --raw

# Field selection
monica contacts list --fields id,first_name,last_name

# Combine options
monica contacts list --all --raw --quiet --fields id,first_name
```

Probe endpoint support on the current Monica server version:

```bash
monica info capabilities
```

Get a concrete command allow-list for this instance:

```bash
monica info supported-commands
```

## Programmatic Usage

```typescript
import { listContacts, getContact } from 'monica-cli';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const contacts = await listContacts({ limit: 10 });
  console.log(contacts);
}

main();
```

## API Client Configuration

```typescript
import { setConfig, listContacts } from 'monica-cli';

setConfig({
  apiUrl: 'https://your-instance.com/api',
  apiKey: 'your-jwt-token',
});

const contacts = await listContacts();
```

## Getting Your API Key

1. Log into your Monica instance
2. Go to Settings → API
3. Generate a new token
4. Copy the JWT token

## Security Best Practices

1. **Use global settings file** with restricted permissions (`chmod 600`)
2. **Never commit credentials** to version control
3. **Use environment variables** in CI/CD pipelines
4. **Rotate tokens periodically** for enhanced security
5. **Use HTTPS** when connecting to remote instances

## Troubleshooting

### "Configuration not found" error

Check that one of these exists:
- `~/.monica-cli/settings.json`
- Environment variables `MONICA_API_URL` and `MONICA_API_KEY`
- `.env` file in the current directory

### "Connection failed" error

Verify:
- API URL is correct (should end with `/api`)
- API key is valid and not expired
- Network connectivity to the Monica instance
- Firewall rules allow the connection

### Permission denied on settings file

```bash
chmod 600 ~/.monica-cli/settings.json
```

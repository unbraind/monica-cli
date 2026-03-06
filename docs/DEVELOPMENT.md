# Development Guide

## Package Manager

This project uses [bun](https://bun.sh) as the primary package manager and runtime. Bun is significantly faster than npm and provides better developer experience.

### Installing Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

## Setup

```bash
git clone https://github.com/unbraind/monica-cli.git
cd monica-cli
bun install
```

## Environment

Create a `~/.monica-cli/settings.json` (recommended):

```json
{
  "apiUrl": "http://your-instance/api",
  "apiKey": "your-jwt-token"
}
```

Or create a `.env` file:

```env
MONICA_API_URL=http://your-instance/api
MONICA_API_KEY=your-jwt-token
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run build` | Compile TypeScript to dist/ |
| `bun run build:watch` | Watch mode for compilation |
| `bun run dev` | Run CLI in development mode |
| `bun run version:set` | Set next release version (`YYYY.M.D` for first release of day, otherwise `YYYY.M.D-N`) |
| `bun run version:check` | Validate package version matches the next release number for today (derived from release tags) |
| `bun run audit:version-history` | Validate all historical `package.json` versions use semver-safe `YYYY.M.D`/`YYYY.M.D-N` |
| `bun test` | Run all tests |
| `bun run test:e2e:readonly` | Run safe read-only E2E smoke test against configured Monica instance |
| `bun run test:e2e:help` | Run full `--help` command-tree audit using the real `monica` binary |
| `bun run test:watch` | Watch mode for tests |
| `bun run test:coverage` | Run tests with coverage |
| `bun run typecheck` | Type check without emitting |
| `bun run lint` | Run baseline ESLint checks on `src/**/*.ts` |
| `bun run lint:strict` | Run stricter ESLint checks on the hardened module set |
| `bun run smoke:npx` | Verify packed artifact runs with npx |
| `bun run smoke:bunx` | Verify packed artifact runs with bunx |
| `bun run audit:history` | Scan all git commits for likely leaked secrets |
| `bun run verify:release` | Run the full release quality gate |

## Incremental Lint Strictness

Linting is staged:

- Baseline rules run on all `src/**/*.ts` files.
- Stricter rules are enforced only for a curated module set in [`eslint.config.cjs`](../eslint.config.cjs) (`STRICT_MODULES`).
Current strict set includes:
`src/program.ts`, `src/commands/global-options.ts`, `src/commands/config*.ts`, `src/formatters/toon.ts`, `src/formatters/runtime-fields.ts`.

To tighten rules gradually:

1. Pick one module (or a small group) and make it pass `bun run lint:strict`.
2. Add that module path to `STRICT_MODULES`.
3. Keep CI green via `bun run lint` (already part of `verify:release` and CI workflows).

## Project Structure

```
src/
├── index.ts           # CLI entry point (boot + parse only)
├── program.ts         # Reusable CLI program builder (for tests and tooling)
├── api/               # API client modules
│   ├── client.ts      # HTTP client (get, post, put, del)
│   ├── contacts.ts    # Contacts API
│   ├── activities.ts  # Activities API
│   └── ...            # Other resource APIs
├── commands/          # CLI commands
│   ├── contacts.ts    # Contact commands
│   └── ...            # Other commands
├── types/             # TypeScript definitions
│   ├── common.ts      # Common types (PaginatedResponse, etc.)
│   ├── contact.ts     # Contact types
│   └── ...            # Other type files
└── formatters/        # Output formatters
    └── toon.ts        # Toon, JSON, YAML, and table formatters
```

## Code Style Guidelines

### Imports

Order: external → internal types → internal modules

```typescript
import { Command } from 'commander';
import type { OutputFormat, Contact } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
```

### Types

- All functions must have explicit return types
- Use interfaces for objects, type aliases for unions
- Input types suffixed with `Input`

```typescript
export async function createContact(data: ContactCreateInput): Promise<ApiResponse<Contact>> {
  return post<ApiResponse<Contact>>('/contacts', data);
}
```

### Naming Conventions

- Files: kebab-case (`contact-fields.ts`)
- Functions: camelCase (`createContactsCommand`)
- Types/Interfaces: PascalCase (`Contact`, `PaginatedResponse`)
- CLI options: kebab-case (`--first-name`, `--gender-id`)

### API Functions Pattern

```typescript
export async function listResources(params?: { limit?: number; page?: number }): Promise<PaginatedResponse<Resource>> {
  return get<PaginatedResponse<Resource>>('/resources', params);
}

export async function getResource(id: number): Promise<ApiResponse<Resource>> {
  return get<ApiResponse<Resource>>(`/resources/${id}`);
}

export async function createResource(data: ResourceCreateInput): Promise<ApiResponse<Resource>> {
  return post<ApiResponse<Resource>>('/resources', data);
}

export async function updateResource(id: number, data: ResourceUpdateInput): Promise<ApiResponse<Resource>> {
  return put<ApiResponse<Resource>>(`/resources/${id}`, data);
}

export async function deleteResource(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/resources/${id}`);
}
```

### CLI Commands Pattern

```typescript
export function createResourcesCommand(): Command {
  const cmd = new Command('resources')
    .description('Manage resources')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon');

  cmd
    .command('list')
    .description('List all resources')
    .action(async (_options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = parentOpts.format as OutputFormat;
      
      try {
        const result = await api.listResources();
        console.log(fmt.formatPaginatedResponse(result, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
```

### Error Handling

Always wrap async actions in try/catch:

```typescript
try {
  const result = await api.getResource(id);
  console.log(fmt.formatOutput(result.data, format));
} catch (error) {
  console.error(fmt.formatError(error as Error));
  process.exit(1);
}
```

### Testing Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  setConfig: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import * as client from '../src/api/client';

describe('resource API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls GET /resources/:id', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { id: 1 } });
    const result = await resource.getResource(1);
    expect(client.get).toHaveBeenCalledWith('/resources/1');
  });
});
```

## Adding a New Resource

1. **Create types** in `src/types/resource.ts`:

```typescript
export interface Resource {
  id: number;
  object: string;
  name: string;
  // ... other fields
}

export interface ResourceCreateInput {
  name: string;
  // ... other fields
}
```

2. **Export from types/index.ts**:

```typescript
export * from './resource';
```

3. **Create API module** in `src/api/resources.ts`:

```typescript
import type { Resource, ResourceCreateInput, PaginatedResponse, ApiResponse, DeleteResponse } from '../types';
import { get, post, put, del } from './client';

export async function listResources(params?: { limit?: number; page?: number }): Promise<PaginatedResponse<Resource>> {
  return get<PaginatedResponse<Resource>>('/resources', params);
}

// ... other functions
```

4. **Export from api/index.ts**:

```typescript
export * from './resources';
```

5. **Create command** in `src/commands/resources.ts`:

```typescript
import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createResourcesCommand(): Command {
  const cmd = new Command('resources')
    .description('Manage resources')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon');

  // ... subcommands

  return cmd;
}
```

6. **Register in index.ts**:

```typescript
import { createResourcesCommand } from './commands';
// ...
program.addCommand(createResourcesCommand());
```

7. **Write tests** in `tests/resources.test.ts`

8. **Update documentation** in `docs/COMMANDS.md`

## Read-Only Live E2E Validation

Use this before release to exercise the real `monica` binary without mutating Monica data:

```bash
bun run test:e2e:readonly
```

Notes:
- Requires valid global settings in `~/.monica-cli/settings.json`
- Assumes `readOnlyMode: true`; a write-block matrix (contacts/tags/companies and contact-scoped task/note writes when a contact exists) must fail locally with `Read-only mode enabled`
- Automatically snapshots and restores `~/.monica-cli/settings.json` after the run, so setup-wizard checks do not leave local config changes behind
- Supports environment overrides:
  - `MONICA_E2E_REQUEST_TIMEOUT_MS` (default: `45000`)
  - `MONICA_E2E_TIMEOUT_MS` (default: `90000`)
  - `MONICA_E2E_SEARCH_QUERY` (default: `example`)
  - `MONICA_E2E_VALIDATE_OUTPUT=0` to disable strict output-shape validation (`toon`, `json`, `yaml`, `table`, `md`)
  - `MONICA_E2E_REPORT_PATH=/abs/path/report.json` to override report location
  - `MONICA_E2E_FAIL_ON_TIMEOUT=1` to fail on endpoint timeouts instead of marking them expected
- Emits a sanitized machine-readable report to `~/.monica-cli/cache/e2e-readonly-last.json` by default (contains command statuses and summary only, no API payload data)

## Release Checklist

1. Run `bun run version:set` before creating the release/version commit
2. Run `bun run typecheck`
3. Run `bun test`
4. Run `bun run build`
5. Run `bun run version:check`
6. Update `CHANGELOG.md`
7. Commit and tag release
8. Publish to npm

### Version Format (Required)

- First release of day: `YYYY.M.D`
- Later releases that day: `YYYY.M.D-N`
- No zero-padding (`2026.3.4`, not `2026.03.04`)
- `N` is the release sequence number for that calendar date
- `N` is based on release count (tags), not commit count
- Example: if the date is `2025.12.31` and this is the 2nd release that day, version must be `2025.12.31-2`

## File Size Guidelines

Keep files under 300 lines. If a file grows too large:

1. Split into multiple modules
2. Move shared code to utilities
3. Extract complex types to separate files

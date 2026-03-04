# Output Schemas

Machine-oriented output contracts for Monica CLI.

Use the built-in schema registry to discover these contracts from the CLI:

```bash
monica --json schemas list
monica --json schemas get info-agent-context
monica --json schemas get info-instance-profile
monica --json schemas get info-command-catalog
monica --json schemas get info-supported-commands
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
monica --json schemas get agent-runbook
monica --json schemas sample info-capabilities
monica --json schemas validate config-test ./payload.json
monica --json schemas validate config-test ./payload.yaml
cat ./payload.json | monica --json schemas validate config-test
cat ./payload.yaml | monica --json schemas validate config-test --input-format yaml
```

## Scope

- Canonical machine format is JSON (`--json` or `--raw` where applicable).
- `toon`, `yaml`, `table`, and `md` are alternate renderings of the same underlying payload.
- For deterministic automation (`jq`, CI/CD, agent tool calls), prefer JSON.
- Some list commands can return compatibility fallback envelopes on instances with missing endpoints (for example `contact-fields list`, `pet-categories list`).
- `groups list` fallback (`/groups` unavailable) returns the normal group list schema, with values derived from `tags` records.

### Compatibility Fallback Envelopes

`contact-fields list` fallback (global endpoint unavailable):

```json
{
  "mode": "contact-scan-fallback",
  "trigger": "auto",
  "contactsScanned": 0,
  "contactsWithFields": 0,
  "totalFields": 0,
  "data": []
}
```

`pet-categories list` fallback (`/petcategories` unavailable):

```json
{
  "mode": "pet-scan-fallback",
  "trigger": "auto",
  "petsScanned": 0,
  "categoriesDiscovered": 0,
  "data": []
}
```

## Common Envelopes

### `info capabilities`

```json
{
  "generatedAt": "2026-03-03T00:00:00.000Z",
  "source": "cache",
  "summary": { "total": 0, "supported": 0, "unsupported": 0 },
  "probes": [
    {
      "key": "contacts",
      "command": "contacts list",
      "endpoint": "/contacts?limit=1",
      "supported": true,
      "nativeSupported": true,
      "fallbackSupported": false,
      "statusCode": 200,
      "message": "OK"
    }
  ]
}
```

`source` is `cache` when a valid capability cache entry was used, otherwise `live`.
`supported` represents effective command-family availability (including built-in CLI compatibility fallbacks), while `nativeSupported`/`fallbackSupported` explain whether support is direct endpoint support or fallback-routed support.

### `info supported-commands`

```json
{
  "generatedAt": "2026-03-03T00:00:00.000Z",
  "source": "live",
  "total": 0,
  "commands": []
}
```

### `info unsupported-commands`

```json
{
  "generatedAt": "2026-03-03T00:00:00.000Z",
  "source": "live",
  "total": 2,
  "commands": [
    {
      "key": "groups",
      "command": "groups list",
      "endpoint": "/groups?limit=1",
      "statusCode": 404,
      "message": "HTTP 404",
      "severity": "unsupported",
      "recommendedAction": "Groups endpoints are unavailable on this Monica instance/version; use groups tag-scan fallback or tags/contact lists instead.",
      "fallbackCommands": [
        "monica --json groups list --scan-tags --tag-max-pages 2",
        "monica --json contacts list --limit 50",
        "monica --json tags list --limit 50",
        "monica --json info supported-commands"
      ]
    }
  ]
}
```

### `info agent-context`

```json
{
  "generatedAt": "2026-03-02T00:00:00.000Z",
  "instance": { "apiUrl": "https://example/api", "readOnlyMode": true },
  "defaults": { "outputFormat": "toon", "safeGlobalFlags": ["--json", "--yaml", "--yml", "--table", "--md", "--markdown", "--raw", "--request-timeout-ms"] },
  "capabilities": { "source": "cache", "total": 0, "supported": 0, "unsupported": 0, "unsupportedResources": [] },
  "supportedCommands": { "total": 0, "commands": [] },
  "safeCommandExamples": []
}
```

### `info instance-profile`

```json
{
  "generatedAt": "2026-03-03T00:00:00.000Z",
  "instance": { "apiUrl": "https://example/api", "readOnlyMode": true },
  "defaults": { "outputFormat": "toon", "safeGlobalFlags": ["--json", "--yaml", "--yml", "--table", "--md", "--markdown", "--raw", "--request-timeout-ms"] },
  "capabilities": {
    "source": "live",
    "summary": { "total": 0, "supported": 0, "unsupported": 0 },
    "probes": []
  },
  "supportedCommands": { "total": 0, "commands": [] },
  "unsupportedCommands": { "total": 0, "commands": [] }
}
```

This payload is intended as a single deterministic planning input for agents.

### `info command-catalog`

```json
{
  "generatedAt": "2026-03-02T00:00:00.000Z",
  "rootCommand": "monica",
  "defaultOutputFormat": "toon",
  "instanceCapabilities": {
    "enabled": true,
    "source": "cache",
    "generatedAt": "2026-03-03T00:00:00.000Z"
  },
  "commandTree": {
    "name": "contacts",
    "fullCommand": "monica contacts",
    "usage": "monica contacts [options] [command]",
    "helpCommand": "monica contacts --help",
    "safety": {
      "operation": "mixed",
      "mutatesData": true,
      "readOnlyCompatible": false
    },
    "availability": {
      "supportedOnInstance": true,
      "statusCode": 200,
      "endpoint": "/contacts?limit=1",
      "message": "OK"
    },
    "subcommands": [
      {
        "name": "list",
        "fullCommand": "monica contacts list",
        "safety": {
          "operation": "read",
          "mutatesData": false,
          "readOnlyCompatible": true
        },
        "subcommands": []
      },
      {
        "name": "create",
        "fullCommand": "monica contacts create",
        "safety": {
          "operation": "write",
          "mutatesData": true,
          "readOnlyCompatible": false
        },
        "subcommands": []
      }
    ]
  }
}
```

`instanceCapabilities.enabled=false` indicates static command catalog mode (no capability probe attached).
`availability` is attached only for command families that map to capability probes.
`usage` and `helpCommand` provide deterministic command invocation metadata for LLM/agent planners.

### `agent-tools safe-commands`

```json
{
  "generatedAt": "2026-03-03T00:00:00.000Z",
  "instanceCapabilities": {
    "enabled": true,
    "source": "cache",
    "generatedAt": "2026-03-03T00:00:00.000Z"
  },
  "totalCommands": 3,
  "totalExcludedCommands": 1,
  "commands": [
    {
      "command": "monica contacts list",
      "operation": "read",
      "mutatesData": false,
      "readOnlyCompatible": true,
      "supportedOnInstance": true
    }
  ],
  "excludedCommands": [
    {
      "command": "monica groups list",
      "reason": "instance-unsupported",
      "operation": "read",
      "mutatesData": false,
      "readOnlyCompatible": true,
      "statusCode": 404,
      "endpoint": "/groups?limit=1",
      "message": "HTTP 404"
    }
  ]
}
```

This payload is intended as a deterministic read-only allow-list for LLM planners. `excludedCommands` provides machine-readable deny reasons when `--instance-aware` filters unsupported command families.

### `agent-runbook`

```json
{
  "generatedAt": "2026-03-04T00:00:00.000Z",
  "mode": "read-only",
  "instanceCapabilities": {
    "enabled": true,
    "source": "live",
    "generatedAt": "2026-03-04T00:00:00.000Z"
  },
  "summary": {
    "totalSteps": 7,
    "totalExcludedSteps": 1,
    "includeOptional": false
  },
  "steps": [
    {
      "id": "config-doctor",
      "category": "baseline",
      "command": "monica --json config doctor",
      "purpose": "Validate local setup before API calls.",
      "commandRoot": "config",
      "schemaHint": "config-test"
    }
  ],
  "excludedSteps": [
    {
      "id": "contacts-sample",
      "command": "monica --json contacts list --limit 5",
      "commandRoot": "contacts",
      "reason": "instance-unsupported",
      "support": {
        "commandRoot": "contacts",
        "statusCode": 404,
        "endpoint": "/contacts?limit=1",
        "message": "HTTP 404"
      }
    }
  ]
}
```

Use this as a deterministic orchestration plan for agent bootstrap in read-only mode.

### `search`

```json
{
  "query": "john",
  "type": "all",
  "limitPerType": 5,
  "maxPages": 2,
  "totalResults": 12,
  "partial": true,
  "failedTypes": ["activities"],
  "errors": [
    { "type": "activities", "message": "HTTP 404" }
  ],
  "results": [
    { "type": "contact", "id": 1, "title": "John Doe", "subtitle": "friend" }
  ]
}
```

`partial: true` indicates best-effort mode returned results even though one or more resource types failed.

### `api-research summary`

```json
{
  "generatedAt": "2026-03-03T00:00:00.000Z",
  "sourceFile": "/path/to/repo/docs/api-reference.json",
  "sourceFormat": "api-reference",
  "apiReference": {
    "version": "1.0.0",
    "generated": "2026-03-03",
    "baseUrl": "https://app.monicahq.com/api"
  },
  "instanceCapabilities": {
    "enabled": true,
    "source": "live",
    "generatedAt": "2026-03-03T00:00:00.000Z"
  },
  "commandSupport": {
    "total": 27,
    "supported": 24,
    "unsupported": 3,
    "supportedCommands": ["contacts", "notes"],
    "unsupportedCommands": ["groups", "pet-categories"]
  },
  "summary": {
    "resources": 31,
    "endpoints": 120,
    "methodsByVerb": { "GET": 31, "POST": 18, "PUT": 15, "DELETE": 12 }
  },
  "cliCoverage": {
    "mappedResources": 29,
    "unmappedResources": 2,
    "unmappedResourceNames": ["customResourceX", "legacyThing"]
  },
  "supportedResourcesByInstance": ["contacts", "notes"],
  "unsupportedResourcesByInstance": [
    {
      "resource": "groups",
      "cliCommand": "groups",
      "statusCode": 404,
      "endpoint": "/groups?limit=1",
      "message": "HTTP 404"
    }
  ],
  "resources": [
    {
      "resource": "contacts",
      "description": "Manage contacts",
      "endpointCount": 8,
      "methods": ["DELETE", "GET", "POST", "PUT"],
      "cliCommand": "contacts",
      "cliMapping": "mapped",
      "instanceSupport": {
        "supportedOnInstance": true,
        "statusCode": 200,
        "endpoint": "/contacts?limit=1",
        "message": "OK"
      }
    }
  ]
}
```

### `api-research coverage`

```json
{
  "generatedAt": "2026-03-04T00:00:00.000Z",
  "sourceFile": "/path/to/repo/docs/api-reference.json",
  "sourceFormat": "api-reference",
  "instanceCapabilities": {
    "enabled": true,
    "source": "live",
    "generatedAt": "2026-03-04T00:00:00.000Z"
  },
  "totals": {
    "resources": 31,
    "endpoints": 120
  },
  "cliMapping": {
    "mappedResources": 29,
    "unmappedResources": 2,
    "mappedPercent": 93.55,
    "unmappedResourceNames": ["customResourceX", "legacyThing"]
  },
  "instanceSupport": {
    "supportedResources": 28,
    "unsupportedResources": 3,
    "supportedPercent": 90.32,
    "unsupported": [
      {
        "resource": "groups",
        "cliCommand": "groups",
        "statusCode": 404,
        "endpoint": "/groups?limit=1",
        "message": "HTTP 404"
      }
    ]
  },
  "commandSupport": {
    "total": 27,
    "supported": 24,
    "unsupported": 3,
    "supportedPercent": 88.89,
    "supportedCommands": ["contacts", "notes"],
    "unsupportedCommands": ["groups", "pet-categories"]
  },
  "readOnlyActionPlan": {
    "count": 2,
    "commands": [
      "monica --json contacts list --limit 100",
      "monica --json tags list --limit 100"
    ]
  },
  "gate": {
    "enabled": true,
    "failed": true,
    "failOnUnmapped": false,
    "failOnUnsupported": true,
    "reasons": ["unsupported commands detected: 3"]
  },
  "recommendedNextCommands": [
    "monica --json api-research backlog --instance-aware --unsupported-only",
    "monica --json api-research actions --instance-aware --read-only-only"
  ]
}
```

### `api-research probe`

```json
{
  "generatedAt": "2026-03-04T00:00:00.000Z",
  "sourceFile": "/path/to/repo/docs/api-reference.json",
  "sourceFormat": "api-reference",
  "options": {
    "resource": "contacts",
    "includeParameterized": true,
    "idReplacement": 1
  },
  "summary": {
    "total": 4,
    "supported": 3,
    "unsupported": 0,
    "unknownId": 1,
    "errors": 0
  },
  "probes": [
    {
      "resource": "contacts",
      "key": "search",
      "method": "GET",
      "referencePath": "/contacts/search",
      "probePath": "/contacts",
      "probeParams": {
        "query": "a",
        "limit": 1
      },
      "parameterized": false,
      "status": "supported",
      "supported": true,
      "statusCode": 200,
      "message": "OK"
    }
  ]
}
```

### `api-research backlog`

```json
{
  "generatedAt": "2026-03-04T00:00:00.000Z",
  "sourceFile": "/path/to/repo/docs/api-reference.json",
  "sourceFormat": "api-reference",
  "instanceCapabilities": {
    "enabled": true,
    "source": "live",
    "generatedAt": "2026-03-04T00:00:00.000Z"
  },
  "backlog": {
    "total": 2,
    "high": 1,
    "medium": 1
  },
  "items": [
    {
      "resource": "customResourceX",
      "cliCommand": "customResourceX",
      "type": "missing-cli-mapping",
      "priority": "high",
      "reason": "Resource is present in API reference but lacks a direct CLI command mapping.",
      "recommendedAction": "List all unmapped resources before implementing new command families. Suggested command: monica --json api-research summary --unmapped-only",
      "agentActions": [
        {
          "command": "monica --json api-research summary --unmapped-only",
          "reason": "List all unmapped resources before implementing new command families.",
          "safety": "planning"
        }
      ]
    },
    {
      "resource": "groups",
      "cliCommand": "groups",
      "type": "instance-unsupported",
      "priority": "medium",
      "reason": "Mapped command is unsupported on this instance and may require compatibility handling.",
      "recommendedAction": "Tags are commonly available and can substitute grouping for read-only segmentation. Suggested command: monica --json tags list --limit 100",
      "support": {
        "supportedOnInstance": false,
        "statusCode": 404,
        "endpoint": "/groups?limit=1",
        "message": "HTTP 404"
      },
      "agentActions": [
        {
          "command": "monica --json tags list --limit 100",
          "reason": "Tags are commonly available and can substitute grouping for read-only segmentation.",
          "safety": "read-only"
        }
      ]
    }
  ]
}
```

### `api-research actions`

```json
{
  "generatedAt": "2026-03-04T00:00:00.000Z",
  "sourceFile": "/path/to/repo/docs/api-reference.json",
  "sourceFormat": "api-reference",
  "instanceCapabilities": {
    "enabled": true,
    "source": "live",
    "generatedAt": "2026-03-04T00:00:00.000Z"
  },
  "summary": {
    "actions": 2,
    "readOnlyActions": 1,
    "planningActions": 1,
    "uniqueCommands": 2
  },
  "actions": [
    {
      "resource": "customResourceX",
      "cliCommand": "customResourceX",
      "type": "missing-cli-mapping",
      "priority": "high",
      "command": "monica --json api-research summary --unmapped-only",
      "commandShape": {
        "executable": "monica",
        "root": "api-research",
        "subcommand": "summary",
        "args": ["--json", "api-research", "summary", "--unmapped-only"],
        "options": ["--json", "--unmapped-only"]
      },
      "reason": "List all unmapped resources before implementing new command families.",
      "safety": "planning"
    }
  ],
  "commands": [
    "monica --json api-research summary --unmapped-only",
    "monica --json info supported-commands"
  ]
}
```

### `api-research snapshot`

```json
{
  "generatedAt": "2026-03-04T00:00:00.000Z",
  "summary": { "summary": { "resources": 31 } },
  "backlog": { "backlog": { "total": 2 } },
  "probe": { "summary": { "total": 40, "supported": 37, "unsupported": 1, "unknownId": 2, "errors": 0 } }
}
```

### `audit`

```json
{
  "generatedAt": "2026-03-03T00:00:00.000Z",
  "ok": true,
  "repoPath": "/workspace/monica-cli",
  "settingsPath": "/home/user/.monica-cli/settings.json",
  "summary": { "total": 8, "pass": 8, "warn": 0, "fail": 0 },
  "checks": [
    {
      "id": "tracked-secret-patterns",
      "status": "pass",
      "severity": "info",
      "message": "No known Monica secret patterns found in tracked files"
    }
  ]
}
```

Schema id: `audit-report`.

## Config Command Schemas

All config subcommands now emit structured payloads in every output format.
Sensitive values are masked in all renderers.

## Schema Sample Generation

Use `schemas sample` to generate deterministic starter payloads for tests, mocks, and agent prompt contracts.

```bash
monica --json schemas sample config-test
```

Example:

```json
{
  "ok": true,
  "schemaId": "config-test",
  "sample": {
    "ok": false,
    "apiUrl": "string"
  }
}
```

### `config get`

```json
{
  "ok": true,
  "config": {
    "apiUrl": "https://example/api",
    "apiKey": "[hidden:1204:sha256:9f4c2a10]",
    "userEmail": "user@example.com",
    "userPassword": "[hidden]",
    "readOnlyMode": true,
    "githubRepoStarred": false
  }
}
```

### `config get <key>`

```json
{ "key": "api-key", "value": "eyJ...masked" }
```

### `config show`

```json
{
  "ok": true,
  "config": {},
  "location": { "path": "/home/user/.monica-cli/settings.json", "exists": true, "modifiedAt": "2026-03-02T00:00:00.000Z" },
  "connection": {
    "ok": true,
    "apiUrl": "https://example/api",
    "user": { "id": 1, "name": "User", "email": "user@example.com", "accountId": 1 }
  }
}
```

### `config test`

```json
{
  "ok": true,
  "apiUrl": "https://example/api",
  "user": { "id": 1, "name": "User", "email": "user@example.com", "accountId": 1 }
}
```

### `config setup` / `config set`

```json
{
  "ok": true,
  "message": "Configuration saved",
  "config": {},
  "location": {},
  "connection": {},
  "capabilityProbe": {
    "attempted": true,
    "cached": true,
    "summary": { "total": 31, "supported": 28, "unsupported": 3 },
    "generatedAt": "2026-03-04T00:00:00.000Z"
  }
}
```

`capabilityProbe` is included for `config setup` and `setup` responses. It is non-fatal: setup succeeds even if capability probing fails, and the field includes `error` when probe caching could not be completed.

### `config location`

```json
{
  "path": "/home/user/.monica-cli/settings.json",
  "exists": true,
  "modifiedAt": "2026-03-02T00:00:00.000Z"
}
```

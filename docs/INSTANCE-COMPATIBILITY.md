# Instance Compatibility

This document captures real-world endpoint compatibility findings and how the CLI handles Monica server differences.

## Capability Probe

Run:

```bash
monica info capabilities --format json
```

This performs GET-only checks and does not modify Monica data.

## API Editions

Compatibility is edition-specific:

| Edition | Upstream | Authentication | CLI surface |
|---|---|---|---|
| Stable | v4.1.2 / `4.x` | OAuth bearer token | Complete 35-resource stable API |
| Next | current `main` | Sanctum bearer token with `read`/`write` abilities | Authenticated user, account users, and vault CRUD |

Use `monica --json api-research source-status --edition stable|next` to verify
public source freshness, and `--source monica|next` on the other
`api-research` commands to select the inventory. `users current`, `users list`,
and `vaults list` are included in GET-only capability probing.

Export edition-specific automation contracts with
`monica --json api-research openapi --edition stable|next`. Run
`api-research validate-contract --verify-source` to combine structural
validation with public-source freshness, or `api-research diff` to inspect
operation-level compatibility without touching the configured instance.

`config test`, `config doctor`, and the setup wizard support both editions.
They fall back from stable `/me` to current `/user` only for HTTP 404/405, so a
real authentication, timeout, or infrastructure failure remains visible.

## Latest Verified Results

Probe run date: **July 27, 2026**
Instance type: self-hosted Monica API

- Read-only CLI checks: `117`
- Passed locally or against public sources: `61`
- Authenticated checks classified unavailable: `56`
- Unexpected failures: `0`

The live instance currently fails authenticated API bootstrap because its
Laravel process cannot append to the application log. That server-side
permission failure affects both stable and next-edition GET routes, so it
cannot establish endpoint support or API incompatibility. Public source checks,
schemas, command catalogs, local diagnostics, and client-side write guards
remain verifiable.

The result is intentionally reported as `unavailable`, not `unsupported`.
Re-run `monica --json info capabilities --refresh` after restoring the
instance's outbound Cloudflare access to obtain endpoint-specific evidence.

## End-to-End CLI Validation (Read-Only)

Validated on **July 27, 2026** with global settings + `readOnlyMode: true` using the actual `monica` binary.

- The harness completed all `117` checks with `0` unexpected failures and
  restored `~/.monica-cli/settings.json`.
- Output validation covered TOON plus JSON, YAML, table, Markdown, and raw
  programmatic paths where applicable.
- Stable and next-edition source status, next-source coverage, and both new
  output schemas passed.
- POST, PUT, PATCH, DELETE, and upload-style mutations remain blocked by the
  client-side read-only guard before a request can leave the process.

## What This Means

- The CLI includes commands for these resources because they are available on other Monica versions/installs.
- On an instance where an endpoint is missing, commands return a standard API error.
- Agents should always capability-probe before planning multi-step automation.

## Endpoint Variants Handled by the CLI

Some Monica installations expose different endpoint names for the same action.  
The CLI now handles these group-contact mutation variants automatically:

- Primary: `/groups/:id/attachContacts`
- Fallback: `/groups/:id/attach`
- Primary: `/groups/:id/detachContacts`
- Fallback: `/groups/:id/detach`

Fallback is only attempted when the primary endpoint returns `HTTP 404`.

## Server Infrastructure Diagnostics

Connection doctor and capability outputs preserve Monica's original error and add a
machine-readable `diagnostic` object when the failure has a known operator remedy.
Diagnostic objects contain a stable `code`, summary, cause, operator action,
`retryable` flag, and upstream source URL. Unknown failures use `diagnostic: null`.

For `monica_cloudflare_trust_proxy_fetch_failed`, Monica failed while fetching
Cloudflare IPv4 or IPv6 ranges during request bootstrap. Repeating every API command
will not establish endpoint support. Check outbound HTTPS and DNS from the Monica
container, then review `TRUSTED_PROXIES` and Cloudflare proxy settings. This is an
instance-side failure; changing the CLI token or disabling read-only mode does not fix it.

```bash
monica --json config doctor
monica --json info capabilities --refresh
```

## Agent-Safe Workflow

1. Configure once with read-only enabled.
2. Run `monica info capabilities --format json`.
3. Filter plans to supported resources only.
4. Execute read operations first.
5. Only switch to read-write mode when explicitly approved.

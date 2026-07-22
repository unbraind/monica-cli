# Instance Compatibility

This document captures real-world endpoint compatibility findings and how the CLI handles Monica server differences.

## Capability Probe

Run:

```bash
monica info capabilities --format json
```

This performs GET-only checks and does not modify Monica data.

## Latest Verified Results

Probe run date: **March 4, 2026**  
Instance type: self-hosted Monica API

- Probed resources: `31`
- Supported: `28`
- Unsupported: `3`

Unsupported on the verified instance:

- `groups` (`/groups?limit=1`) -> HTTP 404
- `pet-categories` (`/petcategories?limit=1`) -> HTTP 404
- Global `contact-fields list` endpoint (`/contactfields?limit=1`) returns HTTP 405
  - CLI now auto-falls back to read-only contact scan for `monica contact-fields list`
  - strict mode: `monica contact-fields list --no-auto-scan`
  - scoped mode: `monica contact-fields list <contact-id>`

## End-to-End CLI Validation (Read-Only)

Validated on **March 2, 2026** with global settings + `readOnlyMode: true` using the actual `monica` binary.

- Setup wizard test: `monica config setup --non-interactive ... --read-only` succeeded and persisted settings in `~/.monica-cli/settings.json`.
- JSON schema/parse checks: command outputs were validated with `jq` for representative `list`, `info`, and `search` command paths.
- Write safety check: mutating commands remain blocked by client-side read-only guard before issuing POST/PUT/DELETE/upload requests.

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

# Security Audit

Use the built-in `audit` command to verify local secret hygiene before committing or pushing.

## Command

```bash
monica --json audit
```

For full git history scanning in CI, the `Security` workflow runs `gitleaks` with full fetch depth.

Strict CI mode (fails on warnings too):

```bash
monica --json audit --strict
```

Run a full history scan before release:

```bash
bun run audit:history
```

## What It Checks

- Global settings file exists (`~/.monica-cli/settings.json` by default)
- Global settings file permissions are secure (`0600` on POSIX)
- Global settings directory permissions are secure (`0700` on POSIX)
- `readOnlyMode` safety setting status in global settings
- Global settings file is not tracked by git
- `.env` secret files are not tracked by git (`.env`, `.env.*`, excluding `.env.example`)
- Tracked files do not contain Monica secret patterns (JWT/API key/password)
- Warns when sensitive `MONICA_*` environment variables are active in the current shell

## Output Contract

The machine schema is available through:

```bash
monica --json schemas get audit-report
```

The payload includes:

- `generatedAt`
- `ok`
- `repoPath`
- `settingsPath`
- `summary` (`total`, `pass`, `warn`, `fail`)
- `checks[]` (`id`, `status`, `severity`, `message`, optional `details`)

## Recommended Workflow

1. Keep secrets only in `~/.monica-cli/settings.json` and never in repo files.
2. Keep read-only mode enabled for production Monica instances.
3. Run `monica --json audit` before `git commit`/`git push`.
4. Run `bun run audit:history` before release candidates and after any history rewrite.
5. In CI, use both gitleaks and `bun run audit:history`.

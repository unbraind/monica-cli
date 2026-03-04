# Command Reference

Complete reference for all Monica CLI commands.

## Global Options

| Option | Description |
|--------|-------------|
| `-f, --format <format>` | Output format (toon\|json\|yaml\|table\|md); aliases: `yml`, `markdown` |
| `--json` | Output as JSON |
| `--yaml` | Output as YAML |
| `--yml` | Output as YAML |
| `--table` | Output as table |
| `--md` | Output as Markdown (shorthand for --format md) |
| `--markdown` | Output as Markdown (shorthand for --format md) |
| `--raw` | Output raw JSON data only (for paginated commands: emits only `data[]`) |
| `--request-timeout-ms <ms>` | Per-request timeout override for this invocation |
| `-v, --verbose` | Verbose output |
| `-p, --page <page>` | Page number |
| `-l, --limit <limit>` | Items per page |

`--json`, `--yaml`, `--yml`, `--table`, `--md`, and `--markdown` are global overrides and apply to all commands/subcommands.
`--raw` forces JSON output and removes pagination metadata wrappers where applicable.
Every `monica <command> --help` output also includes an "Inherited global options" section so command-level help is self-contained.

## setup

Run the onboarding setup wizard (alias for `config setup`).

```bash
monica setup [options]
```

| Option | Description |
|--------|-------------|
| `--api-url <url>` | Monica API URL |
| `--api-key <key>` | Monica API key (JWT token) |
| `--user-email <email>` | User email (optional) |
| `--user-password <password>` | User password (optional) |
| `--default-format <format>` | Persisted default output (`toon|json|yaml|table|md`) |
| `--read-only` | Enable read-only safety mode |
| `--read-write` | Disable read-only safety mode |
| `--dry-run` | Validate configuration and connection without saving |
| `--non-interactive` | Disable prompts for missing values |
| `--probe-capabilities` | Probe and cache instance capabilities after setup (default) |
| `--skip-capability-probe` | Skip capability probe during setup |

Setup validation rules:
- `api-key` must be non-empty and contain no whitespace.
- `user-email` must be a valid email when provided.
- `user-password` requires `user-email`.
- Optional `user-email`/`user-password` prompts are shown only when these fields are already configured/provided.

## audit

Run a local security and secret-hygiene audit for Monica CLI setup and repository state.

```bash
monica audit [options]
```

| Option | Description |
|--------|-------------|
| `--repo-path <path>` | Repository path to scan (default: current directory) |
| `--strict` | Exit non-zero for warnings and failures |

## schemas

Machine-readable output schema registry for automation and agent tooling.

### schemas list

List available schema descriptors.

```bash
monica schemas list [options]
```

### schemas get

Get one schema descriptor by ID.

```bash
monica schemas get <schema-id> [options]
```

### schemas sample

Generate a deterministic example payload for a registered schema.

```bash
monica schemas sample <schema-id> [options]
```

### schemas validate

Validate JSON/YAML input against a registered schema ID.

```bash
monica schemas validate <schema-id> [input-path] [options]
cat payload.json | monica --json schemas validate <schema-id>
cat payload.yaml | monica --json schemas validate <schema-id> --input-format yaml
```

| Option | Description |
|--------|-------------|
| `--input-format <format>` | Input payload format (`auto`\|`json`\|`yaml`\|`yml`) |

## api-research

Summarize Monica API resource and endpoint inventory from reference docs (`docs/api-reference.json` and `docs/monica-api-reference.json`).

### api-research summary

Emit machine-readable API coverage data for agent planning.

```bash
monica api-research summary [options]
```

| Option | Description |
|--------|-------------|
| `--resource <name>` | Filter resources by case-insensitive substring |
| `--with-endpoints` | Include per-endpoint method/path rows in payload |
| `--source <source>` | Reference source: `auto`\|`api`\|`monica`\|`<custom-json-path>` |
| `--instance-aware` | Attach live capability support metadata by command root (GET-only probe) |
| `--supported-only` | Requires `--instance-aware`; include only resources supported on this instance |
| `--unsupported-only` | Requires `--instance-aware`; include only resources unsupported on this instance |
| `--mapped-only` | Include only resources with a direct CLI command mapping |
| `--unmapped-only` | Include only resources that currently have no direct CLI command mapping |
| `--fail-on-unmapped` | Exit with status `2` when unmapped resources are present (CI gate) |
| `--fail-on-unsupported` | With `--instance-aware`, exit with status `2` when unsupported commands are present |
| `--refresh` | Force capability re-probe instead of using cache |
| `--cache-ttl <seconds>` | Capability cache TTL in seconds |

`api-research summary` output includes:
- `cliCoverage` and per-resource `cliMapping` for mapping parity (`mapped`/`unmapped`)
- `supportedResourcesByInstance` (when `--instance-aware`)
- `unsupportedResourcesByInstance` with status/endpoint details (when `--instance-aware`)

### api-research coverage

Emit a compact scorecard payload for automation with mapping percentages and optional live-instance support percentages.
Coverage output also includes `readOnlyActionPlan` (deduplicated safe command list) so agents can execute fallback flows without an additional `api-research actions` call.

```bash
monica api-research coverage [options]
```

| Option | Description |
|--------|-------------|
| `--resource <name>` | Filter resources by case-insensitive substring |
| `--source <source>` | Reference source: `auto`\|`api`\|`monica`\|`<custom-json-path>` |
| `--instance-aware` | Attach live capability support metadata by command root (GET-only probe) |
| `--supported-only` | Requires `--instance-aware`; include only resources supported on this instance |
| `--unsupported-only` | Requires `--instance-aware`; include only resources unsupported on this instance |
| `--mapped-only` | Include only resources with a direct CLI command mapping |
| `--unmapped-only` | Include only resources that currently have no direct CLI command mapping |
| `--refresh` | Force capability re-probe instead of using cache |
| `--cache-ttl <seconds>` | Capability cache TTL in seconds |

### api-research backlog

Emit deterministic backlog items for CLI parity work (mapping gaps and optional instance-compatibility gaps).
Each backlog item includes:
- `recommendedAction` for a single deterministic next step
- `agentActions[]` for structured fallback/planning command options

```bash
monica api-research backlog [options]
```

| Option | Description |
|--------|-------------|
| `--resource <name>` | Filter resources by case-insensitive substring |
| `--source <source>` | Reference source: `auto`\|`api`\|`monica`\|`<custom-json-path>` |
| `--instance-aware` | Include `instance-unsupported` backlog items from live capability probes, including command families missing from the selected reference source |
| `--supported-only` | Requires `--instance-aware`; include only resources supported on this instance |
| `--unsupported-only` | Requires `--instance-aware`; include only resources unsupported on this instance |
| `--mapped-only` | Include only resources with a direct CLI command mapping |
| `--unmapped-only` | Include only resources that currently have no direct CLI command mapping |
| `--refresh` | Force capability re-probe instead of using cache |
| `--cache-ttl <seconds>` | Capability cache TTL in seconds |

### api-research actions

Emit a flattened, deterministic action list derived from `api-research backlog` guidance.
Useful when agents need a direct command queue instead of per-item nested `agentActions`.

```bash
monica api-research actions [options]
```

| Option | Description |
|--------|-------------|
| `--resource <name>` | Filter resources by case-insensitive substring |
| `--source <source>` | Reference source: `auto`\|`api`\|`monica`\|`<custom-json-path>` |
| `--instance-aware` | Include `instance-unsupported` backlog items from live capability probes |
| `--supported-only` | Requires `--instance-aware`; include only resources supported on this instance |
| `--unsupported-only` | Requires `--instance-aware`; include only resources unsupported on this instance |
| `--mapped-only` | Include only resources with a direct CLI command mapping |
| `--unmapped-only` | Include only resources that currently have no direct CLI command mapping |
| `--read-only-only` | Include only read-only action commands (exclude planning-only actions) |
| `--refresh` | Force capability re-probe instead of using cache |
| `--cache-ttl <seconds>` | Capability cache TTL in seconds |

### api-research probe

Read-only probe of documented `GET` endpoints against the currently configured Monica instance.

```bash
monica api-research probe [options]
```

| Option | Description |
|--------|-------------|
| `--resource <name>` | Filter resources by case-insensitive substring |
| `--source <source>` | Reference source: `auto`\|`api`\|`monica`\|`<custom-json-path>` |
| `--include-parameterized` | Probe `:id` paths by replacing params with `--id-replacement` |
| `--id-replacement <id>` | Numeric replacement id for `:id` placeholders (default: `1`) |

## agent-runbook

Generate a deterministic read-only execution checklist for LLM/agent workflows.

```bash
monica agent-runbook [options]
```

| Option | Description |
|--------|-------------|
| `--include-optional` | Include optional extended planning steps |
| `--instance-aware` | Filter steps by live capability support per command family |
| `--refresh` | Force capability re-probe instead of using cache |
| `--cache-ttl <seconds>` | Capability cache TTL in seconds |

`agent-runbook` outputs machine-readable `steps` and `excludedSteps` payloads and is designed for deterministic orchestration in CI/agents.
| `--fail-on-unsupported` | Exit code `1` when unsupported endpoints are detected |

### api-research snapshot

Emit a single deterministic payload combining `summary`, `backlog`, and `probe` data.

```bash
monica api-research snapshot [options]
```

| Option | Description |
|--------|-------------|
| `--resource <name>` | Filter resources by case-insensitive substring |
| `--source <source>` | Reference source: `auto`\|`api`\|`monica`\|`<custom-json-path>` |
| `--instance-aware` | Attach live capability support metadata by command root |
| `--supported-only` | Requires `--instance-aware`; include only resources supported on this instance |
| `--unsupported-only` | Requires `--instance-aware`; include only resources unsupported on this instance |
| `--mapped-only` | Include only resources with a direct CLI command mapping |
| `--unmapped-only` | Include only resources that currently have no direct CLI command mapping |
| `--refresh` | Force capability re-probe instead of using cache |
| `--cache-ttl <seconds>` | Capability cache TTL in seconds |
| `--include-parameterized` | Probe `:id` paths by replacing params with `--id-replacement` |
| `--id-replacement <id>` | Numeric replacement id for `:id` placeholders (default: `1`) |

## contacts

Manage contacts.

### contacts list

List all contacts.

```bash
monica contacts list [options]
```

| Option | Description |
|--------|-------------|
| `-q, --query <query>` | Search query |
| `-s, --sort <field>` | Sort field (created_at\|updated_at) |
| `--all` | Fetch all pages |

### contacts get

Get a specific contact.

```bash
monica contacts get <id> [options]
```

| Option | Description |
|--------|-------------|
| `--with-fields` | Include contact fields |

### contacts create

Create a new contact.

```bash
monica contacts create [options]
```

| Option | Description |
|--------|-------------|
| `--first-name <name>` | First name (required) |
| `--last-name <name>` | Last name |
| `--nickname <name>` | Nickname |
| `--gender-id <id>` | Gender ID (required) |
| `--is-deceased` | Mark as deceased |
| `--is-partial` | Mark as partial |

### contacts update

Update a contact.

```bash
monica contacts update <id> [options]
```

| Option | Description |
|--------|-------------|
| `--first-name <name>` | First name |
| `--last-name <name>` | Last name |
| `--nickname <name>` | Nickname |
| `--gender-id <id>` | Gender ID |

### contacts delete

Delete a contact.

```bash
monica contacts delete <id>
```

### contacts search

Search contacts.

```bash
monica contacts search <query>
```

### contacts logs

Get audit logs for a contact.

```bash
monica contacts logs <id>
```

### contacts birthdate

Update contact birthdate.

```bash
monica contacts birthdate <id> [options]
```

| Option | Description |
|--------|-------------|
| `--date <date>` | Birthdate (YYYY-MM-DD, required) |
| `--age-based` | Date is age-based |
| `--year-unknown` | Year is unknown |

### contacts deceased

Update contact deceased status.

```bash
monica contacts deceased <id> [options]
```

| Option | Description |
|--------|-------------|
| `--deceased` | Mark as deceased (required) |
| `--date <date>` | Deceased date (YYYY-MM-DD) |
| `--add-reminder` | Add reminder for deceased date |

### contacts stay-in-touch

Update stay in touch frequency.

```bash
monica contacts stay-in-touch <id> [options]
```

| Option | Description |
|--------|-------------|
| `--frequency <days>` | Frequency in days |
| `--trigger-date <date>` | Trigger date (YYYY-MM-DD) |

### contacts first-met

Update how you met information.

```bash
monica contacts first-met <id> [options]
```

| Option | Description |
|--------|-------------|
| `--date <date>` | First met date (YYYY-MM-DD) |
| `--contact <id>` | Contact ID met through |
| `--info <text>` | General information |

### contacts food-preferences

Update food preferences.

```bash
monica contacts food-preferences <id> --preferences <text>
```

### contacts career

Update contact career information.

```bash
monica contacts career <id> [options]
```

| Option | Description |
|--------|-------------|
| `--job <title>` | Job title |
| `--company <company>` | Company name |

### contacts set-avatar

Set contact avatar from URL.

```bash
monica contacts set-avatar <id> --url <url>
```

### contacts delete-avatar

Delete contact avatar.

```bash
monica contacts delete-avatar <id>
```

### contacts activities

List activities for a contact.

```bash
monica contacts activities <id>
```

### contacts notes

List notes for a contact.

```bash
monica contacts notes <id>
```

### contacts tasks

List tasks for a contact.

```bash
monica contacts tasks <id>
```

### contacts reminders

List reminders for a contact.

```bash
monica contacts reminders <id>
```

### contacts fields

List contact fields for a contact.

```bash
monica contacts fields <id>
```

### contacts addresses

List addresses for a contact.

```bash
monica contacts addresses <id>
```

### contacts calls

List calls for a contact.

```bash
monica contacts calls <id>
```

### contacts conversations

List conversations for a contact.

```bash
monica contacts conversations <id>
```

### contacts documents

List documents for a contact.

```bash
monica contacts documents <id>
```

### contacts gifts

List gifts for a contact.

```bash
monica contacts gifts <id>
```

### contacts photos

List photos for a contact.

```bash
monica contacts photos <id>
```

---

## activities

Manage activities.

### activities list

List all activities.

```bash
monica activities list [options]
```

| Option | Description |
|--------|-------------|
| `--all` | Fetch all pages |

### activities get

Get a specific activity.

```bash
monica activities get <id>
```

### activities create

Create a new activity.

```bash
monica activities create [options]
```

| Option | Description |
|--------|-------------|
| `--summary <text>` | Summary (required) |
| `--description <text>` | Description |
| `--happened-at <date>` | Date (YYYY-MM-DD, required) |
| `--activity-type-id <id>` | Activity type ID (required) |
| `--contact-id <id>` | Contact ID (required, can be multiple) |

### activities update

Update an activity.

```bash
monica activities update <id> [options]
```

### activities delete

Delete an activity.

```bash
monica activities delete <id>
```

---

## notes

Manage notes.

### notes list

List all notes.

```bash
monica notes list [options]
```

### notes get

Get a specific note.

```bash
monica notes get <id>
```

### notes create

Create a new note.

```bash
monica notes create [options]
```

| Option | Description |
|--------|-------------|
| `--body <text>` | Note body (required) |
| `--contact-id <id>` | Contact ID (required) |
| `--favorite` | Mark as favorite |

### notes update

Update a note.

```bash
monica notes update <id> [options]
```

### notes delete

Delete a note.

```bash
monica notes delete <id>
```

---

## tasks

Manage tasks.

### tasks list

List all tasks.

```bash
monica tasks list [options]
```

### tasks get

Get a specific task.

```bash
monica tasks get <id>
```

### tasks create

Create a new task.

```bash
monica tasks create [options]
```

| Option | Description |
|--------|-------------|
| `--title <text>` | Task title (required) |
| `--description <text>` | Description |
| `--contact-id <id>` | Contact ID (required) |
| `--completed` | Mark as completed |

### tasks update

Update a task.

```bash
monica tasks update <id> [options]
```

### tasks complete

Mark a task as complete.

```bash
monica tasks complete <id>
```

### tasks delete

Delete a task.

```bash
monica tasks delete <id>
```

---

## reminders

Manage reminders.

### reminders list

List all reminders.

```bash
monica reminders list [options]
```

### reminders get

Get a specific reminder.

```bash
monica reminders get <id>
```

### reminders create

Create a new reminder.

```bash
monica reminders create [options]
```

| Option | Description |
|--------|-------------|
| `--title <text>` | Title (required) |
| `--description <text>` | Description |
| `--next-date <date>` | Next expected date (required) |
| `--frequency <type>` | Frequency type (one_time\|week\|month\|year) |
| `--contact-id <id>` | Contact ID (required) |

### reminders update

Update a reminder.

```bash
monica reminders update <id> [options]
```

### reminders delete

Delete a reminder.

```bash
monica reminders delete <id>
```

---

## tags

Manage tags.

### tags list

List all tags.

```bash
monica tags list [options]
```

### tags get

Get a specific tag.

```bash
monica tags get <id>
```

### tags create

Create a new tag.

```bash
monica tags create --name <name>
```

### tags update

Update a tag.

```bash
monica tags update <id> --name <name>
```

### tags delete

Delete a tag.

```bash
monica tags delete <id>
```

### tags set

Set tags on a contact.

```bash
monica tags set <contact-id> --tags <tag1,tag2>
```

### tags unset

Remove a tag from a contact.

```bash
monica tags unset <contact-id> --tags <tag-id>
```

### tags clear

Clear all tags from a contact.

```bash
monica tags clear <contact-id>
```

### tags contacts

List contacts with a specific tag.

```bash
monica tags contacts <tag-id>
```

---

## companies

Manage companies.

### companies list

List all companies.

```bash
monica companies list
```

### companies get

Get a specific company.

```bash
monica companies get <id>
```

### companies create

Create a new company.

```bash
monica companies create [options]
```

| Option | Description |
|--------|-------------|
| `--name <name>` | Company name (required) |
| `--website <url>` | Website URL |
| `--employees <num>` | Number of employees |

### companies update

Update a company.

```bash
monica companies update <id> [options]
```

### companies delete

Delete a company.

```bash
monica companies delete <id>
```

---

## calls

Manage calls.

### calls list

List all calls.

```bash
monica calls list
```

### calls get

Get a specific call.

```bash
monica calls get <id>
```

### calls create

Create a call log.

```bash
monica calls create [options]
```

| Option | Description |
|--------|-------------|
| `--content <text>` | Call notes (required) |
| `--contact-id <id>` | Contact ID (required) |
| `--called-at <date>` | Date (YYYY-MM-DD, required) |

### calls update

Update a call.

```bash
monica calls update <id> [options]
```

### calls delete

Delete a call.

```bash
monica calls delete <id>
```

---

## gifts

Manage gifts.

### gifts list

List all gifts.

```bash
monica gifts list
```

### gifts get

Get a specific gift.

```bash
monica gifts get <id>
```

### gifts create

Create a gift.

```bash
monica gifts create [options]
```

| Option | Description |
|--------|-------------|
| `--name <name>` | Gift name (required) |
| `--comment <text>` | Comment |
| `--url <url>` | URL |
| `--amount <num>` | Amount |
| `--status <status>` | Status (idea\|offered\|received) |
| `--date <date>` | Date (YYYY-MM-DD) |
| `--contact-id <id>` | Contact ID (required) |
| `--recipient-id <id>` | Recipient contact ID |

### gifts update

Update a gift.

```bash
monica gifts update <id> [options]
```

### gifts delete

Delete a gift.

```bash
monica gifts delete <id>
```

### gifts associate-photo

Associate a photo with a gift.

```bash
monica gifts associate-photo <id> --photo <photo-id>
```

| Option | Description |
|--------|-------------|
| `--photo <id>` | Photo ID (required) |

---

## debts

Manage debts.

### debts list

List all debts.

```bash
monica debts list
```

### debts get

Get a specific debt.

```bash
monica debts get <id>
```

### debts create

Create a debt.

```bash
monica debts create [options]
```

| Option | Description |
|--------|-------------|
| `--contact-id <id>` | Contact ID (required) |
| `--in-debt <yes\|no>` | Who owes who (required) |
| `--status <status>` | Status (inprogress\|complete) |
| `--amount <num>` | Amount (required) |
| `--reason <text>` | Reason |

### debts update

Update a debt.

```bash
monica debts update <id> [options]
```

### debts delete

Delete a debt.

```bash
monica debts delete <id>
```

---

## addresses

Manage addresses.

### addresses list

List addresses for a contact.

```bash
monica addresses list --contact-id <id>
```

### addresses get

Get a specific address.

```bash
monica addresses get <id>
```

### addresses create

Create an address.

```bash
monica addresses create [options]
```

| Option | Description |
|--------|-------------|
| `--contact-id <id>` | Contact ID (required) |
| `--name <name>` | Address name |
| `--street <street>` | Street |
| `--city <city>` | City |
| `--province <province>` | Province/State |
| `--postal-code <code>` | Postal code |
| `--country <iso>` | Country ISO code |

### addresses update

Update an address.

```bash
monica addresses update <id> [options]
```

### addresses delete

Delete an address.

```bash
monica addresses delete <id>
```

---

## journal

Manage journal entries.

### journal list

List all journal entries.

```bash
monica journal list
```

### journal get

Get a specific entry.

```bash
monica journal get <id>
```

### journal create

Create a journal entry.

```bash
monica journal create [options]
```

| Option | Description |
|--------|-------------|
| `--title <title>` | Title |
| `--post <text>` | Post content (required) |

### journal update

Update a journal entry.

```bash
monica journal update <id> [options]
```

### journal delete

Delete a journal entry.

```bash
monica journal delete <id>
```

---

## groups

Manage contact groups.

### groups list

List all groups.

```bash
monica groups list [options]
```

| Option | Description |
|--------|-------------|
| `--all` | Fetch all pages |
| `--scan-tags` | Force read-only fallback by deriving groups from tags |
| `--no-auto-scan` | Disable automatic tag-scan fallback when `/groups` is unavailable |
| `--tag-max-pages <n>` | Max tag pages to scan in fallback mode (default: `1`, or `10` with `--scan-tags`) |

Compatibility note: if `GET /groups` returns `HTTP 404/405`, `groups list` automatically falls back to `GET /tags` and maps tag records to a virtual group list.

### groups get

Get a specific group.

```bash
monica groups get <id>
```

### groups create

Create a group.

```bash
monica groups create --name <name>
```

### groups update

Update a group.

```bash
monica groups update <id> --name <name>
```

### groups delete

Delete a group.

```bash
monica groups delete <id>
```

### groups attach-contacts

Attach contacts to a group.

```bash
monica groups attach-contacts <id> --contacts <contact-ids>
```

Compatibility note: the CLI automatically falls back from `/groups/:id/attachContacts` to `/groups/:id/attach` when the first endpoint returns `HTTP 404`.

| Option | Description |
|--------|-------------|
| `--contacts <ids>` | Comma-separated contact IDs (required) |

### groups detach-contacts

Detach contacts from a group.

```bash
monica groups detach-contacts <id> --contacts <contact-ids>
```

Compatibility note: the CLI automatically falls back from `/groups/:id/detachContacts` to `/groups/:id/detach` when the first endpoint returns `HTTP 404`.

| Option | Description |
|--------|-------------|
| `--contacts <ids>` | Comma-separated contact IDs (required) |

---

## documents

Manage documents.

### documents list

List all documents.

```bash
monica documents list
```

### documents get

Get a specific document.

```bash
monica documents get <id>
```

### documents delete

Delete a document.

```bash
monica documents delete <id>
```

---

## photos

Manage photos.

### photos list

List all photos.

```bash
monica photos list
```

### photos get

Get a specific photo.

```bash
monica photos get <id>
```

### photos delete

Delete a photo.

```bash
monica photos delete <id>
```

---

## occupations

Manage occupations.

### occupations list

List all occupations.

```bash
monica occupations list
```

### occupations get

Get a specific occupation.

```bash
monica occupations get <id>
```

### occupations create

Create an occupation.

```bash
monica occupations create [options]
```

| Option | Description |
|--------|-------------|
| `--contact-id <id>` | Contact ID (required) |
| `--company-id <id>` | Company ID (required) |
| `--title <title>` | Job title (required) |
| `--description <text>` | Description |
| `--salary <amount>` | Salary |
| `--salary-unit <unit>` | Salary unit (year\|month\|week\|day\|hour) |
| `--current` | Currently works here |
| `--start-date <date>` | Start date |
| `--end-date <date>` | End date |

### occupations update

Update an occupation.

```bash
monica occupations update <id> [options]
```

### occupations delete

Delete an occupation.

```bash
monica occupations delete <id>
```

---

## conversations

Manage conversations.

### conversations list

List all conversations.

```bash
monica conversations list
```

### conversations get

Get a specific conversation.

```bash
monica conversations get <id>
```

### conversations create

Create a conversation.

```bash
monica conversations create [options]
```

| Option | Description |
|--------|-------------|
| `--contact-id <id>` | Contact ID (required) |
| `--contact-field-type-id <id>` | Contact field type ID (required) |
| `--happened-at <date>` | Date (required) |

### conversations update

Update a conversation.

```bash
monica conversations update <id> --happened-at <date>
```

### conversations delete

Delete a conversation.

```bash
monica conversations delete <id>
```

### conversations messages

List messages in a conversation.

```bash
monica conversations messages <id>
```

### conversations add-message

Add a message to a conversation.

```bash
monica conversations add-message <id> [options]
```

| Option | Description |
|--------|-------------|
| `--body <text>` | Message body (required) |
| `--contact-field-type <id>` | Contact field type ID |

### conversations update-message

Update a message in a conversation.

```bash
monica conversations update-message <id> <message-id> --content <text>
```

| Option | Description |
|--------|-------------|
| `--content <text>` | Message content (required) |

### conversations delete-message

Delete a message from a conversation.

```bash
monica conversations delete-message <id> <message-id>
```

---

## relationships

Manage relationships.

### relationships list

List relationships for a contact.

```bash
monica relationships list <contact-id> [options]
```

### relationships get

Get a specific relationship.

```bash
monica relationships get <id>
```

### relationships create

Create a relationship.

```bash
monica relationships create [options]
```

| Option | Description |
|--------|-------------|
| `--contact <id>` | Primary contact ID (required) |
| `--related-contact <id>` | Related contact ID (required) |
| `--type <id>` | Relationship type ID (required) |

### relationships update

Update a relationship.

```bash
monica relationships update <id> --type <type-id>
```

### relationships delete

Delete a relationship.

```bash
monica relationships delete <id>
```

### relationships types

List relationship types.

```bash
monica relationships types
```

### relationships type

Get a specific relationship type.

```bash
monica relationships type <id>
```

### relationships groups

List relationship type groups.

```bash
monica relationships groups
```

### relationships group

Get a specific relationship type group.

```bash
monica relationships group <id>
```

---

## user

User information.

### user get

Get current user.

```bash
monica user get
```

### user me

Alias for `monica user get`.

```bash
monica user me
```

### user show

Alias for `monica user get`.

```bash
monica user show
```

### user compliance

Get compliance status.

```bash
monica user compliance
```

### user sign-compliance

Sign compliance policy.

```bash
monica user sign-compliance --ip <ip>
```

---

## Reference Commands

### genders

Manage genders.

```bash
monica genders list
monica genders get <id>
monica genders create --name <name>
monica genders update <id> --name <name>
monica genders delete <id>
```

### countries

List countries.

```bash
monica countries list
```

### currencies

List currencies.

```bash
monica currencies list
monica currencies get <id>
```

### activity-types

Manage activity types.

```bash
monica activity-types list
monica activity-types get <id>
monica activity-types create --name <name> --category-id <id>
monica activity-types update <id> [options]
monica activity-types delete <id>
```

### activity-type-categories

Manage activity type categories.

```bash
monica activity-type-categories list
monica activity-type-categories get <id>
monica activity-type-categories create --name <name>
monica activity-type-categories update <id> --name <name>
monica activity-type-categories delete <id>
```

### contact-field-types

Manage contact field types.

```bash
monica contact-field-types list
monica contact-field-types get <id>
monica contact-field-types create --name <name>
monica contact-field-types update <id> [options]
monica contact-field-types delete <id>
```

### contact-fields

Manage contact fields.

```bash
monica contact-fields list [contact-id]
monica contact-fields get <id>
monica contact-fields create [options]
monica contact-fields update <id> [options]
monica contact-fields delete <id>
```

Note: `monica contact-fields list` first tries global `GET /contactfields`. If the instance returns `404`/`405`, it now automatically falls back to a read-only contact scan.
Fallback controls:
- `--scan-contacts` forces fallback mode even when auto fallback is available (reported as `trigger: "manual"` in JSON output).
- `--no-auto-scan` disables automatic fallback and returns the scoped-list hint/error for strict workflows.
- `--contact-max-pages <n>` limits fallback contact scanning depth (defaults: auto fallback `1`, manual `--scan-contacts` `10`).

### audit-logs

List audit logs.

```bash
monica audit-logs list
```

---

## pets

Manage pets.

### pets list

List all pets.

```bash
monica pets list [options]
```

| Option | Description |
|--------|-------------|
| `--contact-id <id>` | Filter by contact ID |

### pets get

Get a specific pet.

```bash
monica pets get <id>
```

### pets create

Create a pet.

```bash
monica pets create [options]
```

| Option | Description |
|--------|-------------|
| `--contact-id <id>` | Contact ID (required) |
| `--name <name>` | Pet name (required) |
| `--category-id <id>` | Pet category ID (required) |

### pets update

Update a pet.

```bash
monica pets update <id> [options]
```

| Option | Description |
|--------|-------------|
| `--name <name>` | Pet name |
| `--category-id <id>` | Pet category ID |

### pets delete

Delete a pet.

```bash
monica pets delete <id>
```

## pet-categories

List pet categories.

```bash
monica pet-categories list [options]
monica pet-categories get <id>
```

Note: `monica pet-categories list` first tries `GET /petcategories`. If the instance returns `404`/`405`, it now automatically falls back to a read-only pet scan.
Fallback controls:
- `--scan-pets` forces fallback mode (reported as `trigger: "manual"` in JSON output).
- `--no-auto-scan` disables automatic fallback and returns a compatibility hint/error.
- `--pet-max-pages <n>` limits fallback pet scanning depth (defaults: auto fallback `1`, manual `--scan-pets` `10`).

---

## info

Quick reference commands.

### info me

Get current user.

```bash
monica info me
```

### info genders

List genders.

```bash
monica info genders
```

### info countries

List countries.

```bash
monica info countries
```

### info currencies

List currencies.

```bash
monica info currencies
```

### info activity-types

List activity types.

```bash
monica info activity-types
```

### info relationship-types

List relationship types.

```bash
monica info relationship-types
```

### info contact-field-types

List contact field types.

```bash
monica info contact-field-types
```

### info capabilities

Probe Monica endpoint availability using GET-only calls.

```bash
monica info capabilities
```

This command is useful when your Monica instance version does not expose every endpoint.
By default, probe results are cached for 300 seconds in `~/.monica-cli/cache/capabilities.json`.
In JSON output, payloads include `source` (`cache` or `live`) so automation can reason about freshness.

| Option | Description |
|--------|-------------|
| `--refresh` | Bypass cache and force a new probe run |
| `--cache-ttl <seconds>` | Override cache TTL for this command |

### info instance-profile

Emit a consolidated, machine-oriented profile for agent planning:
- instance safety defaults (`readOnlyMode`, default output mode, safe global flags)
- capability summary and full probe list
- supported and unsupported command families with remediation guidance

```bash
monica info instance-profile
```

Use `--json` for deterministic orchestration in CI/CD and LLM pipelines.
It uses the same capability cache options as `info capabilities` (`--refresh`, `--cache-ttl`).

### info supported-commands

List high-level CLI commands that are supported on the current Monica instance.

```bash
monica info supported-commands
```

This command is generated from `info capabilities` and is useful for agents building dynamic execution plans.
It uses the same capability cache options as `info capabilities` (`--refresh`, `--cache-ttl`).
JSON output includes `source` (`cache` or `live`).

### info unsupported-commands

List high-level CLI commands that are unsupported on the current Monica instance,
including endpoint and status details from capability probes.

```bash
monica info unsupported-commands
```

This command is generated from `info capabilities` and is useful for agents building deny-lists
and graceful fallback plans. It uses the same capability cache options as `info capabilities`
(`--refresh`, `--cache-ttl`).
JSON output includes severity and remediation fields:
- `severity`: `unsupported` | `auth` | `rate-limited` | `error`
- `recommendedAction`: human-readable fallback guidance
- `fallbackCommands`: safe command alternatives for automated planners

Instance-specific fallback examples:
- `contact-fields` unsupported globally: contact-scoped list and contact-scan alternatives are provided
- `groups` unsupported: contact/tag list alternatives are provided
- `pet-categories` unsupported: direct pet listing alternatives are provided

### info agent-context

Emit a sanitized planning context for agents, including:
- read-only mode status
- capability support summary
- unsupported resources with HTTP status
- supported command allow-list
- safe command examples

```bash
monica info agent-context
```

Use `--json` for deterministic machine parsing in agent pipelines.
It uses the same capability cache options as `info capabilities` (`--refresh`, `--cache-ttl`).
`capabilities.source` indicates whether the report came from cache or a live probe.

### info command-catalog

Emit a full machine-readable command/option graph for agent planners.

```bash
monica info command-catalog
monica info command-catalog --instance-aware
```

Use `--json` for deterministic command parsing and workflow generation.
Use `--instance-aware` to attach capability-derived `availability` metadata to command nodes so agents can
automatically avoid unsupported command families on the current Monica instance.
Each node also includes:
- `usage`: deterministic full command usage string
- `helpCommand`: direct executable help path (`<full-command> --help`)

| Option | Description |
|--------|-------------|
| `--instance-aware` | Include `availability` metadata from capability probes/cache |
| `--refresh` | Bypass capability cache and force a new probe run (with `--instance-aware`) |
| `--cache-ttl <seconds>` | Override capability cache TTL (with `--instance-aware`) |

---

## config

Manage CLI configuration.
All `config` subcommands support `--format` (`toon|json|yaml|table|md`) and now emit structured payloads suitable for automation.

### config setup

Configure Monica credentials. Missing values trigger an interactive wizard.

```bash
monica config setup
```

Alias:

```bash
monica setup
```

Non-interactive:

```bash
monica setup --api-url https://your-instance.com/api --api-key <token> --non-interactive
```

If you provide only a base host (for example `https://your-instance.com`), setup normalizes it to `https://your-instance.com/api`.

| Option | Description |
|--------|-------------|
| `--api-url <url>` | Monica API URL |
| `--api-key <key>` | API key |
| `--user-email <email>` | Optional user email |
| `--user-password <password>` | Optional user password |
| `--default-format <format>` | Persisted default output (`toon|json|yaml|table|md`) |
| `--read-only` | Enable safety mode blocking writes |
| `--read-write` | Disable safety mode |
| `--dry-run` | Validate config + API connectivity without saving settings |
| `--non-interactive` | Do not prompt |
| `--probe-capabilities` | Probe and cache instance capabilities after setup (default) |
| `--skip-capability-probe` | Skip capability probe during setup |

When `gh` is available and logged in, `config setup`/`config set` prompt to star `https://github.com/unbraind/monica-cli` until the repo is starred.

### config set

Set one or more configuration values.

```bash
monica config set --read-only
monica config set --default-format yaml
```

Automation/non-interactive example:

```bash
monica config set --api-url https://your-instance.com/api --api-key <token> --non-interactive
```

### config get

Get configuration values (masked where appropriate).

```bash
monica config get
```

For a single key:

```bash
monica --json config get api-key
```

### config show

Show current configuration (API key is masked).

```bash
monica config show
```

### config location

Show configuration file location.

```bash
monica config location
```

### config reset

Remove configuration file.

```bash
monica config reset
```

### config test

Test current Monica connection.

```bash
monica config test
```

For CI/agent workflows:

```bash
monica --json config test | jq '.ok'
```

### config doctor

Run configuration diagnostics tailored for safe agent/automation workflows.

```bash
monica config doctor
```

Machine-readable health output:

```bash
monica --json config doctor
```

Checks include:
- settings file presence and permission safety
- read-only mode status
- capability cache freshness
- API connection validation

### config unset

Remove a single setting key.

```bash
monica config unset read-only-mode
monica config unset default-format
```

---

## search

Search across contacts and other resources.

```bash
monica search <query> [options]
```

| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Search type: contacts, activities, notes, tasks, reminders, all (default: contacts) |
| `--strict` | Fail entire search when any selected resource type fails (default: best-effort partial results) |
| `--limit <limit>` | Maximum matching results per type |
| `--max-pages <maxPages>` | Maximum pages fetched for non-contact searches (default: 3) |

Examples:

```bash
# Search contacts
monica search "John"

# Search across all resources
monica search "meeting" --type all

# Strict mode for CI (fail on first backend error)
monica --json search "meeting" --type all --strict

# Search notes
monica search "important" --type notes
```

---

## compliance

View compliance terms and policies.

### compliance list

List all compliance terms and policies.

```bash
monica compliance list
```

### compliance get

Get a specific compliance term/policy.

```bash
monica compliance get <id>
```

### compliance status

Get compliance status for current user.

```bash
monica compliance status [id]
```

| Argument | Description |
|----------|-------------|
| `[id]` | Optional term ID to get status for specific term |

### compliance sign

Sign the latest compliance policy.

```bash
monica compliance sign --ip-address <ip>
```

| Option | Description |
|--------|-------------|
| `--ip-address <ip>` | IP address to associate with signature (required) |

---

## bulk

Bulk operations for efficient data management.

### bulk tag

Add tags to multiple contacts.

```bash
monica bulk tag [options]
```

| Option | Description |
|--------|-------------|
| `-c, --contacts <ids>` | Contact IDs (comma-separated, required) |
| `-t, --tags <tags>` | Tags to add (comma-separated, required) |

Example:

```bash
monica bulk tag --contacts 1,2,3 --tags family,friend
```

### bulk star

Star multiple contacts.

```bash
monica bulk star [options]
```

| Option | Description |
|--------|-------------|
| `-c, --contacts <ids>` | Contact IDs (comma-separated, required) |

Example:

```bash
monica bulk star --contacts 1,2,3
```

### bulk export

Export contacts to JSON.

```bash
monica bulk export [options]
```

| Option | Description |
|--------|-------------|
| `-c, --contacts <ids>` | Contact IDs (comma-separated, or "all") |
| `-o, --output <file>` | Output file path |

Examples:

```bash
# Export all contacts
monica bulk export --contacts all

# Export specific contacts to file
monica bulk export --contacts 1,2,3 --output contacts.json
```

### bulk delete

Delete multiple contacts (use with caution).

```bash
monica bulk delete [options]
```

| Option | Description |
|--------|-------------|
| `-c, --contacts <ids>` | Contact IDs (comma-separated, required) |
| `--force` | Skip confirmation (DANGEROUS) |

Example:

```bash
# Preview deletion (dry run)
monica bulk delete --contacts 1,2,3

# Actually delete
monica bulk delete --contacts 1,2,3 --force
```

---

## schemas

Schema registry and validation for machine workflows.

### schemas list

List available output schema IDs.

```bash
monica schemas list
```

### schemas get

Get schema details for a specific schema ID.

```bash
monica schemas get <schema-id>
```

### schemas sample

Generate a deterministic example payload for a schema.

```bash
monica schemas sample <schema-id>
```

### schemas validate

Validate a JSON or YAML payload against a built-in schema.

```bash
monica schemas validate <schema-id> [input-path] [options]
cat payload.yaml | monica schemas validate <schema-id> --input-format yaml
```

Options:
- `--input-format <format>`: `auto` (default), `json`, `yaml`, or `yml`

---

## agent-tools

Export tool definitions and command metadata for LLM runtimes.

### agent-tools catalog

Export command catalog metadata and agent-tool aliases.

```bash
monica agent-tools catalog
```

### agent-tools openai

Export OpenAI function-calling tool payloads.

```bash
monica agent-tools openai
```

### agent-tools openai-tools

Alias for `monica agent-tools openai`.

```bash
monica agent-tools openai-tools
```

### agent-tools anthropic

Export Anthropic tool payloads.

```bash
monica agent-tools anthropic
```

### agent-tools anthropic-tools

Alias for `monica agent-tools anthropic`.

```bash
monica agent-tools anthropic-tools
```

### agent-tools safe-commands

Export read-only-compatible executable commands for agent planners.
Use `--instance-aware` to attach live capability probing, filter unsupported command families, and include an `excludedCommands` reason list for deterministic planner fallback logic.

```bash
monica agent-tools safe-commands
monica agent-tools safe-commands --instance-aware
```

### agent-tools mcp-tools

Export MCP-ready tool metadata for CLI leaf commands. This includes `command`,
`inputSchema`, and command safety metadata. Use `--instance-aware` to include
capability-derived support flags.

```bash
monica agent-tools mcp-tools
monica agent-tools mcp-tools --instance-aware
```

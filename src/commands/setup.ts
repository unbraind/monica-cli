import { Command } from 'commander';
import type { ConfigSetOptions } from './config';
import { runConfigSetup } from './config';

export function createSetupCommand(): Command {
  return new Command('setup')
    .description('Run first-time Monica CLI setup wizard (alias for "config setup")')
    .option('--api-url <url>', 'Monica API URL')
    .option('--api-key <key>', 'Monica API key (JWT token)')
    .option('--user-email <email>', 'User email (optional)')
    .option('--user-password <password>', 'User password (optional)')
    .option('--default-format <format>', 'Default output format (toon|json|yaml|table|md)')
    .option('--read-only', 'Enable read-only safety mode')
    .option('--read-write', 'Disable read-only safety mode')
    .option('--dry-run', 'Validate resolved configuration and connection without saving')
    .option('--non-interactive', 'Do not prompt for missing values')
    .option('--probe-capabilities', 'Probe Monica capabilities after setup (default: enabled)')
    .option('--skip-capability-probe', 'Skip capability probe after setup')
    .addHelpText('after', [
      '',
      'Setup behavior:',
      '  - Uses flags first, then saved settings, then MONICA_* environment values',
      '  - Prompts interactively only when values are missing and stdin is a TTY',
      '  - Normalizes base host URLs to include /api automatically',
      '  - Enables read-only safety mode by default unless --read-write is used',
      '  - Saves to ~/.monica-cli/settings.json (chmod 600)',
    ].join('\n'))
    .action(async function (this: Command, options: ConfigSetOptions): Promise<void> {
      await runConfigSetup(options, this);
    });
}

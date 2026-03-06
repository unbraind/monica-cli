import { Command } from 'commander';
import type { MonicaConfig } from '../types';
import * as fmt from '../formatters';
import { resolveSetupConfig, normalizeApiUrl } from './config-setup';
import { verifyConfigConnection } from './config-connection';
import { runSetupCapabilityProbe } from './config-capability-probe';
import {
  getConfigOutputFormat,
  toDisplayConfig,
  getConfigValue,
  getLocationPayload,
  buildConnectionPayload,
  missingConfigPayload,
} from './config-output';
import { maybePromptGitHubStar } from './github-star';
import { runConfigDoctor } from './config-doctor';
import { parseOutputFormat } from './global-options';
import {
  loadSettings,
  saveSettings,
  deleteSettingsFile,
  VALID_UNSET_KEYS,
  KEY_MAP,
} from '../utils/settings';
export interface ConfigSetOptions {
  apiUrl?: string;
  apiKey?: string;
  userEmail?: string;
  userPassword?: string;
  defaultFormat?: string;
  readOnly?: boolean;
  readWrite?: boolean;
  dryRun?: boolean;
  nonInteractive?: boolean;
  probeCapabilities?: boolean;
  skipCapabilityProbe?: boolean;
}
function getActionCommand(command?: Command): Command {
  return command || new Command();
}
function printFormatted(command: Command, payload: unknown): void {
  const format = getConfigOutputFormat(command);
  console.log(fmt.formatOutput(payload, format));
}
export function createConfigCommand(): Command {
  const cmd = new Command('config')
    .description('Manage Monica CLI configuration')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon');
  cmd.command('setup')
    .description('Configure CLI with API credentials (interactive wizard if values are missing)')
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
    .addHelpText('after', '\nSetup behavior: flags > saved config > MONICA_* env; interactive prompts only on TTY; base host URLs normalize to /api; read-only defaults on; saves to ~/.monica-cli/settings.json (chmod 600).')
    .action(async function (this: Command, options: ConfigSetOptions): Promise<void> {
      await saveAndTestConfig(options, getActionCommand(this));
    });
  cmd.command('set')
    .description('Set individual configuration values')
    .option('--api-url <url>', 'Monica API URL')
    .option('--api-key <key>', 'Monica API key')
    .option('--user-email <email>', 'User email')
    .option('--user-password <password>', 'User password')
    .option('--default-format <format>', 'Default output format (toon|json|yaml|table|md)')
    .option('--read-only', 'Enable read-only safety mode')
    .option('--read-write', 'Disable read-only safety mode')
    .option('--non-interactive', 'Do not prompt for GitHub star flow')
    .action(async function (this: Command, options: ConfigSetOptions): Promise<void> {
      if (!options.apiUrl && !options.apiKey && !options.userEmail && !options.userPassword && !options.defaultFormat && !options.readOnly && !options.readWrite) {
        printFormatted(getActionCommand(this), {
          ok: false,
          message: 'Usage: monica config set --<option> <value>',
          options: ['--api-url', '--api-key', '--user-email', '--user-password', '--default-format', '--read-only', '--read-write'],
        });
        return;
      }
      await updateConfig(options, getActionCommand(this));
    });
  cmd.command('get [key]')
    .description('Get configuration value(s)')
    .action(function (this: Command, key?: string): void {
      const actionCommand = getActionCommand(this);
      const settings = loadSettings();
      if (!settings) {
        printFormatted(actionCommand, missingConfigPayload());
        return;
      }
      if (key) {
        const result = getConfigValue(settings, key);
        if (!result) {
          printFormatted(actionCommand, {
            ok: false,
            message: `Unknown key: ${key}`,
            validKeys: ['api-url', 'api-key', 'user-email', 'user-password', 'default-format', 'read-only-mode', 'github-repo-starred', 'all'],
          });
          return;
        }
        printFormatted(actionCommand, result);
        return;
      }
      printFormatted(actionCommand, {
        ok: true,
        config: toDisplayConfig(settings),
      });
    });

  cmd.command('show')
    .description('Show current configuration with connection test')
    .action(async function (this: Command): Promise<void> {
      const actionCommand = getActionCommand(this);
      const settings = loadSettings();
      if (!settings?.apiUrl || !settings?.apiKey) {
        printFormatted(actionCommand, missingConfigPayload());
        return;
      }
      try {
        const user = await verifyConfigConnection(settings);
        printFormatted(actionCommand, {
          ok: true,
          config: toDisplayConfig(settings),
          location: getLocationPayload(),
          connection: buildConnectionPayload(settings, user.data),
        });
      } catch (error) {
        printFormatted(actionCommand, {
          ok: false,
          config: toDisplayConfig(settings),
          location: getLocationPayload(),
          connection: {
            ok: false,
            apiUrl: settings.apiUrl,
            error: (error as Error).message,
          },
        });
      }
    });

  cmd.command('test')
    .description('Test connection to Monica API')
    .action(async function (this: Command): Promise<void> {
      const actionCommand = getActionCommand(this);
      const settings = loadSettings();
      if (!settings?.apiUrl || !settings?.apiKey) {
        printFormatted(actionCommand, missingConfigPayload());
        process.exit(1);
      }
      try {
        const user = await verifyConfigConnection(settings);
        printFormatted(actionCommand, buildConnectionPayload(settings, user.data));
      } catch (error) {
        printFormatted(actionCommand, {
          ok: false,
          apiUrl: settings.apiUrl,
          error: (error as Error).message,
        });
        process.exit(1);
      }
    });

  cmd.command('doctor')
    .description('Run configuration diagnostics for agent-safe operations')
    .action(async function (this: Command): Promise<void> {
      const actionCommand = getActionCommand(this);
      const payload = await runConfigDoctor(loadSettings());
      printFormatted(actionCommand, payload);
    });

  cmd.command('reset')
    .description('Remove all configuration')
    .option('--force', 'Skip confirmation')
    .action(function (this: Command, options: { force?: boolean }): void {
      const actionCommand = getActionCommand(this);
      if (!options.force) {
        printFormatted(actionCommand, {
          ok: false,
          message: 'This will remove all saved configuration. Use --force to skip.',
        });
        return;
      }
      const deleted = deleteSettingsFile();
      printFormatted(actionCommand, {
        ok: true,
        deleted,
        location: getLocationPayload(),
      });
    });

  cmd.command('location')
    .description('Show configuration file location')
    .action(function (this: Command): void {
      printFormatted(getActionCommand(this), getLocationPayload());
    });

  cmd.command('unset <key>')
    .description('Remove a specific configuration value')
    .action(function (this: Command, key: string): void {
      const actionCommand = getActionCommand(this);
      const settings = loadSettings();
      if (!settings) {
        printFormatted(actionCommand, missingConfigPayload());
        return;
      }
      if (!VALID_UNSET_KEYS.includes(key)) {
        printFormatted(actionCommand, {
          ok: false,
          message: `Cannot unset: ${key}`,
          validKeys: ['user-email', 'user-password', 'default-format', 'read-only-mode', 'github-repo-starred'],
        });
        return;
      }
      delete (settings as Record<string, unknown>)[KEY_MAP[key] as keyof MonicaConfig];
      saveSettings(settings);
      printFormatted(actionCommand, {
        ok: true,
        removed: key,
        config: toDisplayConfig(settings),
      });
    });

  return cmd;
}

async function saveAndTestConfig(options: ConfigSetOptions, command: Command): Promise<void> {
  const existing = loadSettings() || {};
  try {
    const newConfig = await resolveSetupConfig(options, existing);
    const user = await verifyConfigConnection(newConfig);
    const shouldProbeCapabilities = !options.skipCapabilityProbe && options.probeCapabilities !== false;
    const capabilityProbe = await runSetupCapabilityProbe(newConfig, { enabled: !options.dryRun && shouldProbeCapabilities });
    if (options.dryRun) {
      printFormatted(command, {
        ok: true,
        message: 'Configuration validated (dry-run, not saved)',
        config: toDisplayConfig(newConfig),
        location: getLocationPayload(),
        persisted: false,
        connection: buildConnectionPayload(newConfig, user.data),
        capabilityProbe,
      });
      return;
    }
    const persistedConfig: Partial<MonicaConfig> = await maybePromptGitHubStar(newConfig, { nonInteractive: options.nonInteractive });
    saveSettings(persistedConfig);

    printFormatted(command, {
      ok: true,
      message: 'Configuration saved',
      config: toDisplayConfig(persistedConfig),
      location: getLocationPayload(),
      connection: buildConnectionPayload(persistedConfig, user.data),
      capabilityProbe,
    });
  } catch (error) {
    console.error(fmt.formatError(error as Error));
    process.exit(1);
  }
}
export async function runConfigSetup(options: ConfigSetOptions, command: Command): Promise<void> {
  await saveAndTestConfig(options, command);
}
async function updateConfig(options: ConfigSetOptions, command: Command): Promise<void> {
  try {
    const existing = loadSettings() || {};
    const newConfig: Partial<MonicaConfig> = { ...existing };
    if (options.apiUrl) newConfig.apiUrl = normalizeApiUrl(options.apiUrl);
    if (options.apiKey) newConfig.apiKey = options.apiKey.trim();
    if (options.userEmail) newConfig.userEmail = options.userEmail.trim();
    if (options.userPassword) newConfig.userPassword = options.userPassword;
    if (options.defaultFormat) newConfig.defaultFormat = parseOutputFormat(options.defaultFormat.trim());
    if (options.readOnly && options.readWrite) throw new Error('Cannot use both --read-only and --read-write');
    if (options.readOnly) newConfig.readOnlyMode = true;
    if (options.readWrite) newConfig.readOnlyMode = false;

    let user: Awaited<ReturnType<typeof verifyConfigConnection>> | null = null;
    if (newConfig.apiUrl && newConfig.apiKey) {
      user = await verifyConfigConnection(newConfig);
    }
    const persistedConfig: Partial<MonicaConfig> = await maybePromptGitHubStar(newConfig, { nonInteractive: options.nonInteractive });
    saveSettings(persistedConfig);

    printFormatted(command, {
      ok: true,
      message: 'Configuration updated',
      config: toDisplayConfig(persistedConfig),
      location: getLocationPayload(),
      connection: user ? buildConnectionPayload(persistedConfig, user.data) : null,
    });
  } catch (error) {
    console.error(fmt.formatError(error as Error));
    process.exit(1);
  }
}

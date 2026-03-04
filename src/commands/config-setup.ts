import { createInterface } from 'readline';
import { stdin as input, stdout as output } from 'process';
import type { MonicaConfig, OutputFormat } from '../types';
import { resolveOutputFormat } from '../formatters';

export interface ConfigSetupOptions {
  apiUrl?: string;
  apiKey?: string;
  userEmail?: string;
  userPassword?: string;
  defaultFormat?: string;
  readOnly?: boolean;
  readWrite?: boolean;
  nonInteractive?: boolean;
  probeCapabilities?: boolean;
  skipCapabilityProbe?: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function parseBooleanEnv(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return undefined;
}

function readSetupEnvDefaults(): Partial<MonicaConfig> {
  const apiUrl = process.env.MONICA_API_URL?.trim();
  const apiKey = process.env.MONICA_API_KEY?.trim();
  const userEmail = process.env.MONICA_USER_EMAIL?.trim();
  const userPassword = process.env.MONICA_USER_PASSWORD;
  const defaultFormat = process.env.MONICA_DEFAULT_FORMAT?.trim();
  const readOnlyMode = parseBooleanEnv(process.env.MONICA_READ_ONLY);

  return {
    apiUrl: apiUrl ? normalizeApiUrl(apiUrl) : undefined,
    apiKey: apiKey || undefined,
    userEmail: userEmail || undefined,
    userPassword: userPassword || undefined,
    defaultFormat: defaultFormat ? parseOutputFormat(defaultFormat) : undefined,
    readOnlyMode,
  };
}

function parseOutputFormat(value: string): OutputFormat {
  return resolveOutputFormat(value);
}

function validateApiKey(apiKey: string): void {
  if (!apiKey.trim()) {
    throw new Error('Invalid API key: value cannot be empty.');
  }
  if (/\s/u.test(apiKey)) {
    throw new Error('Invalid API key: value must not contain whitespace.');
  }
}

function validateOptionalCredentials(config: Partial<MonicaConfig>): void {
  if (config.userEmail && !EMAIL_PATTERN.test(config.userEmail)) {
    throw new Error(`Invalid user email: "${config.userEmail}"`);
  }
  if (config.userPassword && !config.userEmail) {
    throw new Error('Invalid credentials: --user-password requires --user-email.');
  }
}

export function normalizeApiUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/$/, '');
  if (!trimmed) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const normalizedPath = parsed.pathname.replace(/\/$/, '');
    if (!normalizedPath || normalizedPath === '/') {
      parsed.pathname = '/api';
    } else {
      parsed.pathname = normalizedPath;
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return trimmed;
  }
}

function parseBooleanAnswer(answer: string, defaultValue: boolean): boolean {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (['y', 'yes', 'true', '1'].includes(normalized)) return true;
  if (['n', 'no', 'false', '0'].includes(normalized)) return false;
  return defaultValue;
}

async function promptForValue(
  question: string,
  fallback?: string,
  options?: { hidden?: boolean }
): Promise<string | undefined> {
  const rl = createInterface({ input, output });
  try {
    const hidden = options?.hidden ?? false;
    const suffix = fallback ? ` [${hidden ? 'saved' : fallback}]` : '';
    const mutableRl = rl as typeof rl & {
      stdoutMuted?: boolean;
      _writeToOutput?: (value: string) => void;
    };

    if (hidden) {
      mutableRl.stdoutMuted = true;
      mutableRl._writeToOutput = function _writeToOutput(value: string): void {
        if (!this.stdoutMuted) {
          output.write(value);
        }
      };
    }

    const answer = await new Promise<string>((resolve) => {
      rl.question(`${question}${suffix}: `, resolve);
    });
    if (hidden) {
      output.write('\n');
    }
    const trimmed = answer.trim();
    return trimmed || fallback;
  } finally {
    rl.close();
  }
}

async function promptForBoolean(
  question: string,
  defaultValue: boolean
): Promise<boolean> {
  const defaultLabel = defaultValue ? 'Y/n' : 'y/N';
  const answer = await promptForValue(`${question} (${defaultLabel})`);
  return parseBooleanAnswer(answer || '', defaultValue);
}

export async function resolveSetupConfig(
  options: ConfigSetupOptions,
  existing: Partial<MonicaConfig>
): Promise<Partial<MonicaConfig>> {
  const envDefaults = readSetupEnvDefaults();
  const resolved: Partial<MonicaConfig> = { ...existing };
  const canPrompt = !options.nonInteractive && input.isTTY;
  const shouldPromptOptionalCredentials = Boolean(
    options.userEmail ||
    options.userPassword ||
    existing.userEmail ||
    existing.userPassword ||
    envDefaults.userEmail ||
    envDefaults.userPassword
  );

  if (options.apiUrl) {
    resolved.apiUrl = normalizeApiUrl(options.apiUrl);
  } else if (!resolved.apiUrl && envDefaults.apiUrl) {
    resolved.apiUrl = envDefaults.apiUrl;
  }
  if (options.apiKey) {
    resolved.apiKey = options.apiKey.trim();
  } else if (!resolved.apiKey && envDefaults.apiKey) {
    resolved.apiKey = envDefaults.apiKey;
  }
  if (options.userEmail) {
    resolved.userEmail = options.userEmail.trim();
  } else if (!resolved.userEmail && envDefaults.userEmail) {
    resolved.userEmail = envDefaults.userEmail;
  }
  if (options.userPassword) {
    resolved.userPassword = options.userPassword;
  } else if (!resolved.userPassword && envDefaults.userPassword) {
    resolved.userPassword = envDefaults.userPassword;
  }
  if (options.defaultFormat) {
    resolved.defaultFormat = parseOutputFormat(options.defaultFormat);
  } else if (!resolved.defaultFormat && envDefaults.defaultFormat) {
    resolved.defaultFormat = envDefaults.defaultFormat;
  }

  if (options.readOnly && options.readWrite) {
    throw new Error('Cannot use both --read-only and --read-write');
  }
  if (options.readOnly) resolved.readOnlyMode = true;
  if (options.readWrite) resolved.readOnlyMode = false;
  if (resolved.readOnlyMode === undefined && envDefaults.readOnlyMode !== undefined) {
    resolved.readOnlyMode = envDefaults.readOnlyMode;
  }

  if (canPrompt && !resolved.apiUrl) {
    const apiUrl = await promptForValue('Monica API URL', existing.apiUrl);
    if (apiUrl) resolved.apiUrl = normalizeApiUrl(apiUrl);
  }
  if (canPrompt && !resolved.apiKey) {
    const apiKey = await promptForValue('Monica API key (JWT token)', existing.apiKey, { hidden: true });
    if (apiKey) resolved.apiKey = apiKey.trim();
  }
  if (canPrompt && shouldPromptOptionalCredentials && !resolved.userEmail) {
    const userEmail = await promptForValue('User email (optional)', existing.userEmail);
    if (userEmail) resolved.userEmail = userEmail.trim();
  }
  if (canPrompt && shouldPromptOptionalCredentials && !resolved.userPassword) {
    const userPassword = await promptForValue('User password (optional)', existing.userPassword, { hidden: true });
    if (userPassword) resolved.userPassword = userPassword;
  }
  if (canPrompt && !resolved.defaultFormat) {
    const defaultFormat = await promptForValue('Default output format (toon|json|yaml|table|md)', existing.defaultFormat ?? 'toon');
    if (defaultFormat) resolved.defaultFormat = parseOutputFormat(defaultFormat);
  }
  if (canPrompt && resolved.readOnlyMode === undefined) {
    const readOnly = await promptForBoolean('Enable read-only safety mode', existing.readOnlyMode ?? true);
    resolved.readOnlyMode = readOnly;
  }

  const missing: string[] = [];
  if (!resolved.apiUrl) missing.push('api-url');
  if (!resolved.apiKey) missing.push('api-key');
  if (missing.length > 0) {
    throw new Error(`Missing required values: ${missing.join(', ')}. Use flags or run in an interactive terminal.`);
  }

  if (!/^https?:\/\//i.test(resolved.apiUrl!)) {
    throw new Error(`Invalid API URL: "${resolved.apiUrl}". URL must start with http:// or https://`);
  }

  resolved.apiUrl = normalizeApiUrl(resolved.apiUrl!);
  validateApiKey(resolved.apiKey!);
  validateOptionalCredentials(resolved);
  if (!resolved.defaultFormat) {
    resolved.defaultFormat = existing.defaultFormat ?? 'toon';
  }
  if (resolved.readOnlyMode === undefined) {
    resolved.readOnlyMode = existing.readOnlyMode ?? true;
  }
  return resolved;
}

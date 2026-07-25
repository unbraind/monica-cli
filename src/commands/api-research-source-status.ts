import { Command } from 'commander';
import * as fmt from '../formatters';
import type { OutputFormat } from '../types';
import {
  createRequestTimeoutController,
  getRequestTimeoutMs,
  isAbortError,
} from '../api/request-utils';
import { resolveCommandOutputFormat } from './output-format';
import { loadBundledMonicaProvenance } from './api-research-shared';

const GITHUB_API_ROOT = 'https://api.github.com/repos';

interface GitHubBranchResponse {
  commit?: {
    sha?: string;
  };
}

/** Describes options for checking the bundled API source. */
export interface SourceStatusOptions {
  failOnStale?: boolean;
  failOnUnavailable?: boolean;
}

/** Describes the machine-readable bundled API source freshness result. */
export interface SourceStatusPayload {
  generatedAt: string;
  state: 'current' | 'stale' | 'unavailable';
  current: boolean | null;
  source: {
    repository: string;
    branch: string;
    routeFile: string;
    bundledCommit: string;
  } | null;
  upstream: {
    apiUrl: string | null;
    commit: string | null;
  };
  error: string | null;
  gate: {
    enabled: boolean;
    failed: boolean;
    failOnStale: boolean;
    failOnUnavailable: boolean;
    reasons: string[];
  };
  recommendedActions: string[];
}

/** Builds a public, read-only Monica API source freshness payload. */
export async function buildSourceStatusPayload(
  options: SourceStatusOptions,
  fetcher: typeof fetch = fetch
): Promise<SourceStatusPayload> {
  const source = loadBundledMonicaProvenance();
  const failOnStale = options.failOnStale === true;
  const failOnUnavailable = options.failOnUnavailable === true;
  const apiUrl = source
    ? `${GITHUB_API_ROOT}/${source.repository}/branches/${encodeURIComponent(source.branch)}`
    : null;
  let state: SourceStatusPayload['state'] = 'unavailable';
  let upstreamCommit: string | null = null;
  let error: string | null = source ? null : 'Bundled Monica API reference has incomplete source provenance';

  if (source && apiUrl) {
    const requestTimeoutMs = getRequestTimeoutMs();
    const timeout = createRequestTimeoutController(requestTimeoutMs);
    try {
      const response = await fetcher(apiUrl, {
        signal: timeout.signal,
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'monica-cli',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      if (!response.ok) {
        error = `GitHub branch lookup failed with HTTP ${response.status}`;
      } else {
        const body = await response.json() as GitHubBranchResponse;
        upstreamCommit = typeof body.commit?.sha === 'string' ? body.commit.sha : null;
        if (!upstreamCommit) {
          error = 'GitHub branch response did not include a commit SHA';
        } else {
          state = upstreamCommit === source.commit ? 'current' : 'stale';
        }
      }
    } catch (caught) {
      error = isAbortError(caught)
        ? `GitHub branch lookup timed out after ${requestTimeoutMs}ms`
        : caught instanceof Error
          ? caught.message
          : 'GitHub branch lookup failed';
    } finally {
      timeout.cleanup();
    }
  }

  const reasons: string[] = [];
  if (failOnStale && state === 'stale') reasons.push('bundled API source is stale');
  if (failOnUnavailable && state === 'unavailable') reasons.push('upstream source could not be verified');
  const recommendedActions = state === 'current'
    ? ['monica --json api-research coverage --fail-on-unmapped']
    : state === 'stale'
      ? [
        'Refresh docs/monica-api-reference.json from the authoritative 4.x routes',
        'monica --json api-research coverage --fail-on-unmapped',
      ]
      : ['Retry monica --json api-research source-status before claiming current compatibility'];

  return {
    generatedAt: new Date().toISOString(),
    state,
    current: state === 'unavailable' ? null : state === 'current',
    source: source
      ? {
        repository: source.repository,
        branch: source.branch,
        routeFile: source.routeFile,
        bundledCommit: source.commit,
      }
      : null,
    upstream: { apiUrl, commit: upstreamCommit },
    error,
    gate: {
      enabled: failOnStale || failOnUnavailable,
      failed: reasons.length > 0,
      failOnStale,
      failOnUnavailable,
      reasons,
    },
    recommendedActions,
  };
}

/** Attaches the public source freshness command to API research. */
export function attachApiResearchSourceStatusSubcommand(command: Command): void {
  command
    .command('source-status')
    .description('Verify bundled Monica API provenance against the current public 4.x branch')
    .option('--fail-on-stale', 'Exit with code 2 when the authoritative branch has advanced')
    .option('--fail-on-unavailable', 'Exit with code 2 when public upstream verification is unavailable')
    .action(async function (this: Command): Promise<void> {
      const format: OutputFormat = resolveCommandOutputFormat(this);
      try {
        const payload = await buildSourceStatusPayload(this.opts() as SourceStatusOptions);
        console.log(fmt.formatOutput(payload, format));
        if (payload.gate.failed) process.exit(2);
      } catch (caught) {
        console.error(fmt.formatError(caught as Error));
        process.exit(1);
      }
    });
}

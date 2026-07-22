/** Describes a stable, machine-readable Monica server failure diagnosis. */
export interface ServerDiagnostic {
  code: string;
  summary: string;
  cause: string;
  operatorAction: string;
  retryable: boolean;
  sourceUrl: string;
}

const CLOUDFLARE_PROXY_MESSAGE = 'failed to load trust proxies from cloudflare server';

/** Classifies known instance-side failures without replacing the original error. */
export function classifyServerDiagnostic(message: string): ServerDiagnostic | null {
  if (!message.toLowerCase().includes(CLOUDFLARE_PROXY_MESSAGE)) return null;

  return {
    code: 'monica_cloudflare_trust_proxy_fetch_failed',
    summary: 'Monica could not load Cloudflare trusted proxy ranges',
    cause: 'The Monica server failed while fetching Cloudflare IPv4 or IPv6 ranges during request bootstrap.',
    operatorAction: 'Check outbound HTTPS and DNS from the Monica container, then review TRUSTED_PROXIES and Cloudflare proxy settings before retrying.',
    retryable: false,
    sourceUrl: 'https://github.com/monicahq/laravel-cloudflare/blob/6d38d254fb0ec711d53357ee4643e016088932bb/src/CloudflareProxies.php',
  };
}

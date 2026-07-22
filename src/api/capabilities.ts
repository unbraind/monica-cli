import type { MonicaApiError } from './client';
import { get } from './client';
import { classifyServerDiagnostic, type ServerDiagnostic } from './server-diagnostics';

/** Describes the capability probe data contract. */
export interface CapabilityProbe {
  key: string;
  command: string;
  endpoint: string;
  supported: boolean | null;
  nativeSupported?: boolean;
  fallbackSupported?: boolean;
  statusCode: number;
  message: string;
  state?: 'supported' | 'unsupported' | 'unavailable';
  diagnostic?: ServerDiagnostic | null;
}

/** Describes the capability summary data contract. */
export interface CapabilitySummary {
  total: number;
  supported: number;
  unsupported: number;
  unavailable?: number;
  healthy?: boolean;
}

/** Describes the capability report data contract. */
export interface CapabilityReport {
  generatedAt: string;
  summary: CapabilitySummary;
  probes: CapabilityProbe[];
}

interface CapabilityTarget {
  key: string;
  command: string;
  endpoint: string;
  fallbackHint?: string;
}

/** Gets capability state. */
export function getCapabilityState(probe: CapabilityProbe): 'supported' | 'unsupported' | 'unavailable' {
  if (probe.state) return probe.state;
  if (probe.supported) return 'supported';
  if (probe.statusCode === 404 || probe.statusCode === 405) return 'unsupported';
  return 'unavailable';
}

const CAPABILITY_TARGETS: CapabilityTarget[] = [
  { key: 'statistics', command: 'statistics get', endpoint: '/statistics' },
  { key: 'contacts', command: 'contacts list', endpoint: '/contacts?limit=1' },
  { key: 'activities', command: 'activities list', endpoint: '/activities?limit=1' },
  { key: 'notes', command: 'notes list', endpoint: '/notes?limit=1' },
  { key: 'tasks', command: 'tasks list', endpoint: '/tasks?limit=1' },
  { key: 'reminders', command: 'reminders list', endpoint: '/reminders?limit=1' },
  { key: 'lifeEvents', command: 'life-events list', endpoint: '/lifeevents?limit=1' },
  { key: 'companies', command: 'companies list', endpoint: '/companies?limit=1' },
  { key: 'places', command: 'places list', endpoint: '/places?limit=1' },
  { key: 'calls', command: 'calls list', endpoint: '/calls?limit=1' },
  { key: 'gifts', command: 'gifts list', endpoint: '/gifts?limit=1' },
  { key: 'debts', command: 'debts list', endpoint: '/debts?limit=1' },
  { key: 'addresses', command: 'addresses list', endpoint: '/addresses?limit=1' },
  { key: 'journal', command: 'journal list', endpoint: '/journal?limit=1' },
  {
    key: 'groups',
    command: 'groups list',
    endpoint: '/groups?limit=1',
    fallbackHint: 'Groups endpoint unavailable; CLI can fallback to tag scan (--scan-tags).',
  },
  { key: 'documents', command: 'documents list', endpoint: '/documents?limit=1' },
  { key: 'photos', command: 'photos list', endpoint: '/photos?limit=1' },
  { key: 'occupations', command: 'occupations list', endpoint: '/occupations?limit=1' },
  { key: 'conversations', command: 'conversations list', endpoint: '/conversations?limit=1' },
  { key: 'genders', command: 'genders list', endpoint: '/genders?limit=1' },
  { key: 'countries', command: 'countries list', endpoint: '/countries' },
  { key: 'currencies', command: 'currencies list', endpoint: '/currencies?limit=1' },
  { key: 'tags', command: 'tags list', endpoint: '/tags?limit=1' },
  { key: 'user', command: 'user show', endpoint: '/me' },
  { key: 'relationships', command: 'relationships types', endpoint: '/relationshiptypes?limit=1' },
  { key: 'relationshipTypeGroups', command: 'relationships groups', endpoint: '/relationshiptypegroups?limit=1' },
  { key: 'activityTypes', command: 'activity-types list', endpoint: '/activitytypes?limit=1' },
  { key: 'activityTypeCategories', command: 'activity-type-categories list', endpoint: '/activitytypecategories?limit=1' },
  { key: 'contactFieldTypes', command: 'contact-field-types list', endpoint: '/contactfieldtypes?limit=1' },
  {
    key: 'contactFields',
    command: 'contact-fields list',
    endpoint: '/contactfields?limit=1',
    fallbackHint: 'Global contact fields endpoint unavailable; CLI can fallback to contact-scan mode.',
  },
  {
    key: 'petCategories',
    command: 'pet-categories list',
    endpoint: '/petcategories?limit=1',
    fallbackHint: 'Pet categories endpoint unavailable; CLI can fallback to pet scan mode.',
  },
  { key: 'pets', command: 'pets list', endpoint: '/pets?limit=1' },
  { key: 'auditLogs', command: 'audit-logs list', endpoint: '/logs?limit=1' },
  { key: 'compliance', command: 'compliance list', endpoint: '/compliance?limit=1' },
];

function getErrorDetails(error: unknown): { statusCode: number; message: string } {
  const apiError = error as MonicaApiError;
  if (apiError && typeof apiError.statusCode === 'number') {
    return {
      statusCode: apiError.statusCode,
      message: apiError.message,
    };
  }
  return {
    statusCode: 0,
    message: (error as Error).message || 'Unknown error',
  };
}

function canUseFallback(target: CapabilityTarget, statusCode: number): boolean {
  if (!target.fallbackHint) return false;
  return statusCode === 404 || statusCode === 405;
}

async function probeTarget(target: CapabilityTarget): Promise<CapabilityProbe> {
  try {
    await get(target.endpoint);
    return {
      key: target.key,
      command: target.command,
      endpoint: target.endpoint,
      supported: true,
      nativeSupported: true,
      fallbackSupported: false,
      statusCode: 200,
      message: 'OK',
      state: 'supported',
      diagnostic: null,
    };
  } catch (error) {
    const details = getErrorDetails(error);
    const fallbackSupported = canUseFallback(target, details.statusCode);
    const message = fallbackSupported && target.fallbackHint
      ? `${details.message}; ${target.fallbackHint}`
      : details.message;
    return {
      key: target.key,
      command: target.command,
      endpoint: target.endpoint,
      supported: fallbackSupported,
      nativeSupported: false,
      fallbackSupported,
      statusCode: details.statusCode,
      message,
      state: fallbackSupported ? 'supported'
        : details.statusCode === 404 || details.statusCode === 405 ? 'unsupported'
          : 'unavailable',
      diagnostic: classifyServerDiagnostic(details.message),
    };
  }
}

/** Probes api capabilities. */
export async function probeApiCapabilities(): Promise<CapabilityReport> {
  const probes = await Promise.all(CAPABILITY_TARGETS.map(probeTarget));
  const supported = probes.filter((probe) => getCapabilityState(probe) === 'supported').length;
  const unsupported = probes.filter((probe) => getCapabilityState(probe) === 'unsupported').length;
  const unavailable = probes.filter((probe) => getCapabilityState(probe) === 'unavailable').length;
  const summary: CapabilitySummary = {
    total: probes.length,
    supported,
    unsupported,
    unavailable,
    healthy: unavailable === 0,
  };

  return {
    generatedAt: new Date().toISOString(),
    summary,
    probes,
  };
}

/** Formats capability hints. */
export function formatCapabilityHints(report: CapabilityReport): string[] {
  const unavailable = report.probes.filter((probe) => getCapabilityState(probe) === 'unavailable');
  const unsupported = report.probes.filter((probe) => getCapabilityState(probe) === 'unsupported');
  if (unavailable.length === 0 && unsupported.length === 0) {
    return ['All probed Monica API resources are available on this instance.'];
  }

  const unavailableHints = unavailable.map((probe) => {
    const status = probe.statusCode ? `HTTP ${probe.statusCode}` : 'request failed';
    return `${probe.command}: ${status} (instance unavailable; endpoint support is unknown)`;
  });
  return [...unavailableHints, ...unsupported.map((probe) => {
    const status = probe.statusCode ? `HTTP ${probe.statusCode}` : 'request failed';
    return `${probe.command}: ${status} (${probe.message})`;
  })];
}

/** Gets supported commands. */
export function getSupportedCommands(report: CapabilityReport): string[] {
  return report.probes
    .filter((probe) => getCapabilityState(probe) === 'supported')
    .map((probe) => probe.command)
    .sort((a, b) => a.localeCompare(b));
}

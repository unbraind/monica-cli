import * as fs from 'fs';
import * as path from 'path';

/** Describes the api reference method data contract. */
export interface ApiReferenceMethod {
  method?: string;
  path?: string;
}

/** Describes the api reference resource data contract. */
export interface ApiReferenceResource {
  description?: string;
  methods?: Record<string, ApiReferenceMethod>;
}

/** Describes the api reference document data contract. */
export interface ApiReferenceDocument {
  version?: string;
  baseUrl?: string;
  generated?: string;
  endpoints?: Record<string, ApiReferenceResource>;
}

interface MonicaReferenceEndpoint {
  method?: string;
  path?: string;
}

interface MonicaReferenceResource {
  endpoints?: MonicaReferenceEndpoint[];
}

interface MonicaReferenceDocument {
  version?: string;
  baseUrl?: string;
  resources?: Record<string, MonicaReferenceResource>;
}

/** Describes the reference format data contract. */
export type ReferenceFormat = 'api-reference' | 'monica-api-reference';

/** Describes the reference selection data contract. */
export interface ReferenceSelection {
  path: string;
  format: ReferenceFormat;
}

/** Describes the resource summary data contract. */
export interface ResourceSummary {
  resource: string;
  description: string;
  endpointCount: number;
  methods: string[];
  cliCommand: string;
  cliMapping: 'mapped' | 'unmapped';
  instanceSupport?: {
    supportedOnInstance: boolean;
    state?: 'supported' | 'unsupported' | 'unavailable';
    statusCode: number;
    endpoint: string;
    message: string;
  };
  endpoints?: Array<{
    key: string;
    method: string;
    path: string;
  }>;
}

const API_REFERENCE_PATH = path.resolve(__dirname, '..', '..', 'docs', 'api-reference.json');
const MONICA_REFERENCE_PATH = path.resolve(__dirname, '..', '..', 'docs', 'monica-api-reference.json');

const RESOURCE_TO_COMMAND: Record<string, string> = {
  activities: 'activities',
  addresses: 'addresses',
  'audit logs': 'audit-logs',
  calls: 'calls',
  companies: 'companies',
  places: 'places',
  statistics: 'statistics',
  compliance: 'compliance',
  contacts: 'contacts',
  conversations: 'conversations',
  countries: 'countries',
  currencies: 'currencies',
  debts: 'debts',
  documents: 'documents',
  genders: 'genders',
  gifts: 'gifts',
  groups: 'groups',
  journal: 'journal',
  'life events': 'life-events',
  notes: 'notes',
  occupations: 'occupations',
  pets: 'pets',
  'pet categories': 'pet-categories',
  photos: 'photos',
  relationships: 'relationships',
  'relationship types': 'relationships types',
  'relationship type groups': 'relationships groups',
  reminders: 'reminders',
  tags: 'tags',
  tasks: 'tasks',
  user: 'user',
  users: 'user',
  'activity types': 'activity-types',
  'activity type categories': 'activity-type-categories',
  'contact field types': 'contact-field-types',
  'contact fields': 'contact-fields',
};

function normalizeResourceName(resourceName: string): string {
  return resourceName.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

function resolveCliCommand(resourceName: string): { command: string; mapped: boolean } {
  const normalized = normalizeResourceName(resourceName);
  const mappedCommand = RESOURCE_TO_COMMAND[normalized];
  if (!mappedCommand) {
    return { command: resourceName, mapped: false };
  }
  return { command: mappedCommand, mapped: true };
}

function loadMonicaReference(): MonicaReferenceDocument {
  const raw = fs.readFileSync(MONICA_REFERENCE_PATH, 'utf-8');
  return JSON.parse(raw) as MonicaReferenceDocument;
}

/** Parses source option. */
export function parseSourceOption(value: string): ReferenceSelection {
  const normalized = value.trim();
  if (!normalized || normalized === 'auto') {
    try {
      const monicaDoc = loadMonicaReference();
      if (monicaDoc.resources && Object.keys(monicaDoc.resources).length > 0) {
        return { path: MONICA_REFERENCE_PATH, format: 'monica-api-reference' };
      }
    } catch {
      return { path: API_REFERENCE_PATH, format: 'api-reference' };
    }
    return { path: API_REFERENCE_PATH, format: 'api-reference' };
  }

  if (normalized === 'api') return { path: API_REFERENCE_PATH, format: 'api-reference' };
  if (normalized === 'monica') return { path: MONICA_REFERENCE_PATH, format: 'monica-api-reference' };

  const candidate = path.resolve(normalized);
  const raw = fs.readFileSync(candidate, 'utf-8');
  const parsed = JSON.parse(raw) as Partial<ApiReferenceDocument & MonicaReferenceDocument>;
  if (parsed.endpoints && typeof parsed.endpoints === 'object') {
    return { path: candidate, format: 'api-reference' };
  }
  if (parsed.resources && typeof parsed.resources === 'object') {
    return { path: candidate, format: 'monica-api-reference' };
  }
  throw new Error(`Unsupported API reference shape in "${candidate}". Expected "endpoints" or "resources".`);
}

/** Loads selected reference. */
export function loadSelectedReference(selection: ReferenceSelection): ApiReferenceDocument {
  if (selection.format === 'api-reference') {
    const raw = fs.readFileSync(selection.path, 'utf-8');
    return JSON.parse(raw) as ApiReferenceDocument;
  }

  const monicaDoc = selection.path === MONICA_REFERENCE_PATH
    ? loadMonicaReference()
    : (JSON.parse(fs.readFileSync(selection.path, 'utf-8')) as MonicaReferenceDocument);
  const endpoints: Record<string, ApiReferenceResource> = {};
  Object.entries(monicaDoc.resources || {}).forEach(([resource, definition]) => {
    const methods: Record<string, ApiReferenceMethod> = {};
    (definition.endpoints || []).forEach((endpoint, index) => {
      methods[`${(endpoint.method || 'UNKNOWN').toLowerCase()}_${index + 1}`] = {
        method: endpoint.method,
        path: endpoint.path,
      };
    });
    endpoints[resource] = { description: '', methods };
  });

  return {
    version: monicaDoc.version,
    baseUrl: monicaDoc.baseUrl,
    generated: undefined,
    endpoints,
  };
}

/** Executes the summarize resource operation. */
export function summarizeResource(
  resource: string,
  definition: ApiReferenceResource,
  includeEndpoints: boolean
): ResourceSummary {
  const methods = Object.entries(definition.methods || {});
  const verbs = Array.from(new Set(methods.map(([, value]) => (value.method || 'UNKNOWN').toUpperCase()))).sort();
  const endpoints = methods.map(([key, value]) => ({
    key,
    method: (value.method || 'UNKNOWN').toUpperCase(),
    path: value.path || '',
  }));

  const cli = resolveCliCommand(resource);

  return {
    resource,
    description: definition.description || '',
    endpointCount: methods.length,
    methods: verbs,
    cliCommand: cli.command,
    cliMapping: cli.mapped ? 'mapped' : 'unmapped',
    endpoints: includeEndpoints ? endpoints : undefined,
  };
}

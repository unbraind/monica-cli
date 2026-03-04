import { Command } from 'commander';
import type { OutputFormat, Contact, Activity, Note, Task, Reminder } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { resolveCommandOutputFormat } from './output-format';

interface SearchResult {
  type: string;
  id: number;
  title: string;
  subtitle?: string;
}

interface SearchError {
  type: string;
  message: string;
}

interface SearchPayload {
  query: string;
  type: SearchType;
  limitPerType: number | null;
  maxPages: number | null;
  totalResults: number;
  partial: boolean;
  failedTypes: string[];
  errors: SearchError[];
  results: SearchResult[];
}

type SearchType = 'contacts' | 'activities' | 'notes' | 'tasks' | 'reminders' | 'all';

function parseIntegerOption(value: string): number {
  return Number.parseInt(value, 10);
}

function getOutputFormat(command: Command): OutputFormat {
  return resolveCommandOutputFormat(command);
}

function normalizeSearchType(rawType: string): SearchType {
  const normalized = rawType.trim().toLowerCase();
  const allowed: SearchType[] = ['contacts', 'activities', 'notes', 'tasks', 'reminders', 'all'];
  if (!allowed.includes(normalized as SearchType)) {
    throw new Error(`Invalid search type: ${rawType}. Allowed: ${allowed.join(', ')}`);
  }
  return normalized as SearchType;
}

function includesQuery(value: string | null | undefined, query: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

function toContactResults(contacts: Contact[]): SearchResult[] {
  return contacts.map((c: Contact) => ({
    type: 'contact',
    id: c.id,
    title: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unnamed',
    subtitle: c.description || c.gender || undefined,
  }));
}

function toActivityResults(activities: Activity[]): SearchResult[] {
  return activities.map((a: Activity) => ({
    type: 'activity',
    id: a.id,
    title: a.summary || 'Untitled',
    subtitle: a.happened_at,
  }));
}

function toNoteResults(notes: Note[]): SearchResult[] {
  return notes.map((n: Note) => ({
    type: 'note',
    id: n.id,
    title: n.body?.substring(0, 50) + (n.body && n.body.length > 50 ? '...' : '') || 'Empty',
    subtitle: `Contact ID: ${n.contact?.id}`,
  }));
}

function toTaskResults(tasks: Task[]): SearchResult[] {
  return tasks.map((t: Task) => ({
    type: 'task',
    id: t.id,
    title: t.title || 'Untitled',
    subtitle: t.completed ? 'Completed' : 'Pending',
  }));
}

function toReminderResults(reminders: Reminder[]): SearchResult[] {
  return reminders.map((r: Reminder) => ({
    type: 'reminder',
    id: r.id,
    title: r.title || 'Untitled',
    subtitle: `Next: ${r.next_expected_date}`,
  }));
}

async function searchContactsByQuery(query: string, limitPerType?: number): Promise<SearchResult[]> {
  const result = await api.searchContacts(query, { limit: limitPerType });
  const items = limitPerType ? result.data.slice(0, limitPerType) : result.data;
  return toContactResults(items);
}

async function searchActivitiesByQuery(query: string, maxPages?: number, limitPerType?: number): Promise<SearchResult[]> {
  const activities = await api.listAllActivities(maxPages);
  const filtered = activities.filter((a) =>
    includesQuery(a.summary, query) || includesQuery(a.description, query)
  );
  return toActivityResults(limitPerType ? filtered.slice(0, limitPerType) : filtered);
}

async function searchNotesByQuery(query: string, maxPages?: number, limitPerType?: number): Promise<SearchResult[]> {
  const notes = await api.listAllNotes(maxPages);
  const filtered = notes.filter((n) => includesQuery(n.body, query));
  return toNoteResults(limitPerType ? filtered.slice(0, limitPerType) : filtered);
}

async function searchTasksByQuery(query: string, maxPages?: number, limitPerType?: number): Promise<SearchResult[]> {
  const tasks = await api.listAllTasks(undefined, maxPages);
  const filtered = tasks.filter((t) =>
    includesQuery(t.title, query) || includesQuery(t.description, query)
  );
  return toTaskResults(limitPerType ? filtered.slice(0, limitPerType) : filtered);
}

async function searchRemindersByQuery(query: string, maxPages?: number, limitPerType?: number): Promise<SearchResult[]> {
  const reminders = await api.listAllReminders(maxPages);
  const filtered = reminders.filter((r) =>
    includesQuery(r.title, query) || includesQuery(r.description, query)
  );
  return toReminderResults(limitPerType ? filtered.slice(0, limitPerType) : filtered);
}

async function runSearchTask(
  searchType: string,
  strict: boolean,
  task: () => Promise<SearchResult[]>
): Promise<{ results: SearchResult[]; error?: SearchError }> {
  try {
    const results = await task();
    return { results };
  } catch (error) {
    if (strict) throw error;
    return {
      results: [],
      error: {
        type: searchType,
        message: (error as Error).message || 'Unknown error',
      },
    };
  }
}

function buildSearchPayload(
  query: string,
  searchType: SearchType,
  limitPerType: number | null | undefined,
  maxPages: number | null | undefined,
  taskResults: Array<{ results: SearchResult[]; error?: SearchError }>
): SearchPayload {
  const results = taskResults.flatMap((item) => item.results);
  const errors = taskResults
    .map((item) => item.error)
    .filter((item): item is SearchError => Boolean(item));

  return {
    query,
    type: searchType,
    limitPerType: limitPerType ?? null,
    maxPages: maxPages ?? null,
    totalResults: results.length,
    partial: errors.length > 0,
    failedTypes: errors.map((item) => item.type),
    errors,
    results,
  };
}

export function createSearchCommand(): Command {
  const cmd = new Command('search')
    .description('Search across contacts and other resources')
    .argument('<query>', 'Search query')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-t, --type <type>', 'Search type: contacts, activities, notes, tasks, reminders, all', 'contacts')
    .option('--strict', 'Fail the entire search if one resource type fails (default: best-effort)')
    .option('--limit <limit>', 'Maximum matching results per type', parseIntegerOption)
    .option('--max-pages <maxPages>', 'Maximum pages fetched for non-contact searches', parseIntegerOption, 3)
    .action(async (query: string, _options, command) => {
      const cmd = command as Command;
      const localOptions = cmd.opts() as {
        format?: string;
        type?: string;
        strict?: boolean;
        limit?: number;
        maxPages?: number;
      };

      const format = getOutputFormat(cmd);
      const strict = localOptions.strict === true;
      const raw = Boolean((cmd as Command & { optsWithGlobals?: () => Record<string, unknown> }).optsWithGlobals?.().raw);
      const limitPerType = localOptions.limit;
      const maxPages = localOptions.maxPages;
      const normalizedQuery = query.trim().toLowerCase();

      try {
        const searchType = normalizeSearchType(localOptions.type || 'contacts');
        const searches: Array<Promise<{ results: SearchResult[]; error?: SearchError }>> = [];
        if (searchType === 'contacts' || searchType === 'all') {
          searches.push(runSearchTask('contacts', strict, async () => searchContactsByQuery(normalizedQuery, limitPerType)));
        }
        if (searchType === 'activities' || searchType === 'all') {
          searches.push(runSearchTask('activities', strict, async () => searchActivitiesByQuery(normalizedQuery, maxPages, limitPerType)));
        }
        if (searchType === 'notes' || searchType === 'all') {
          searches.push(runSearchTask('notes', strict, async () => searchNotesByQuery(normalizedQuery, maxPages, limitPerType)));
        }
        if (searchType === 'tasks' || searchType === 'all') {
          searches.push(runSearchTask('tasks', strict, async () => searchTasksByQuery(normalizedQuery, maxPages, limitPerType)));
        }
        if (searchType === 'reminders' || searchType === 'all') {
          searches.push(runSearchTask('reminders', strict, async () => searchRemindersByQuery(normalizedQuery, maxPages, limitPerType)));
        }

        const resultSets = await Promise.all(searches);
        const payload = buildSearchPayload(query, searchType, limitPerType, maxPages, resultSets);

        if (raw) {
          console.log(JSON.stringify(payload.results, null, 2));
          return;
        }

        console.log(fmt.formatOutput(payload, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}

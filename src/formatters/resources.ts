import type {
  Activity,
  Company,
  Contact,
  OutputFormat,
  PaginatedResponse,
  Note,
  Reminder,
  Tag,
  Task,
} from '../types';
import { getRuntimeFieldSelection } from './runtime-fields';
import { formatMarkdown } from './markdown';
import { formatOutput, formatTable, formatToon, resolveOutputFormat } from './toon';
import { formatYaml } from './yaml';

/** Provides the contact output fields. */
export const ContactFields = ['id', 'first_name', 'last_name', 'gender', 'is_partial'];
/** Provides the activity output fields. */
export const ActivityFields = ['id', 'summary', 'happened_at'];
/** Provides the note output fields. */
export const NoteFields = ['id', 'body'];
/** Provides the task output fields. */
export const TaskFields = ['id', 'title', 'completed'];
/** Provides the reminder output fields. */
export const ReminderFields = ['id', 'title', 'initial_date', 'next_expected_date'];
/** Provides the tag output fields. */
export const TagFields = ['id', 'name'];
/** Provides the company output fields. */
export const CompanyFields = ['id', 'name', 'website'];
/** Provides the contact-field output fields. */
export const ContactFieldFields = ['id', 'data'];
/** Provides the address output fields. */
export const AddressFields = ['id', 'name', 'city', 'country'];
/** Provides the call output fields. */
export const CallFields = ['id', 'content', 'called_at'];
/** Provides the conversation output fields. */
export const ConversationFields = ['id', 'happened_at'];
/** Provides the document output fields. */
export const DocumentFields = ['id', 'name'];
/** Provides the gift output fields. */
export const GiftFields = ['id', 'name', 'status', 'amount'];
/** Provides the photo output fields. */
export const PhotoFields = ['id', 'original_filename'];

/** Formats a paginated API response and includes its page metadata. */
export function formatPaginatedResponse<T>(
  response: PaginatedResponse<T>,
  format: OutputFormat = 'toon',
  fields?: string[],
  raw?: boolean
): string {
  const runtimeFields = getRuntimeFieldSelection();
  const effectiveFields = runtimeFields && runtimeFields.length > 0 ? runtimeFields : fields;
  const filteredData = effectiveFields
    ? response.data.map((entry) => {
      if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return entry;
      return Object.fromEntries(Object.entries(entry).filter(([key]) => effectiveFields.includes(key)));
    })
    : response.data;
  if (raw || process.argv.includes('--raw')) return JSON.stringify(filteredData, null, 2);

  const filteredResponse = { ...response, data: filteredData };
  const resolved = resolveOutputFormat(format);
  if (resolved === 'json') return JSON.stringify(filteredResponse, null, 2);
  if (resolved === 'yaml') return formatYaml(filteredResponse);
  if (resolved === 'md') {
    if (response.meta.total === 0) return '*No results*';
    const info = `**Page ${response.meta.current_page}/${response.meta.last_page}** (${response.meta.total} total)`;
    return `${info}\n\n${formatMarkdown(filteredData, effectiveFields)}`;
  }
  if (response.meta.total === 0) return 'No results';
  const info = response.meta.last_page === 1 ? '1/1' : `${response.meta.current_page}/${response.meta.last_page}`;
  const data = resolved === 'toon' ? formatToon(filteredData, effectiveFields) : formatTable(filteredData, effectiveFields);
  return `${info}\n${data}`;
}

/** Formats a contact using its concise default field set. */
export function formatContact(contact: Contact, format: OutputFormat = 'toon'): string {
  return formatOutput(contact, format, { fields: ContactFields });
}
/** Formats an activity using its concise default field set. */
export function formatActivity(activity: Activity, format: OutputFormat = 'toon'): string {
  return formatOutput(activity, format, { fields: ActivityFields });
}
/** Formats a note using its concise default field set. */
export function formatNote(note: Note, format: OutputFormat = 'toon'): string {
  return formatOutput(note, format, { fields: NoteFields });
}
/** Formats a task using its concise default field set. */
export function formatTask(task: Task, format: OutputFormat = 'toon'): string {
  return formatOutput(task, format, { fields: TaskFields });
}
/** Formats a reminder using its concise default field set. */
export function formatReminder(reminder: Reminder, format: OutputFormat = 'toon'): string {
  return formatOutput(reminder, format, { fields: ReminderFields });
}
/** Formats a tag using its concise default field set. */
export function formatTag(tag: Tag, format: OutputFormat = 'toon'): string {
  return formatOutput(tag, format, { fields: TagFields });
}
/** Formats a company using its concise default field set. */
export function formatCompany(company: Company, format: OutputFormat = 'toon'): string {
  return formatOutput(company, format, { fields: CompanyFields });
}

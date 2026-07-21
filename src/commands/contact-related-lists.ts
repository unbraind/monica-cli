import type { Command } from 'commander';
import type { PaginatedResponse } from '../types';
import * as fmt from '../formatters';
import { runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

type ListFetcher = (
  contactId: number,
  params: { page?: number; limit?: number },
) => Promise<PaginatedResponse<unknown>>;

/** Attach a contact-scoped paginated list subcommand. */
export function addContactListCommand(
  command: Command,
  name: string,
  description: string,
  fields: string[],
  fetcher: ListFetcher,
): void {
  command.command(`${name} <id>`).description(description)
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const { page, limit } = this.parent?.opts() as { page?: number; limit?: number };
        const result = await fetcher(parsePositiveInteger(id), { page, limit });
        console.log(fmt.formatPaginatedResponse(
          result, resolveCommandOutputFormat(this), fields,
        ));
      });
    });
}

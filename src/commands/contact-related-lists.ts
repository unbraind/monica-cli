import type { Command } from 'commander';
import type { OutputFormat, PaginatedResponse } from '../types';
import * as fmt from '../formatters';

type ListFetcher = (contactId: number, params: { page?: number; limit?: number }) => Promise<PaginatedResponse<unknown>>;

export function addContactListCommand(
  cmd: Command,
  name: string,
  description: string,
  fields: string[],
  fetcher: ListFetcher
): void {
  cmd.command(`${name} <id>`).description(description)
    .action(async (id, _options, cmdParent) => {
      const { format, page, limit } = cmdParent.opts() as {
        format: OutputFormat;
        page?: number;
        limit?: number;
      };
      try {
        const result = await fetcher(parseInt(id), { page, limit });
        console.log(fmt.formatPaginatedResponse(result, format, fields));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });
}


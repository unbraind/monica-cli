import { Command } from 'commander';
import * as api from '../api';
import * as fmt from '../formatters';
import { resolveCommandOutputFormat } from './output-format';

const STATISTICS_FIELDS = [
  'instance_creation_date',
  'number_of_contacts',
  'number_of_users',
  'number_of_activities',
  'number_of_reminders',
  'number_of_new_users_last_week',
];

/** Build the public, read-only Monica instance-statistics command tree. */
export function createStatisticsCommand(): Command {
  const cmd = new Command('statistics')
    .description('Read public Monica instance statistics when enabled')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon');

  cmd.command('get')
    .description('Get the latest public instance statistics')
    .action(async function (this: Command): Promise<void> {
      try {
        const statistics = await api.getInstanceStatistics();
        console.log(fmt.formatOutput(statistics, resolveCommandOutputFormat(this), {
          fields: STATISTICS_FIELDS,
        }));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}

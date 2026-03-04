import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createUserCommand(): Command {
  const cmd = new Command('user')
    .description('Get current user information')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon');

  const outputCurrentUser = async (cmdParent: Command): Promise<void> => {
    const parentOpts = cmdParent.opts();
    const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);

    try {
      const result = await api.getUser();
      console.log(fmt.formatOutput(result.data, format));
    } catch (error) {
      console.error(fmt.formatError(error as Error));
      process.exit(1);
    }
  };

  cmd
    .command('get')
    .description('Get current user information')
    .action(async (_options, cmdParent) => {
      await outputCurrentUser(cmdParent);
    });

  cmd
    .command('me')
    .description('Alias for user get')
    .action(async (_options, cmdParent) => {
      await outputCurrentUser(cmdParent);
    });

  cmd
    .command('show')
    .description('Alias for user get')
    .action(async (_options, cmdParent) => {
      await outputCurrentUser(cmdParent);
    });

  cmd
    .command('compliance')
    .description('Get compliance status for current user')
    .option('-i, --id <id>', 'Get status for specific compliance ID', parseInt)
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        if (options.id) {
          const result = await api.getUserComplianceStatusForTerm(options.id);
          console.log(fmt.formatOutput(result.data, format));
        } else {
          const result = await api.getUserComplianceStatus();
          console.log(fmt.formatOutput(result.data, format));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('sign-compliance')
    .description('Sign the latest compliance policy')
    .requiredOption('--ip <ip>', 'IP address')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.signCompliance({ ip_address: options.ip });
        console.log(fmt.formatSuccess('Compliance signed'));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}

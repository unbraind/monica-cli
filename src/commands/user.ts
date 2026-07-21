import type { Command } from 'commander';
import { Command as CommanderCommand } from 'commander';
import * as api from '../api';
import * as fmt from '../formatters';
import { runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

async function outputCurrentUser(command: Command): Promise<void> {
  await runCommandAction(async () => {
    const result = await api.getUser();
    console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(command)));
  });
}

/** Build current-user, compliance, and contact-association commands. */
export function createUserCommand(): Command {
  const command = new CommanderCommand('user')
    .description('Get current user information')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon');

  for (const [name, description] of [
    ['get', 'Get current user information'],
    ['me', 'Alias for user get'],
    ['show', 'Alias for user get'],
  ]) {
    command.command(name).description(description)
      .action(async function (this: Command): Promise<void> { await outputCurrentUser(this); });
  }

  command.command('compliance').description('Get compliance status for current user')
    .option('-i, --id <id>', 'Get status for a specific compliance ID', parsePositiveInteger)
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const id = (this.opts() as { id?: number }).id;
        const result = id === undefined
          ? await api.getUserComplianceStatus()
          : await api.getUserComplianceStatusForTerm(id);
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  command.command('set-contact <contact-id>')
    .description('Associate an existing contact with the authenticated user')
    .action(async function (this: Command, contactId: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.setMeContact(parsePositiveInteger(contactId));
        console.log(fmt.formatOutput(result, resolveCommandOutputFormat(this)));
      });
    });

  command.command('unset-contact').description('Remove the authenticated user contact association')
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        console.log(fmt.formatOutput(await api.unsetMeContact(), resolveCommandOutputFormat(this)));
      });
    });

  command.command('sign-compliance').description('Sign the latest compliance policy')
    .requiredOption('--ip <ip>', 'IP address')
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.signCompliance({ ip_address: (this.opts() as { ip: string }).ip });
        console.log(fmt.formatSuccess('Compliance signed'));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
  return command;
}

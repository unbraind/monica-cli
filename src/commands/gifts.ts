import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createGiftsCommand(): Command {
  const cmd = new Command('gifts')
    .description('Manage gifts')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  const GiftFields = ['id', 'name', 'status', 'amount', 'date', 'created_at'];

  cmd
    .command('list')
    .description('List all gifts')
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        if (options.all) {
          const gifts = await api.listAllGifts();
          console.log(fmt.formatOutput(gifts, format, { fields: GiftFields }));
        } else {
          const result = await api.listGifts({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, GiftFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific gift')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.getGift(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new gift')
    .requiredOption('--contact <id>', 'Contact ID', parseInt)
    .requiredOption('--name <name>', 'Gift name/description')
    .requiredOption('--status <status>', 'Status (idea|offered|received)', String)
    .option('--recipient <id>', 'Recipient contact ID', parseInt)
    .option('--comment <text>', 'Comment')
    .option('--url <url>', 'URL')
    .option('--amount <amount>', 'Amount', parseFloat)
    .option('--date <date>', 'Date (YYYY-MM-DD)')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.createGift({
          contact_id: options.contact,
          name: options.name,
          status: options.status as 'idea' | 'offered' | 'received',
          recipient_id: options.recipient,
          comment: options.comment,
          url: options.url,
          amount: options.amount,
          date: options.date,
        });
        console.log(fmt.formatSuccess('Gift created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update a gift')
    .option('--name <name>', 'Gift name/description')
    .option('--status <status>', 'Status (idea|offered|received)', String)
    .option('--comment <text>', 'Comment')
    .option('--url <url>', 'URL')
    .option('--amount <amount>', 'Amount', parseFloat)
    .option('--date <date>', 'Date (YYYY-MM-DD)')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const current = await api.getGift(parseInt(id));
        const result = await api.updateGift(parseInt(id), {
          contact_id: current.data.contact?.id || 0,
          name: options.name || current.data.name,
          status: (options.status as 'idea' | 'offered' | 'received') || current.data.status,
          comment: options.comment ?? current.data.comment,
          url: options.url ?? current.data.url,
          amount: options.amount ?? (current.data.amount ? parseFloat(current.data.amount) : undefined),
          date: options.date ?? current.data.date,
        });
        console.log(fmt.formatSuccess('Gift updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a gift')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.deleteGift(parseInt(id));
        if (format === 'json') {
          console.log(JSON.stringify(result));
        } else {
          console.log(fmt.formatDeleted(result.id));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('associate-photo <id>')
    .description('Associate a photo with a gift')
    .requiredOption('--photo <id>', 'Photo ID', parseInt)
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.associateGiftPhoto(parseInt(id), options.photo);
        console.log(fmt.formatSuccess('Photo associated with gift', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}

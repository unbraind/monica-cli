import { InvalidArgumentError, type Command } from 'commander';
import type { Gift, GiftCreateInput, GiftUpdateInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { createCrudCommand, runCommandAction } from './crud-command';
import { parseFiniteNumber, parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

const GIFT_FIELDS = ['id', 'name', 'status', 'amount', 'date', 'created_at'];
type GiftStatus = GiftCreateInput['status'];

/** Parse a Monica gift lifecycle status. */
export function parseGiftStatus(value: string): GiftStatus {
  if (value === 'idea' || value === 'offered' || value === 'received') return value;
  throw new InvalidArgumentError('Invalid gift status. Use: idea, offered, or received');
}

/** Build the gift CRUD and photo-association command family. */
export function createGiftsCommand(): Command {
  const command = createCrudCommand<Gift, GiftCreateInput, GiftUpdateInput>({
    name: 'gifts', description: 'Manage gifts', singular: 'gift', label: 'Gift',
    fields: GIFT_FIELDS,
    listPage: api.listGifts,
    listAll: () => api.listAllGifts(),
    get: api.getGift,
    create: api.createGift,
    update: api.updateGift,
    remove: api.deleteGift,
    configureCreate: (candidate) => candidate
      .requiredOption('--contact <id>', 'Contact ID', parsePositiveInteger)
      .requiredOption('--name <name>', 'Gift name or description')
      .requiredOption('--status <status>', 'Status (idea|offered|received)', parseGiftStatus)
      .option('--recipient <id>', 'Recipient contact ID', parsePositiveInteger)
      .option('--comment <text>', 'Comment').option('--url <url>', 'URL')
      .option('--amount <amount>', 'Amount', parseFiniteNumber).option('--date <date>', 'Date'),
    configureUpdate: (candidate) => candidate
      .option('--name <name>', 'Gift name or description')
      .option('--status <status>', 'Status (idea|offered|received)', parseGiftStatus)
      .option('--comment <text>', 'Comment').option('--url <url>', 'URL')
      .option('--amount <amount>', 'Amount', parseFiniteNumber).option('--date <date>', 'Date'),
    buildCreateInput: (options) => ({
      contact_id: options.contact as number,
      recipient_id: options.recipient as number | undefined,
      name: options.name as string,
      status: options.status as GiftStatus,
      comment: options.comment as string | undefined,
      url: options.url as string | undefined,
      amount: options.amount as number | undefined,
      date: options.date as string | undefined,
    }),
    buildUpdateInput: (options, current) => ({
      contact_id: current.contact?.id ?? 0,
      name: (options.name as string | undefined) ?? current.name,
      status: (options.status as GiftStatus | undefined) ?? current.status,
      comment: (options.comment as string | undefined) ?? current.comment ?? undefined,
      url: (options.url as string | undefined) ?? current.url ?? undefined,
      amount: (options.amount as number | undefined)
        ?? (current.amount === null ? undefined : Number.parseFloat(current.amount)),
      date: (options.date as string | undefined) ?? current.date ?? undefined,
    }),
  });

  command.command('associate-photo <id>')
    .description('Associate a photo with a gift')
    .requiredOption('--photo <id>', 'Photo ID', parsePositiveInteger)
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.associateGiftPhoto(
          parsePositiveInteger(id),
          (this.opts() as { photo: number }).photo,
        );
        console.log(fmt.formatSuccess('Photo associated with gift', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
  return command;
}

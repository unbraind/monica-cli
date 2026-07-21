import { InvalidArgumentError } from 'commander';
import type { Debt, DebtCreateInput, DebtUpdateInput } from '../types';
import * as api from '../api';
import { createCrudCommand } from './crud-command';
import { parseFiniteNumber, parsePositiveInteger } from './global-options';

const DEBT_FIELDS = ['id', 'in_debt', 'status', 'amount', 'reason', 'created_at'];

/** Parse the Monica debt direction contract. */
export function parseDebtDirection(value: string): 'yes' | 'no' {
  if (value === 'yes' || value === 'no') return value;
  throw new InvalidArgumentError('Invalid debt direction. Use: yes or no');
}

/** Parse the Monica debt lifecycle contract. */
export function parseDebtStatus(value: string): 'inprogress' | 'complete' {
  if (value === 'inprogress' || value === 'complete') return value;
  throw new InvalidArgumentError('Invalid debt status. Use: inprogress or complete');
}

/** Build the contact-debt CRUD command family. */
export function createDebtsCommand() {
  return createCrudCommand<Debt, DebtCreateInput, DebtUpdateInput>({
    name: 'debts',
    description: 'Manage debts',
    singular: 'debt',
    label: 'Debt',
    fields: DEBT_FIELDS,
    listPage: api.listDebts,
    listAll: () => api.listAllDebts(),
    get: api.getDebt,
    create: api.createDebt,
    update: api.updateDebt,
    remove: api.deleteDebt,
    configureCreate: (command) => command
      .requiredOption('--contact <id>', 'Contact ID', parsePositiveInteger)
      .requiredOption('--in-debt <yes|no>', 'Are you in debt?', parseDebtDirection)
      .requiredOption('--amount <amount>', 'Amount', parseFiniteNumber)
      .requiredOption('--status <status>', 'Status (inprogress|complete)', parseDebtStatus)
      .option('--reason <text>', 'Reason for debt'),
    configureUpdate: (command) => command
      .option('--in-debt <yes|no>', 'Are you in debt?', parseDebtDirection)
      .option('--amount <amount>', 'Amount', parseFiniteNumber)
      .option('--status <status>', 'Status (inprogress|complete)', parseDebtStatus)
      .option('--reason <text>', 'Reason for debt'),
    buildCreateInput: (options) => ({
      contact_id: options.contact as number,
      in_debt: options.inDebt as 'yes' | 'no',
      amount: options.amount as number,
      status: options.status as 'inprogress' | 'complete',
      reason: options.reason as string | undefined,
    }),
    buildUpdateInput: (options, current) => ({
      contact_id: current.contact?.id ?? 0,
      in_debt: (options.inDebt as 'yes' | 'no' | undefined)
        ?? (current.in_debt as 'yes' | 'no'),
      amount: (options.amount as number | undefined) ?? current.amount,
      status: (options.status as 'inprogress' | 'complete' | undefined)
        ?? (current.status as 'inprogress' | 'complete'),
      reason: (options.reason as string | undefined) ?? current.reason ?? undefined,
    }),
  });
}

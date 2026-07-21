import type { Company, CompanyCreateInput, CompanyUpdateInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { createCrudCommand } from './crud-command';
import { parsePositiveInteger } from './global-options';

/** Build the company CRUD command family. */
export function createCompaniesCommand() {
  return createCrudCommand<Company, CompanyCreateInput, CompanyUpdateInput>({
    name: 'companies',
    description: 'Manage companies',
    singular: 'company',
    label: 'Company',
    fields: fmt.CompanyFields,
    listPage: api.listCompanies,
    listAll: () => api.listAllCompanies(),
    get: api.getCompany,
    create: api.createCompany,
    update: api.updateCompany,
    remove: api.deleteCompany,
    configureCreate: (command) => command
      .requiredOption('--name <name>', 'Company name')
      .option('--website <url>', 'Website URL')
      .option('--employees <number>', 'Number of employees', parsePositiveInteger),
    configureUpdate: (command) => command
      .option('--name <name>', 'Company name')
      .option('--website <url>', 'Website URL')
      .option('--employees <number>', 'Number of employees', parsePositiveInteger),
    buildCreateInput: (options) => ({
      name: options.name as string,
      website: options.website as string | undefined,
      number_of_employees: options.employees as number | undefined,
    }),
    buildUpdateInput: (options, current) => ({
      name: (options.name as string | undefined) ?? current.name,
      website: (options.website as string | undefined) ?? current.website ?? undefined,
      number_of_employees: (options.employees as number | undefined)
        ?? current.number_of_employees
        ?? undefined,
    }),
  });
}

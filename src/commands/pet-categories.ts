import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import type { PetCategory } from '../types';

const PetCategoryFields = ['id', 'name', 'is_common'];
const parseIntegerOption = (value: string): number => Number.parseInt(value, 10);

interface PetCategoriesListOptions {
  all?: boolean;
  scanPets?: boolean;
  autoScan?: boolean;
  petMaxPages?: number;
}

interface PetCategoryScanResult {
  mode: 'pet-scan-fallback';
  trigger: 'auto' | 'manual';
  petsScanned: number;
  categoriesDiscovered: number;
  data: PetCategory[];
}

function parsePositiveIntOption(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`Invalid positive integer: ${value}`);
  }
  return parsed;
}

function isPetCategoryEndpointUnavailable(error: unknown): boolean {
  const statusCode = (error as { statusCode?: number }).statusCode;
  return statusCode === 404 || statusCode === 405;
}

function resolvePetScanMaxPages(options: PetCategoriesListOptions): number {
  if (typeof options.petMaxPages === 'number') {
    return options.petMaxPages;
  }
  return options.scanPets ? 10 : 1;
}

function dedupePetCategories(categories: PetCategory[]): PetCategory[] {
  const byId = new Map<number, PetCategory>();
  const byName = new Map<string, PetCategory>();

  for (const category of categories) {
    if (typeof category.id === 'number') {
      if (!byId.has(category.id)) byId.set(category.id, category);
      continue;
    }
    const normalizedName = category.name.trim().toLowerCase();
    if (normalizedName && !byName.has(normalizedName)) {
      byName.set(normalizedName, category);
    }
  }

  return [...byId.values(), ...byName.values()].sort((left, right) => left.name.localeCompare(right.name));
}

async function listPetCategoriesByPetScan(
  maxPages: number,
  trigger: 'auto' | 'manual'
): Promise<PetCategoryScanResult> {
  const pets = await api.listAllPets(maxPages);
  const categories = dedupePetCategories(
    pets
      .map((pet) => pet.pet_category)
      .filter((category): category is PetCategory => Boolean(category && category.name))
  );

  return {
    mode: 'pet-scan-fallback',
    trigger,
    petsScanned: pets.length,
    categoriesDiscovered: categories.length,
    data: categories,
  };
}

export function createPetCategoriesCommand(): Command {
  const cmd = new Command('pet-categories')
    .description('List pet categories')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseIntegerOption)
    .option('-l, --limit <limit>', 'Items per page', parseIntegerOption);

  cmd
    .command('list')
    .description('List all pet categories')
    .option('--all', 'Fetch all pages')
    .option('--scan-pets', 'Fallback to scanning pets when pet category endpoint is unavailable')
    .option('--no-auto-scan', 'Disable automatic pet scan fallback when endpoint is unavailable')
    .option('--pet-max-pages <pages>', 'Maximum pet pages to scan in fallback mode', parsePositiveIntOption)
    .action(async (options: PetCategoriesListOptions, cmdParent) => {
      const parentOpts = (cmdParent.parent?.opts() as { format?: OutputFormat; page?: number; limit?: number } | undefined) || cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        try {
          if (options.all) {
            const categories = await api.listAllPetCategories();
            console.log(fmt.formatOutput(categories, format, { fields: PetCategoryFields }));
          } else {
            const result = await api.listPetCategories({
              page: parentOpts.page,
              limit: parentOpts.limit,
            });
            console.log(fmt.formatPaginatedResponse(result, format, PetCategoryFields));
          }
        } catch (error) {
          const autoScanEnabled = options.autoScan !== false;
          const shouldFallback = isPetCategoryEndpointUnavailable(error) && (options.scanPets || autoScanEnabled);
          if (shouldFallback) {
            const scanResult = await listPetCategoriesByPetScan(
              resolvePetScanMaxPages(options),
              options.scanPets ? 'manual' : 'auto'
            );
            console.log(fmt.formatOutput(scanResult, format, { fields: PetCategoryFields }));
            return;
          }

          if (isPetCategoryEndpointUnavailable(error)) {
            throw new Error(
              'Pet category endpoint is unavailable on this Monica instance. Use: monica pet-categories list --scan-pets [--pet-max-pages <n>] or monica pets list --limit 50'
            );
          }

          throw error;
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific pet category')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = (cmdParent.parent?.opts() as { format?: OutputFormat } | undefined) || cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.getPetCategory(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}

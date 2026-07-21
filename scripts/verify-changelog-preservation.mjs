#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const changelog = readFileSync('CHANGELOG.md', 'utf8');

const requiredReleaseHeadings = [
  '## Unreleased',
  '## 2026.3.6-2 - 2026-03-06',
  '## 2026.3.6 - 2026-03-06',
];

const requiredItemIds = [
  'monica-hist-2026-3-6-2-info-ux',
  'monica-hist-2026-3-6-2-info-tests',
  'monica-hist-2026-3-6-2-startup-tests',
  'monica-hist-2026-3-6-2-prompt-tests',
  'monica-hist-2026-3-6-input-parsers',
  'monica-hist-2026-3-6-field-context',
  'monica-hist-2026-3-6-eslint',
  'monica-hist-2026-3-6-strict-lint-scope',
  'monica-hist-2026-3-6-release-lint',
  'monica-hist-2026-3-6-ci-lint',
  'monica-hist-2026-3-6-lint-docs',
  'monica-hist-2026-3-6-fields-output',
  'monica-hist-2026-3-6-fields-lifecycle',
  'monica-hist-2026-3-6-parser-centralization',
  'monica-hist-2026-3-6-import-lint',
  'monica-hist-2026-3-6-info-error',
  'monica-hist-2026-3-6-format-validation',
  'monica-hist-2026-3-6-pagination-validation',
  'monica-hist-2026-3-6-default-format-validation',
  'monica-hist-2026-3-6-info-test',
  'monica-hist-2026-3-6-format-test',
  'monica-hist-2026-3-6-pagination-test',
  'monica-hist-2026-3-6-fields-test',
  'monica-hist-2026-3-6-runtime-format-test',
  'monica-hist-2026-3-6-paginated-test',
  'monica-changelog-pm-governance',
  'monica-changelog-conventional-commits',
  'monica-changelog-regression-coverage',
  'monica-changelog-coverage-floors',
  'monica-changelog-toolchain-versions',
  'monica-changelog-runtime-floors',
  'monica-changelog-dependabot-policy',
  'monica-changelog-actions-matrix',
  'monica-changelog-types-and-causes',
  'monica-changelog-pagination-cleanup',
  'monica-changelog-zero-production-vulns',
  'monica-bun-dependabot',
  'monica-dependabot-commitlint',
  'monica-output-escaping',
  'monica-settings-permissions',
  'monica-vulnerable-vitest',
];

const missing = [
  ...requiredReleaseHeadings.filter((heading) => !changelog.includes(heading)),
  ...requiredItemIds.filter((id) => !changelog.includes(`[${id}](`)),
];

if (missing.length > 0) {
  console.error('Generated changelog lost required migration evidence:');
  for (const value of missing) console.error(`- ${value}`);
  process.exit(1);
}

console.log(`Changelog preservation check passed for ${requiredItemIds.length} evidence items across all historical release sections.`);

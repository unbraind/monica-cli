#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const workflowDirectory = path.resolve('.github/workflows');
const workflowFiles = readdirSync(workflowDirectory)
  .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
  .sort();

for (const file of workflowFiles) {
  const workflow = YAML.parse(readFileSync(path.join(workflowDirectory, file), 'utf8'));
  if (!workflow || typeof workflow !== 'object') {
    throw new Error(`${file} does not contain a workflow mapping.`);
  }
  if (!workflow.name || !workflow.on || !workflow.jobs) {
    throw new Error(`${file} must define name, on, and jobs.`);
  }
}

console.log(`Validated ${workflowFiles.length} GitHub Actions workflow files.`);

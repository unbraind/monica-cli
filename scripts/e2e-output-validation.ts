import { parse as parseYaml } from 'yaml';

export type OutputValidation = 'none' | 'json' | 'yaml' | 'markdown' | 'table' | 'toon';

function validateJson(stdout: string): string | null {
  try {
    JSON.parse(stdout);
    return null;
  } catch {
    return 'JSON validation failed: stdout is not valid JSON';
  }
}

function validateYaml(stdout: string): string | null {
  try {
    const parsed = parseYaml(stdout);
    if (parsed === undefined) {
      return 'YAML validation failed: parsed value is undefined';
    }
    return null;
  } catch {
    return 'YAML validation failed: stdout is not valid YAML';
  }
}

function validateMarkdown(stdout: string): string | null {
  const trimmed = stdout.trim();
  if (!trimmed) return 'Markdown validation failed: stdout is empty';
  if (!trimmed.includes('|')) {
    return 'Markdown validation failed: expected table-like output with "|" separators';
  }
  if (!/^(\*\*.+\*\*|#|[-*]\s)/m.test(trimmed)) {
    return 'Markdown validation failed: expected markdown heading/list markers';
  }
  return null;
}

function validateTable(stdout: string): string | null {
  const lines = stdout.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length < 3) return 'Table validation failed: expected at least header/separator/data lines';
  if (!/^\d+\/\d+$/u.test(lines[0])) return 'Table validation failed: missing pagination header (page/total)';
  if (!/^-{2,}/u.test(lines[2])) return 'Table validation failed: missing dashed separator row';
  return null;
}

function validateToon(stdout: string): string | null {
  const lines = stdout.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return 'Toon validation failed: expected at least pagination and first data row';
  if (!/^\d+\/\d+$/u.test(lines[0])) return 'Toon validation failed: missing pagination header (page/total)';
  if (!/^\d+:\s/u.test(lines[1])) return 'Toon validation failed: missing indexed row prefix ("0: ...")';
  return null;
}

export function validateOutput(
  stdout: string,
  validation: OutputValidation
): string | null {
  if (validation === 'none') return null;
  if (validation === 'json') return validateJson(stdout);
  if (validation === 'yaml') return validateYaml(stdout);
  if (validation === 'markdown') return validateMarkdown(stdout);
  if (validation === 'table') return validateTable(stdout);
  return validateToon(stdout);
}

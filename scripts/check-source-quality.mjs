import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import ts from 'typescript';

const MAX_CODE_LINES = 300;
const DECLARATION_KINDS = new Set([
  ts.SyntaxKind.ClassDeclaration,
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.TypeAliasDeclaration,
  ts.SyntaxKind.VariableStatement,
]);

const files = execFileSync('rg', ['--files', 'src', 'tests', '-g', '*.ts'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);
const failures = [];
let documented = 0;
let exported = 0;

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const codeLines = new Set();
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, source);
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    const start = sourceFile.getLineAndCharacterOfPosition(scanner.getTokenPos()).line;
    const end = sourceFile.getLineAndCharacterOfPosition(scanner.getTextPos()).line;
    for (let line = start; line <= end; line += 1) codeLines.add(line);
  }
  if (codeLines.size > MAX_CODE_LINES) failures.push(`${file}: ${codeLines.size} code lines (maximum ${MAX_CODE_LINES})`);

  const visit = (node) => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      failures.push(`${file}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: explicit any is forbidden`);
    }
    if (node.kind === ts.SyntaxKind.ImportType) {
      failures.push(`${file}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: inline type imports are forbidden`);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      failures.push(`${file}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: dynamic imports are forbidden`);
    }
    if ([ts.SyntaxKind.EnumDeclaration, ts.SyntaxKind.ModuleDeclaration, ts.SyntaxKind.ImportEqualsDeclaration].includes(node.kind)) {
      failures.push(`${file}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: non-erasable TypeScript syntax is forbidden`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  if (!file.startsWith('src/')) continue;
  for (const node of sourceFile.statements) {
    if (!DECLARATION_KINDS.has(node.kind) || !node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    exported += 1;
    const comments = ts.getLeadingCommentRanges(source, node.pos) ?? [];
    if (comments.some((range) => source.slice(range.pos, range.end).startsWith('/**'))) documented += 1;
    else failures.push(`${file}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: exported declaration lacks JSDoc`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Code quality passed: ${files.length} source/test files, ${exported}/${exported} documented source exports, <=${MAX_CODE_LINES} code lines each.`);
}

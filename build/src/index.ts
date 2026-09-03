/**
 * atlas-build — compiler/validator CLI for the Structure Atlas.
 *
 * M0 scope (ROADMAP.md): validate graph/schema.yaml and the structural shape
 * of graph/edges.yaml + graph/symptoms.yaml. The full pipeline
 * (parse → validate content → link → analyze → emit; ARCHITECTURE.md §4)
 * lands in M1/M5. `--check` is the CI gate.
 *
 * Usage: atlas [--check] [--root <dir>]
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { exit } from 'node:process';
import { parse } from 'yaml';
import { loadSchema, type Issue } from './schema.js';

interface Args {
  check: boolean;
  root: string;
}

/**
 * Default content root: nearest ancestor of cwd containing graph/schema.yaml.
 * npm runs workspace scripts with cwd inside the workspace, so plain cwd
 * would miss the repository root. --root overrides (ARCHITECTURE.md §9 #5:
 * the build is parameterized on a content directory).
 */
function findContentRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (existsSync(join(dir, 'graph', 'schema.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

function parseArgs(argv: string[]): Args {
  const args: Args = { check: false, root: findContentRoot(process.cwd()) };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') args.check = true;
    else if (a === '--root') {
      const v = argv[++i];
      if (!v) {
        console.error('atlas-build: --root needs a directory argument');
        exit(2);
      }
      args.root = v;
    } else {
      console.error(`atlas-build: unknown argument "${a}"`);
      exit(2);
    }
  }
  return args;
}

/** M0 shape check for the not-yet-populated data files: must be a YAML list. */
function checkYamlList(path: string): Issue[] {
  if (!existsSync(path)) {
    return [
      { severity: 'error', rule: 'content/missing-file', file: path, message: 'file is missing' },
    ];
  }
  try {
    const data = parse(readFileSync(path, 'utf8'));
    if (data === null) return []; // comments-only file counts as empty
    if (!Array.isArray(data)) {
      return [
        {
          severity: 'error',
          rule: 'content/shape',
          file: path,
          message: 'top level must be a YAML list',
        },
      ];
    }
  } catch (e) {
    return [
      {
        severity: 'error',
        rule: 'content/yaml',
        file: path,
        message: `YAML parse error: ${(e as Error).message}`,
      },
    ];
  }
  return [];
}

function printIssues(issues: Issue[]): void {
  for (const issue of issues) {
    console.log(`[${issue.severity}] ${issue.rule} ${issue.file}: ${issue.message}`);
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const issues: Issue[] = [];

  const schemaPath = join(args.root, 'graph', 'schema.yaml');
  const { schema, issues: schemaIssues } = loadSchema(schemaPath);
  issues.push(...schemaIssues);

  issues.push(...checkYamlList(join(args.root, 'graph', 'edges.yaml')));
  issues.push(...checkYamlList(join(args.root, 'graph', 'symptoms.yaml')));

  printIssues(issues);
  const errors = issues.filter((i) => i.severity === 'error').length;

  if (schema && errors === 0) {
    console.log(
      `schema OK: ${schema.node_types.length} node types, ` +
        `${schema.edge_types.length} edge types, ${schema.strengths.length} strengths, ` +
        `${schema.fields.length} fields`,
    );
  }
  if (!args.check) {
    console.log(
      'note: compile stages (content validation, link, render, analyze, emit) arrive in M1+;',
    );
    console.log('      --check (schema + file shape) is the only functional mode today.');
  }
  exit(errors > 0 ? 1 : 0);
}

main();

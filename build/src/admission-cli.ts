/**
 * atlas-admit — deterministic, offline pre-admission review.
 *
 * Reads trusted atlas content plus untrusted YAML dossiers. It writes nothing;
 * callers may redirect stable text or JSON output to an untrusted report path.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { exit } from 'node:process';
import { renderJson, renderText } from './admission/report.js';
import { validateDossier } from './admission/validate.js';

interface Args {
  root: string;
  format: 'text' | 'json';
  inputs: string[];
}

function findContentRoot(start: string): string {
  let directory = resolve(start);
  for (;;) {
    if (existsSync(join(directory, 'graph', 'schema.yaml'))) return directory;
    const parent = dirname(directory);
    if (parent === directory) return resolve(start);
    directory = parent;
  }
}

function parseArgs(argv: string[]): Args {
  const invocationDirectory = process.env.INIT_CWD ?? process.cwd();
  const args: Args = { root: findContentRoot(invocationDirectory), format: 'text', inputs: [] };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]!;
    if (argument === '--root' || argument === '--format') {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} needs a value`);
      if (argument === '--root') args.root = resolve(invocationDirectory, value);
      else if (value === 'text' || value === 'json') args.format = value;
      else throw new Error('--format must be text or json');
    } else if (argument.startsWith('-')) {
      throw new Error(`unknown argument "${argument}"`);
    } else args.inputs.push(resolve(invocationDirectory, argument));
  }
  if (args.inputs.length === 0)
    throw new Error('provide one or more dossier YAML files or directories');
  return args;
}

function collectInputs(inputs: string[]): string[] {
  const files: string[] = [];
  for (const input of inputs) {
    if (!existsSync(input)) throw new Error(`input does not exist: ${input}`);
    if (statSync(input).isDirectory()) {
      for (const name of readdirSync(input).sort()) {
        const path = join(input, name);
        if (statSync(path).isFile() && ['.yaml', '.yml'].includes(extname(name))) files.push(path);
      }
    } else files.push(input);
  }
  return [...new Set(files.map((file) => resolve(file)))].sort();
}

function main(): void {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
    const reports = collectInputs(args.inputs).map((file) => validateDossier(args.root, file));
    process.stdout.write(args.format === 'json' ? renderJson(reports) : renderText(reports));
    if (reports.some((report) => report.summary.errors > 0)) exit(1);
  } catch (error) {
    console.error(`atlas-admit: ${(error as Error).message}`);
    exit(2);
  }
}

main();

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { exit } from 'node:process';
import { stableStringify } from './emit.js';
import { harvestManifest } from './admission/harvest.js';

interface Args {
  root: string;
  manifest?: string;
  out?: string;
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
  const args: Args = { root: findContentRoot(invocationDirectory) };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]!;
    if (!['--root', '--manifest', '--out'].includes(argument)) {
      throw new Error(`unknown argument "${argument}"`);
    }
    const value = argv[++index];
    if (!value) throw new Error(`${argument} needs a value`);
    if (argument === '--root') args.root = resolve(invocationDirectory, value);
    else if (argument === '--manifest') args.manifest = resolve(invocationDirectory, value);
    else args.out = resolve(invocationDirectory, value);
  }
  if (!args.manifest || !args.out) throw new Error('--manifest and --out are required');
  return args;
}

function main(): void {
  try {
    const args = parseArgs(process.argv.slice(2));
    const report = harvestManifest(args.root, args.manifest!, args.out!);
    process.stdout.write(stableStringify(report));
    exit(0);
  } catch (error) {
    console.error(`atlas-harvest: ${(error as Error).message}`);
    exit(2);
  }
}

main();

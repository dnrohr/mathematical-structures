import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { exit } from 'node:process';
import { buildPromotionPreview } from './admission/promotion-preview.js';
import { stableStringify } from './emit.js';

function findRoot(start: string): string {
  let directory = resolve(start);
  for (;;) {
    if (existsSync(join(directory, 'graph', 'schema.yaml'))) return directory;
    const parent = dirname(directory);
    if (parent === directory) return resolve(start);
    directory = parent;
  }
}

try {
  const invocation = process.env.INIT_CWD ?? process.cwd();
  const args = process.argv.slice(2);
  const get = (flag: string): string => {
    const index = args.indexOf(flag);
    if (index < 0 || !args[index + 1]) throw new Error(`${flag} is required`);
    return resolve(invocation, args[index + 1]!);
  };
  const report = buildPromotionPreview(findRoot(invocation), get('--campaign'), get('--out'));
  process.stdout.write(stableStringify(report));
  exit(report.summary.integrated_validation_errors > 0 ? 1 : 0);
} catch (error) {
  console.error(`atlas-promotion-preview: ${(error as Error).message}`);
  exit(2);
}

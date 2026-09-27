import { resolve } from 'node:path';
import { exit } from 'node:process';
import { applyEvidencePack } from './admission/evidence.js';
import { stableStringify } from './emit.js';

try {
  const invocation = process.env.INIT_CWD ?? process.cwd();
  const args = process.argv.slice(2);
  const get = (flag: string): string => {
    const index = args.indexOf(flag);
    if (index < 0 || !args[index + 1]) throw new Error(`${flag} is required`);
    return resolve(invocation, args[index + 1]!);
  };
  process.stdout.write(stableStringify(applyEvidencePack(get('--campaign'), get('--pack'))));
  exit(0);
} catch (error) {
  console.error(`atlas-evidence: ${(error as Error).message}`);
  exit(2);
}

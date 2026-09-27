import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { exit } from 'node:process';
import { stableStringify } from './emit.js';
import { triageCampaign } from './admission/triage.js';

function main(): void {
  try {
    const invocation = process.env.INIT_CWD ?? process.cwd();
    const args = process.argv.slice(2);
    const value = (flag: string): string => {
      const index = args.indexOf(flag);
      if (index < 0 || !args[index + 1]) throw new Error(`${flag} is required`);
      return resolve(invocation, args[index + 1]!);
    };
    const campaign = value('--campaign');
    const manifest = value('--manifest');
    if (!existsSync(campaign) || !existsSync(manifest))
      throw new Error('campaign and manifest must exist');
    process.stdout.write(stableStringify(triageCampaign(campaign, manifest)));
    exit(0);
  } catch (error) {
    console.error(`atlas-triage: ${(error as Error).message}`);
    exit(2);
  }
}

main();

import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FIXTURE_VALID = fileURLToPath(new URL('./fixtures/valid', import.meta.url));

const created: string[] = [];

/** Write a throwaway content tree; paths are relative file → content. */
export function makeTree(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'atlas-test-'));
  created.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return dir;
}

/** Copy of the valid fixture that a test can then mutate. */
export function copyValidTree(): string {
  const dir = mkdtempSync(join(tmpdir(), 'atlas-test-'));
  created.push(dir);
  cpSync(FIXTURE_VALID, dir, { recursive: true });
  return dir;
}

export function cleanupTrees(): void {
  for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
}

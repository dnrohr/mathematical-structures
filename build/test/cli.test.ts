/**
 * The CLI end to end, over a content tree that is not this repository —
 * the fork seam (spec §8.5, ARCHITECTURE.md §9, ROADMAP M15). The fixture
 * atlas carries its own trimmed vocabularies and lives in a temp directory
 * outside any git repo, so this proves the whole path a fork would use:
 * `--content` + `--out` emits every artifact deterministically with
 * provenance degraded to "unknown", `--check` gates it, and a directory
 * that is not an atlas fails with a named error, never a stack trace.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { cleanupTrees, copyValidTree, makeTree } from './helpers.js';

const TSX_CLI = createRequire(import.meta.url).resolve('tsx/cli');
const ENTRY = fileURLToPath(new URL('../src/index.ts', import.meta.url));

const ARTIFACTS = [
  'atlas.graphml',
  'edges.csv',
  'graph.json',
  'nodes.csv',
  'search-index.json',
] as const;

function run(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const res = spawnSync(process.execPath, [TSX_CLI, ENTRY, ...args], { encoding: 'utf8' });
  return { status: res.status, stdout: res.stdout, stderr: res.stderr };
}

afterAll(cleanupTrees);

describe('atlas-build --content (the fork seam)', () => {
  it('checks and builds a foreign tree; two builds are byte-identical; no git → "unknown"', () => {
    const tree = copyValidTree();

    const check = run('--content', tree, '--check');
    expect(check.status).toBe(0);
    expect(check.stdout).toContain('content OK');

    const outs = [join(tree, 'out-a'), join(tree, 'out-b')].map((out) => {
      const res = run('--content', tree, '--out', out);
      expect(res.status).toBe(0);
      expect(readdirSync(out).sort()).toEqual([...ARTIFACTS]);
      return out;
    });

    const graph = JSON.parse(readFileSync(join(outs[0]!, 'graph.json'), 'utf8')) as {
      generated_from: string;
    };
    expect(graph.generated_from).toBe('unknown');

    for (const name of ARTIFACTS) {
      const [a, b] = outs.map((out) => readFileSync(join(out, name), 'utf8'));
      expect(a, `${name} must be byte-identical across builds`).toBe(b);
    }
  });

  it('accepts --root as the pre-M15 alias of --content', () => {
    const tree = copyValidTree();
    const res = run('--root', tree, '--check');
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('content OK');
  });

  it('fails a directory with no graph/schema.yaml with the named rule, not a crash', () => {
    const tree = makeTree({ 'README.md': 'not an atlas\n' });
    const res = run('--content', tree, '--check');
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('schema/read');
    expect(res.stdout).toContain(join(tree, 'graph', 'schema.yaml'));
  });

  it('rejects unknown arguments with usage exit code 2', () => {
    const res = run('--nope');
    expect(res.status).toBe(2);
    expect(res.stderr).toContain('unknown argument');
  });
});

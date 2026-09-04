import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import MiniSearch from 'minisearch';
import { afterAll, describe, expect, it } from 'vitest';
import { buildGraphJson, buildSearchIndex, stableStringify, writeArtifacts } from '../src/emit.js';
import { runPipeline } from '../src/pipeline.js';
import { cleanupTrees, FIXTURE_VALID } from './helpers.js';

afterAll(cleanupTrees);

function buildOnce(outDir: string): string[] {
  const result = runPipeline(FIXTURE_VALID);
  const g = result.graph!;
  const graphJson = buildGraphJson(result.schema!, g.nodes, g.edges, g.symptoms, 'test-sha');
  const searchIndex = buildSearchIndex(g.nodes, g.symptoms);
  return writeArtifacts(outDir, graphJson, searchIndex);
}

describe('emit determinism', () => {
  it('two builds produce byte-identical artifacts', () => {
    const a = mkdtempSync(join(tmpdir(), 'atlas-emit-a-'));
    const b = mkdtempSync(join(tmpdir(), 'atlas-emit-b-'));
    const filesA = buildOnce(a);
    const filesB = buildOnce(b);
    for (let i = 0; i < filesA.length; i++) {
      expect(readFileSync(filesA[i]!, 'utf8')).toBe(readFileSync(filesB[i]!, 'utf8'));
    }
  });

  it('stableStringify sorts object keys recursively and keeps array order', () => {
    const text = stableStringify({ b: 1, a: { d: [3, 1, 2], c: 0 } });
    expect(text.indexOf('"a"')).toBeLessThan(text.indexOf('"b"'));
    expect(text.indexOf('"c"')).toBeLessThan(text.indexOf('"d"'));
    expect(text).toContain('[\n      3,\n      1,\n      2\n    ]');
  });
});

describe('graph.json shape', () => {
  const result = runPipeline(FIXTURE_VALID);
  const g = result.graph!;
  const graphJson = buildGraphJson(result.schema!, g.nodes, g.edges, g.symptoms, 'test-sha');

  it('carries version, provenance, schema, and sorted content', () => {
    expect(graphJson.schema_version).toBe('1.0.0');
    expect(graphJson.generated_from).toBe('test-sha');
    const nodes = graphJson.nodes as { slug: string }[];
    expect(nodes.map((n) => n.slug)).toEqual(['eigenvalues', 'kalman-filter', 'markov-chains']);
  });
});

describe('search index', () => {
  it('round-trips through MiniSearch and finds nodes by alias', () => {
    const result = runPipeline(FIXTURE_VALID);
    const g = result.graph!;
    const payload = buildSearchIndex(g.nodes, g.symptoms) as {
      options: { boost: Record<string, number> } & Record<string, unknown>;
      index: unknown;
    };
    const ms = MiniSearch.loadJSON(JSON.stringify(payload.index), {
      idField: 'id',
      fields: ['name', 'aliases', 'summary'],
      storeFields: ['name', 'kind'],
    });
    const hits = ms.search('poles', { boost: payload.options.boost });
    expect(hits[0]?.id).toBe('eigenvalues');
    const symptomHits = ms.search('coupled', { prefix: true });
    expect(symptomHits.some((h) => String(h.id).startsWith('symptom:'))).toBe(true);
  });
});

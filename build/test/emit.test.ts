import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import MiniSearch from 'minisearch';
import { afterAll, describe, expect, it } from 'vitest';
import { analyzeGraph } from '../src/analyze.js';
import { buildGraphJson, buildSearchIndex, stableStringify, writeArtifacts } from '../src/emit.js';
import { buildEdgesCsv, buildGraphml, buildNodesCsv } from '../src/export.js';
import { runPipeline } from '../src/pipeline.js';
import type { GraphMetrics } from '../src/model.js';
import { cleanupTrees, FIXTURE_VALID } from './helpers.js';

afterAll(cleanupTrees);

function buildOnce(outDir: string): string[] {
  const result = runPipeline(FIXTURE_VALID);
  const g = result.graph!;
  const metrics = analyzeGraph(result.schema!, g.nodes, g.edges, g.candidates);
  const graphJson = buildGraphJson(
    result.schema!,
    g.nodes,
    g.edges,
    g.symptoms,
    metrics,
    'test-sha',
  );
  const searchIndex = buildSearchIndex(g.nodes, g.symptoms);
  return writeArtifacts(outDir, {
    'graph.json': stableStringify(graphJson),
    'search-index.json': stableStringify(searchIndex),
    'atlas.graphml': buildGraphml(g.nodes, g.edges, metrics),
    'nodes.csv': buildNodesCsv(g.nodes, metrics),
    'edges.csv': buildEdgesCsv(g.edges),
  });
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
  const metrics = analyzeGraph(result.schema!, g.nodes, g.edges, g.candidates);
  const graphJson = buildGraphJson(
    result.schema!,
    g.nodes,
    g.edges,
    g.symptoms,
    metrics,
    'test-sha',
  );

  it('carries version, provenance, schema, and sorted content', () => {
    expect(graphJson.schema_version).toBe('1.1.0');
    expect(graphJson.generated_from).toBe('test-sha');
    const nodes = graphJson.nodes as { slug: string }[];
    expect(nodes.map((n) => n.slug)).toEqual(['eigenvalues', 'kalman-filter', 'markov-chains']);
  });

  it('packages the metrics block: trusted floor, gaps, per-node entries', () => {
    const m = graphJson.metrics as GraphMetrics;
    // Fixture edges: IS-A special-case (trusted), FIELD-DIALECT-OF
    // strong-analogy and PMM speculative (both below the floor).
    expect(m.trusted).toEqual({
      min_strength: 'special-case',
      edge_count: 1,
      excluded_edge_count: 2,
      node_count: 2,
    });
    expect(Object.keys(m.nodes)).toEqual(['eigenvalues', 'kalman-filter', 'markov-chains']);
    expect(m.nodes['eigenvalues']).toMatchObject({ degree: 0, betweenness: 0, community: null });
    expect(m.nodes['kalman-filter']!.degree).toBe(1);
    expect(m.nodes['kalman-filter']!.community).toBe(m.nodes['markov-chains']!.community);
    expect(m.gaps).toEqual([
      {
        from: 'eigenvalues',
        to: 'kalman-filter',
        type: 'POSSIBLE-MISSING-MIGRATION',
        strength: 'speculative',
        status: 'open-candidate',
      },
    ]);
  });
});

describe('export emitters', () => {
  const result = runPipeline(FIXTURE_VALID);
  const g = result.graph!;
  const metrics = analyzeGraph(result.schema!, g.nodes, g.edges, g.candidates);

  it('GraphML declares keys, escapes XML, and carries nodes/edges with data', () => {
    const xml = buildGraphml(g.nodes, g.edges, metrics);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<key id="n_betweenness" for="node" attr.name="betweenness"');
    expect(xml).toContain('<node id="eigenvalues">');
    expect(xml).toContain('<edge source="eigenvalues" target="kalman-filter">');
    expect(xml).toContain('<data key="e_gap_status">open-candidate</data>');
    // No raw ampersands/angles outside tags: canonical_name is escaped.
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;)/);
  });

  it('CSV quotes fields with commas and joins evidence/fields with semicolons', () => {
    const nodesCsv = buildNodesCsv(g.nodes, metrics);
    const [header, firstRow] = nodesCsv.split('\r\n');
    expect(header).toBe(
      'slug,canonical_name,node_type,status,fields,degree,betweenness,community,span_entropy,dialect_count,summary',
    );
    expect(firstRow).toContain('eigenvalues,Eigenvalues and spectral decomposition');
    expect(firstRow).toContain('control;statistics;probability');
    const edgesCsv = buildEdgesCsv(g.edges);
    expect(edgesCsv.split('\r\n')[0]).toBe(
      'from,to,type,strength,symmetric,gap_status,context,notes,evidence',
    );
    expect(edgesCsv).toContain('"fixture claim, not mathematics"');
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

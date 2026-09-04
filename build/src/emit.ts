/**
 * Stage 5 — emit: write deterministic artifacts (ARCHITECTURE.md §4.5).
 * Same input tree → byte-identical output: object keys sorted, arrays in
 * pipeline-defined order, no timestamps.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import MiniSearch from 'minisearch';
import type { GraphEdge, GraphNode, GraphSymptom } from './model.js';
import type { AtlasSchema } from './schema.js';

/** The public artifact version (docs/graph-json.md); semver, additive = minor. */
export const GRAPH_SCHEMA_VERSION = '1.0.0';

/** MiniSearch construction options — the app must load with the same ones. */
export const SEARCH_OPTIONS: { idField: string; fields: string[]; storeFields: string[] } = {
  idField: 'id',
  fields: ['name', 'aliases', 'summary'],
  storeFields: ['name', 'kind'],
};

/** Recommended search-time boosts (aliases highest: reverse-dialect lookup). */
export const SEARCH_BOOST = { aliases: 3, name: 2, summary: 1 } as const;

export function deepSortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(deepSortKeys);
  if (typeof value === 'object' && value !== null) {
    const rec = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(rec).sort()) {
      const v = rec[key];
      if (v !== undefined) out[key] = deepSortKeys(v);
    }
    return out;
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(deepSortKeys(value), null, 2) + '\n';
}

export function gitSha(root: string): string {
  const res = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  return res.status === 0 ? res.stdout.trim() : 'unknown';
}

export function buildGraphJson(
  schema: AtlasSchema,
  nodes: GraphNode[],
  edges: GraphEdge[],
  symptoms: GraphSymptom[],
  generatedFrom: string,
): Record<string, unknown> {
  return {
    schema_version: GRAPH_SCHEMA_VERSION,
    generated_from: generatedFrom,
    schema: {
      node_types: schema.node_types,
      edge_types: schema.edge_types,
      strengths: schema.strengths,
      fields: schema.fields,
      node_statuses: schema.node_statuses,
      gap_statuses: schema.gap_statuses,
      analysis: schema.analysis,
    },
    nodes,
    edges,
    symptoms,
  };
}

export function buildSearchIndex(
  nodes: GraphNode[],
  symptoms: GraphSymptom[],
): Record<string, unknown> {
  const docs = [
    ...nodes.map((n) => ({
      id: n.slug,
      kind: 'concept',
      name: n.canonical_name,
      aliases: n.aliases.map((a) => a.name).join(' ; '),
      summary: n.summary,
    })),
    ...symptoms.map((s) => ({
      id: `symptom:${s.id}`,
      kind: 'symptom',
      name: s.symptom,
      aliases: '',
      summary: '',
    })),
  ].sort((a, b) => a.id.localeCompare(b.id));

  const ms = new MiniSearch(SEARCH_OPTIONS);
  ms.addAll(docs);
  return {
    schema_version: GRAPH_SCHEMA_VERSION,
    options: { ...SEARCH_OPTIONS, boost: SEARCH_BOOST },
    index: ms.toJSON(),
  };
}

export function writeArtifacts(
  outDir: string,
  graphJson: Record<string, unknown>,
  searchIndex: Record<string, unknown>,
): string[] {
  mkdirSync(outDir, { recursive: true });
  const graphPath = join(outDir, 'graph.json');
  const searchPath = join(outDir, 'search-index.json');
  writeFileSync(graphPath, stableStringify(graphJson));
  writeFileSync(searchPath, stableStringify(searchIndex));
  return [graphPath, searchPath];
}

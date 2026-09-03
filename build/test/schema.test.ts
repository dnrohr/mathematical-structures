import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { validateSchema, type AtlasSchema } from '../src/schema.js';

const schemaPath = fileURLToPath(new URL('../../graph/schema.yaml', import.meta.url));

function freshSchema(): Record<string, unknown> {
  // Re-parse per test so mutations never leak between cases.
  return parse(readFileSync(schemaPath, 'utf8')) as Record<string, unknown>;
}

function errorsOf(data: unknown) {
  return validateSchema(data, 'test').issues.filter((i) => i.severity === 'error');
}

describe('graph/schema.yaml (the real one)', () => {
  it('validates with zero errors', () => {
    const { schema, issues } = validateSchema(freshSchema(), schemaPath);
    expect(issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect(schema).toBeDefined();
  });

  it('covers the notebook vocabulary consolidation', () => {
    const { schema } = validateSchema(freshSchema(), schemaPath);
    const s = schema as AtlasSchema;
    const edgeIds = s.edge_types.map((e) => e.id);
    // Spot-check the §16/§27/§29 consolidation survived intact.
    for (const required of [
      'IS-A',
      'FIELD-DIALECT-OF',
      'POSSIBLE-MISSING-MIGRATION',
      'ASSUMES',
      'FAILS-WHEN',
      'REPLACED-BY',
      'SYMMETRY-SELECTS-REPRESENTATION',
    ]) {
      expect(edgeIds).toContain(required);
    }
    expect(s.strengths.map((x) => x.id)).toEqual([
      'identity',
      'theorem',
      'special-case',
      'strong-analogy',
      'heuristic-analogy',
      'speculative',
    ]);
    expect(s.node_types.length).toBeGreaterThanOrEqual(8);
  });
});

describe('validateSchema rejections', () => {
  it('rejects a duplicated id', () => {
    const data = freshSchema();
    const fields = data.fields as { id: string; label: string }[];
    fields.push({ ...fields[0]! });
    const errors = errorsOf(data);
    expect(errors.some((e) => e.rule === 'schema/duplicate-id')).toBe(true);
  });

  it('rejects a directed edge type without reverse phrasing', () => {
    const data = freshSchema();
    const edges = data.edge_types as Record<string, unknown>[];
    const directed = edges.find((e) => e.directionality === 'directed')!;
    delete directed.reverse;
    expect(errorsOf(data).some((e) => e.rule === 'schema/edge-phrasing')).toBe(true);
  });

  it('rejects a symmetric edge type with forward/reverse phrasing', () => {
    const data = freshSchema();
    const edges = data.edge_types as Record<string, unknown>[];
    const symmetric = edges.find((e) => e.directionality === 'symmetric')!;
    symmetric.forward = 'oops';
    expect(errorsOf(data).some((e) => e.rule === 'schema/edge-phrasing')).toBe(true);
  });

  it('rejects non-contiguous strength ranks', () => {
    const data = freshSchema();
    const strengths = data.strengths as Record<string, unknown>[];
    strengths[strengths.length - 1]!.rank = 99;
    expect(errorsOf(data).some((e) => e.rule === 'schema/strength-rank')).toBe(true);
  });

  it('rejects an unknown trusted_min_strength', () => {
    const data = freshSchema();
    (data.analysis as Record<string, unknown>).trusted_min_strength = 'vibes';
    expect(errorsOf(data).some((e) => e.rule === 'schema/analysis')).toBe(true);
  });

  it('rejects a node_requirements key that is not a status', () => {
    const data = freshSchema();
    (data.node_requirements as Record<string, unknown>).imaginary = ['summary'];
    expect(errorsOf(data).some((e) => e.rule === 'schema/node-requirements')).toBe(true);
  });

  it('rejects a malformed id', () => {
    const data = freshSchema();
    (data.fields as { id: string; label: string }[]).push({ id: 'Not Kebab', label: 'x' });
    expect(errorsOf(data).some((e) => e.rule === 'schema/id-format')).toBe(true);
  });
});

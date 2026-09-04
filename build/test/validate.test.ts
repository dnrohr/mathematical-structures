import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type { ConceptRecord, EdgeRecord, SymptomRecord } from '../src/model.js';
import { loadSchema, type AtlasSchema } from '../src/schema.js';
import { validateContent } from '../src/validate.js';
import { cleanupTrees, FIXTURE_VALID } from './helpers.js';

const schema = loadSchema(join(FIXTURE_VALID, 'graph', 'schema.yaml')).schema as AtlasSchema;

afterAll(cleanupTrees);

function concept(slug: string, front: Record<string, unknown>, body = ''): ConceptRecord {
  return { slug, file: `concepts/${slug}.md`, front, body };
}

const GOOD_NODE = {
  canonical_name: 'Eigenvalues',
  node_type: 'object',
  status: 'stub',
  summary: 'x',
};

function edge(raw: Record<string, unknown>, index = 0): EdgeRecord {
  return { file: 'graph/edges.yaml', index, raw };
}

const GOOD_EDGE = { from: 'a', to: 'b', type: 'IS-A', strength: 'theorem' };

function symptom(raw: Record<string, unknown>, index = 0): SymptomRecord {
  return { file: 'graph/symptoms.yaml', index, raw };
}

const NODES_AB = [concept('a', GOOD_NODE), concept('b', GOOD_NODE)];

function rulesFor(
  concepts: ConceptRecord[],
  edges: EdgeRecord[] = [],
  symptoms: SymptomRecord[] = [],
): string[] {
  return validateContent(schema, concepts, edges, symptoms).map((i) => `${i.severity}:${i.rule}`);
}

describe('concept rules', () => {
  it('accepts a well-formed node', () => {
    expect(rulesFor([concept('a', GOOD_NODE)])).toEqual([]);
  });

  it('content/required-field per status', () => {
    // stub: summary required by "all"
    expect(rulesFor([concept('a', { ...GOOD_NODE, summary: undefined })])).toContain(
      'error:content/required-field',
    );
    // established additionally requires fields + canonical_examples
    expect(
      rulesFor([concept('a', { ...GOOD_NODE, status: 'established', fields: ['control'] })]),
    ).toContain('error:content/required-field');
  });

  it('vocabulary violations', () => {
    expect(rulesFor([concept('a', { ...GOOD_NODE, node_type: 'vibe' })])).toContain(
      'error:content/unknown-node-type',
    );
    expect(rulesFor([concept('a', { ...GOOD_NODE, status: 'maybe' })])).toContain(
      'error:content/unknown-status',
    );
    expect(rulesFor([concept('a', { ...GOOD_NODE, fields: ['astrology'] })])).toContain(
      'error:content/unknown-field',
    );
  });

  it('content/alias-shape and alias field vocabulary', () => {
    expect(rulesFor([concept('a', { ...GOOD_NODE, aliases: [{ name: 'poles' }] })])).toContain(
      'error:content/alias-shape',
    );
    expect(
      rulesFor([concept('a', { ...GOOD_NODE, aliases: [{ name: 'poles', field: 'astrology' }] })]),
    ).toContain('error:content/unknown-field');
  });

  it('content/aliases-expected warn on multi-field nodes without aliases', () => {
    const front = {
      ...GOOD_NODE,
      status: 'established',
      fields: ['control', 'statistics', 'probability'],
      canonical_examples: ['x'],
    };
    expect(rulesFor([concept('a', front)])).toContain('warn:content/aliases-expected');
  });

  it('content/unknown-key warn', () => {
    expect(rulesFor([concept('a', { ...GOOD_NODE, colour: 'red' })])).toContain(
      'warn:content/unknown-key',
    );
  });

  it('list shapes', () => {
    expect(rulesFor([concept('a', { ...GOOD_NODE, assumptions: 'smoothness' })])).toContain(
      'error:content/list-shape',
    );
    expect(rulesFor([concept('a', { ...GOOD_NODE, fields: 'control' })])).toContain(
      'error:content/fields-shape',
    );
  });
});

describe('edge rules', () => {
  it('accepts a well-formed edge', () => {
    expect(rulesFor(NODES_AB, [edge(GOOD_EDGE)])).toEqual([]);
  });

  it('edge/unknown-endpoint and edge/endpoint-missing', () => {
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, to: 'ghost' })])).toContain(
      'error:edge/unknown-endpoint',
    );
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, from: undefined })])).toContain(
      'error:edge/endpoint-missing',
    );
  });

  it('edge/self-loop', () => {
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, to: 'a' })])).toContain('error:edge/self-loop');
  });

  it('edge/unknown-type and edge/unknown-strength', () => {
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, type: 'RESEMBLES' })])).toContain(
      'error:edge/unknown-type',
    );
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, strength: 'vibes' })])).toContain(
      'error:edge/unknown-strength',
    );
  });

  it('edge/duplicate, including reversed duplicate of a symmetric edge', () => {
    expect(rulesFor(NODES_AB, [edge(GOOD_EDGE, 0), edge(GOOD_EDGE, 1)])).toContain(
      'error:edge/duplicate',
    );
    const sym = { from: 'a', to: 'b', type: 'FIELD-DIALECT-OF', strength: 'identity' };
    const reversed = { ...sym, from: 'b', to: 'a' };
    expect(rulesFor(NODES_AB, [edge(sym, 0), edge(reversed, 1)])).toContain('error:edge/duplicate');
    // ...but a reversed directed edge is legitimate.
    expect(
      rulesFor(NODES_AB, [edge(GOOD_EDGE, 0), edge({ ...GOOD_EDGE, from: 'b', to: 'a' }, 1)]),
    ).toEqual([]);
  });

  it('epistemic rules: gap status and gap strength ceiling', () => {
    const gap = { from: 'a', to: 'b', type: 'POSSIBLE-MISSING-MIGRATION', strength: 'speculative' };
    expect(rulesFor(NODES_AB, [edge(gap)])).toContain('error:edge/needs-gap-status');
    expect(rulesFor(NODES_AB, [edge({ ...gap, status: 'open-candidate' })])).toEqual([]);
    expect(rulesFor(NODES_AB, [edge({ ...gap, status: 'someday' })])).toContain(
      'error:edge/unknown-gap-status',
    );
    expect(
      rulesFor(NODES_AB, [edge({ ...gap, strength: 'theorem', status: 'open-candidate' })]),
    ).toContain('error:edge/gap-strength');
    // speculative strength on any type also demands a status
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, strength: 'speculative' })])).toContain(
      'error:edge/needs-gap-status',
    );
    // a status on a non-gap, non-speculative edge is meaningless
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, status: 'open-candidate' })])).toContain(
      'error:edge/unexpected-status',
    );
  });

  it('edge/directionality: per-edge overrides are rejected outright', () => {
    // Symmetry comes from the edge type; overrides had no valid display
    // phrasing and made duplicate detection order-dependent (PR #2 review).
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, directionality: 'both' })])).toContain(
      'error:edge/directionality',
    );
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, directionality: 'symmetric' })])).toContain(
      'error:edge/directionality',
    );
    const sym = { from: 'a', to: 'b', type: 'FIELD-DIALECT-OF', strength: 'identity' };
    expect(rulesFor(NODES_AB, [edge({ ...sym, directionality: 'symmetric' })])).toContain(
      'error:edge/directionality',
    );
  });

  it('shape rules for evidence/context/notes and unknown keys', () => {
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, evidence: 'doi' })])).toContain(
      'error:edge/evidence-shape',
    );
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, notes: 7 })])).toContain(
      'error:edge/text-shape',
    );
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, vibes: 'high' })])).toContain(
      'warn:content/unknown-key',
    );
  });
});

describe('symptom rules', () => {
  const GOOD_SYMPTOM = { id: 's1', symptom: 'Coupled variables', moves: ['a'] };

  it('accepts a well-formed symptom (non-stub move)', () => {
    const established = concept('a', {
      ...GOOD_NODE,
      status: 'established',
      fields: ['control'],
      canonical_examples: ['x'],
    });
    expect(rulesFor([established, concept('b', GOOD_NODE)], [], [symptom(GOOD_SYMPTOM)])).toEqual(
      [],
    );
  });

  it('id/text/moves requirements and duplicates', () => {
    expect(rulesFor(NODES_AB, [], [symptom({ ...GOOD_SYMPTOM, id: undefined })])).toContain(
      'error:symptom/id',
    );
    expect(rulesFor(NODES_AB, [], [symptom({ ...GOOD_SYMPTOM, symptom: '' })])).toContain(
      'error:symptom/text',
    );
    expect(rulesFor(NODES_AB, [], [symptom({ ...GOOD_SYMPTOM, moves: [] })])).toContain(
      'error:symptom/moves',
    );
    expect(rulesFor(NODES_AB, [], [symptom(GOOD_SYMPTOM, 0), symptom(GOOD_SYMPTOM, 1)])).toContain(
      'error:symptom/duplicate-id',
    );
  });

  it('reference checks', () => {
    expect(rulesFor(NODES_AB, [], [symptom({ ...GOOD_SYMPTOM, moves: ['ghost'] })])).toContain(
      'error:symptom/unknown-move',
    );
    expect(
      rulesFor(NODES_AB, [], [symptom({ ...GOOD_SYMPTOM, mature_fields: ['astrology'] })]),
    ).toContain('error:content/unknown-field');
    expect(
      rulesFor(NODES_AB, [], [symptom({ ...GOOD_SYMPTOM, worked_example: 'ghost' })]),
    ).toContain('error:symptom/unknown-example');
  });

  it('symptom/stub-move warn', () => {
    const stub = concept('c', { ...GOOD_NODE, status: 'stub' });
    expect(
      rulesFor([...NODES_AB, stub], [], [symptom({ ...GOOD_SYMPTOM, moves: ['c'] })]),
    ).toContain('warn:symptom/stub-move');
  });
});

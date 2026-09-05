import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type {
  ConceptRecord,
  EdgeRecord,
  NonEdgeRecord,
  ReferenceRecord,
  SymptomRecord,
  WalkRecord,
} from '../src/model.js';
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

function reference(key: string, overrides: Partial<ReferenceRecord> = {}): ReferenceRecord {
  return {
    key,
    entryType: 'book',
    fields: { title: 'A Title', year: '1999' },
    file: 'graph/references.bib',
    line: 1,
    ...overrides,
  };
}

function rulesFor(
  concepts: ConceptRecord[],
  edges: EdgeRecord[] = [],
  symptoms: SymptomRecord[] = [],
  references: ReferenceRecord[] = [],
  walks: WalkRecord[] = [],
  nonEdges: NonEdgeRecord[] = [],
): string[] {
  return validateContent(schema, concepts, edges, symptoms, references, walks, nonEdges).map(
    (i) => `${i.severity}:${i.rule}`,
  );
}

function nonEdge(raw: Record<string, unknown>, index = 0): NonEdgeRecord {
  return { file: 'graph/non-edges.yaml', index, raw };
}

const GOOD_NON_EDGE = { between: ['a', 'b'], reason: 'checked — false friends' };

function walk(raw: Record<string, unknown>, id = 'tour'): WalkRecord {
  return { id, file: `paths/${id}.yaml`, raw };
}

/** Minimal valid walk over a↔b, which GOOD_EDGE connects. */
const GOOD_WALK = {
  title: 'A tour',
  summary: 'x',
  steps: [{ slug: 'a' }, { slug: 'b' }],
};

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
    expect(rulesFor(NODES_AB, [edge({ ...GOOD_EDGE, evidence: [7] })])).toContain(
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

describe('evidence and reference rules (ROADMAP M8)', () => {
  const cite = (keys: string[]): EdgeRecord => edge({ ...GOOD_EDGE, evidence: keys });

  it('accepts evidence that resolves, exactly once per key', () => {
    expect(rulesFor(NODES_AB, [cite(['doob-1953'])], [], [reference('doob-1953')])).toEqual([]);
  });

  it('edge/unknown-evidence: a key with no references.bib entry fails the build', () => {
    expect(rulesFor(NODES_AB, [cite(['ghost-2001'])])).toContain('error:edge/unknown-evidence');
    expect(rulesFor(NODES_AB, [cite(['ghost-2001'])], [], [reference('doob-1953')])).toContain(
      'error:edge/unknown-evidence',
    );
  });

  it('edge/duplicate-evidence: the same key cited twice on one edge', () => {
    expect(
      rulesFor(NODES_AB, [cite(['doob-1953', 'doob-1953'])], [], [reference('doob-1953')]),
    ).toContain('error:edge/duplicate-evidence');
  });

  it('reference/unused: an entry cited by no edge is an info-level curation hint', () => {
    expect(rulesFor(NODES_AB, [edge(GOOD_EDGE)], [], [reference('doob-1953')])).toEqual([
      'info:reference/unused',
    ]);
  });

  it('reference/key-format and reference/duplicate-key', () => {
    expect(rulesFor([], [], [], [reference('Doob1953')])).toContain('error:reference/key-format');
    expect(rulesFor([], [], [], [reference('doob-1953'), reference('doob-1953')])).toContain(
      'error:reference/duplicate-key',
    );
  });

  it('reference/unknown-type and reference/required-field (title, year)', () => {
    expect(rulesFor([], [], [], [reference('k', { entryType: 'website' })])).toContain(
      'error:reference/unknown-type',
    );
    expect(rulesFor([], [], [], [reference('k', { fields: { title: 'T' } })])).toContain(
      'error:reference/required-field',
    );
    expect(rulesFor([], [], [], [reference('k', { fields: { year: '1999' } })])).toContain(
      'error:reference/required-field',
    );
  });
});

describe('application rules (spec §8.8; ROADMAP M7)', () => {
  const app = (slug: string): ConceptRecord =>
    concept(slug, { ...GOOD_NODE, canonical_name: 'Tomography', node_type: 'application' });
  const applied = (from: string, to: string, index = 0): EdgeRecord =>
    edge({ from, to, type: 'APPLIED-IN', strength: 'theorem' }, index);
  const migrated = (from: string, to: string, index = 0): EdgeRecord =>
    edge({ from, to, type: 'MIGRATED-TO', strength: 'strong-analogy' }, index);

  it('application/underconnected warns below two distinct structure neighbors', () => {
    // No connecting edges at all.
    expect(rulesFor([app('tomography'), ...NODES_AB])).toContain('warn:application/underconnected');
    // One structure.
    expect(rulesFor([app('tomography'), ...NODES_AB], [applied('a', 'tomography')])).toContain(
      'warn:application/underconnected',
    );
    // Two edges from the SAME structure still count as one neighbor.
    expect(
      rulesFor(
        [app('tomography'), ...NODES_AB],
        [applied('a', 'tomography', 0), migrated('a', 'tomography', 1)],
      ),
    ).toContain('warn:application/underconnected');
  });

  it('two distinct structure neighbors clear the bar; MIGRATED-TO counts like APPLIED-IN', () => {
    expect(
      rulesFor(
        [app('tomography'), ...NODES_AB],
        [applied('a', 'tomography', 0), migrated('b', 'tomography', 1)],
      ),
    ).toEqual([]);
  });

  it('neither another application nor an unrelated edge type counts toward the bar', () => {
    const issues = rulesFor(
      [app('tomography'), app('other-app'), ...NODES_AB],
      [
        applied('other-app', 'tomography', 0),
        edge({ from: 'b', to: 'tomography', type: 'GOVERNS', strength: 'theorem' }, 1),
        applied('a', 'tomography', 2),
      ],
    );
    // 'tomography' has one structure neighbor (a) — the app-to-app edge and
    // the GOVERNS edge bought nothing; 'other-app' has none.
    expect(issues.filter((i) => i === 'warn:application/underconnected')).toHaveLength(2);
  });

  it('non-application nodes are never checked', () => {
    expect(rulesFor(NODES_AB, [edge(GOOD_EDGE)])).toEqual([]);
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

describe('walk rules (spec §8.3; ROADMAP M9)', () => {
  // Non-stub endpoints so the stub warn stays out of the baseline cases.
  const ESTABLISHED = {
    ...GOOD_NODE,
    status: 'established',
    fields: ['control'],
    canonical_examples: ['x'],
  };
  const WALK_NODES = [
    concept('a', ESTABLISHED),
    concept('b', ESTABLISHED),
    concept('c', ESTABLISHED),
  ];
  const rules = (w: WalkRecord, edges: EdgeRecord[] = [edge(GOOD_EDGE)]): string[] =>
    rulesFor(WALK_NODES, edges, [], [], [w]);

  it('accepts a well-formed walk whose hop rides a typed edge', () => {
    expect(rules(walk(GOOD_WALK))).toEqual([]);
  });

  it('walk/required-field: title and summary', () => {
    expect(rules(walk({ ...GOOD_WALK, title: ' ' }))).toContain('error:walk/required-field');
    expect(rules(walk({ ...GOOD_WALK, summary: undefined }))).toContain(
      'error:walk/required-field',
    );
  });

  it('walk/steps-shape: list of {slug, note?} mappings, notes non-empty', () => {
    expect(rules(walk({ ...GOOD_WALK, steps: 'a,b' }))).toContain('error:walk/steps-shape');
    expect(rules(walk({ ...GOOD_WALK, steps: ['a', 'b'] }))).toContain('error:walk/steps-shape');
    expect(rules(walk({ ...GOOD_WALK, steps: [{ note: 'no slug' }, { slug: 'b' }] }))).toContain(
      'error:walk/steps-shape',
    );
    expect(
      rules(walk({ ...GOOD_WALK, steps: [{ slug: 'a', note: '' }, { slug: 'b' }] })),
    ).toContain('error:walk/steps-shape');
  });

  it('walk/unknown-step: a step slug that is not a concept fails the build (the M9 exit criterion)', () => {
    expect(rules(walk({ ...GOOD_WALK, steps: [{ slug: 'a' }, { slug: 'ghost' }] }))).toContain(
      'error:walk/unknown-step',
    );
  });

  it('walk/too-short and walk/duplicate-step', () => {
    expect(rules(walk({ ...GOOD_WALK, steps: [{ slug: 'a' }] }))).toContain('error:walk/too-short');
    expect(
      rules(walk({ ...GOOD_WALK, steps: [{ slug: 'a' }, { slug: 'b' }, { slug: 'a' }] })),
    ).toContain('error:walk/duplicate-step');
  });

  it('walk/unbridged-jump: an unedged hop needs a bridging note; a note or an edge satisfies it', () => {
    // a–b is edged; b–c is not: the c step must say why the walk jumps.
    const jump = { ...GOOD_WALK, steps: [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }] };
    expect(rules(walk(jump))).toContain('error:walk/unbridged-jump');
    const bridged = {
      ...GOOD_WALK,
      steps: [{ slug: 'a' }, { slug: 'b' }, { slug: 'c', note: 'the walk jumps because…' }],
    };
    expect(rules(walk(bridged))).toEqual([]);
    // A reversed edge bridges too: any typed edge connects both directions.
    const reversed = edge({ from: 'c', to: 'b', type: 'IS-A', strength: 'theorem' }, 1);
    expect(rules(walk(jump), [edge(GOOD_EDGE), reversed])).toEqual([]);
  });

  it('walk/stub-step warn and unknown keys', () => {
    const withStub = [...WALK_NODES.slice(0, 2), concept('c', GOOD_NODE)];
    const stubWalk = walk({
      ...GOOD_WALK,
      steps: [{ slug: 'a' }, { slug: 'b' }, { slug: 'c', note: 'jump' }],
    });
    expect(rulesFor(withStub, [edge(GOOD_EDGE)], [], [], [stubWalk])).toContain(
      'warn:walk/stub-step',
    );
    expect(rules(walk({ ...GOOD_WALK, spine: 'x' }))).toContain('warn:content/unknown-key');
    expect(
      rules(walk({ ...GOOD_WALK, steps: [{ slug: 'a', why: 'x' }, { slug: 'b' }] })),
    ).toContain('warn:content/unknown-key');
  });
});

describe('non-edge rules (M11): the reject ledger', () => {
  const rules = (...nonEdges: NonEdgeRecord[]): string[] =>
    rulesFor(NODES_AB, [], [], [], [], nonEdges);

  it('accepts a well-formed entry, with a slug or URL pointer', () => {
    expect(rules(nonEdge(GOOD_NON_EDGE))).toEqual([]);
    expect(rules(nonEdge({ ...GOOD_NON_EDGE, see: 'b' }))).toEqual([]);
    expect(rules(nonEdge({ ...GOOD_NON_EDGE, see: 'https://github.com/x/y/issues/14' }))).toEqual(
      [],
    );
  });

  it('non-edge/between-shape: exactly two slugs', () => {
    expect(rules(nonEdge({ reason: 'x' }))).toContain('error:non-edge/between-shape');
    expect(rules(nonEdge({ between: ['a'], reason: 'x' }))).toContain(
      'error:non-edge/between-shape',
    );
    expect(rules(nonEdge({ between: ['a', 'b', 'a'], reason: 'x' }))).toContain(
      'error:non-edge/between-shape',
    );
  });

  it('non-edge/unknown-endpoint and non-edge/self-pair', () => {
    expect(rules(nonEdge({ between: ['a', 'ghost'], reason: 'x' }))).toContain(
      'error:non-edge/unknown-endpoint',
    );
    expect(rules(nonEdge({ between: ['a', 'a'], reason: 'x' }))).toContain(
      'error:non-edge/self-pair',
    );
  });

  it('non-edge/reason: a reviewed decision needs its reason', () => {
    expect(rules(nonEdge({ between: ['a', 'b'] }))).toContain('error:non-edge/reason');
    expect(rules(nonEdge({ between: ['a', 'b'], reason: '  ' }))).toContain(
      'error:non-edge/reason',
    );
  });

  it('non-edge/see: pointer must be a concept slug or an http(s) URL', () => {
    expect(rules(nonEdge({ ...GOOD_NON_EDGE, see: 'nowhere-slug' }))).toContain(
      'error:non-edge/see',
    );
    expect(rules(nonEdge({ ...GOOD_NON_EDGE, see: 'ftp://x' }))).toContain('error:non-edge/see');
  });

  it('non-edge/duplicate: the pair is unordered', () => {
    expect(
      rules(nonEdge(GOOD_NON_EDGE), nonEdge({ between: ['b', 'a'], reason: 'y' }, 1)),
    ).toContain('error:non-edge/duplicate');
  });

  it('non-edge/contradiction: any typed edge between the pair, either direction', () => {
    const contradicted = rulesFor(
      NODES_AB,
      [edge(GOOD_EDGE)],
      [],
      [],
      [],
      [nonEdge({ between: ['b', 'a'], reason: 'x' })],
    );
    expect(contradicted).toContain('error:non-edge/contradiction');
  });

  it('unknown keys warn', () => {
    expect(rules(nonEdge({ ...GOOD_NON_EDGE, because: 'x' }))).toContain(
      'warn:content/unknown-key',
    );
  });
});

/**
 * data/ accessors and the artifact version gate (ARCHITECTURE.md §8),
 * against an in-memory fixture — no fetch, no real dataset.
 */
import MiniSearch from 'minisearch';
import { describe, expect, it } from 'vitest';
import { assembleAtlas, majorOf } from '../src/data/atlas';
import type { GraphJson, GraphNode, PublicSchema, SearchArtifact } from '../src/data/types';

const schema: PublicSchema = {
  node_types: [
    { id: 'operation', label: 'Operation', color_token: 'nt-operation', description: 'ops' },
    { id: 'model', label: 'Canonical model', color_token: 'nt-model', description: 'models' },
  ],
  edge_types: [
    {
      id: 'GOVERNS',
      label: 'Governs',
      group: 'governance',
      directionality: 'directed',
      forward: 'governs',
      reverse: 'is governed by',
      description: 'controls a rate or threshold',
    },
  ],
  strengths: [{ id: 'theorem', rank: 1, line: 'solid', emphasis: 'strong', description: 'proved' }],
  fields: [
    { id: 'control', label: 'Control theory' },
    { id: 'statistics', label: 'Statistics' },
  ],
  node_statuses: [{ id: 'established', description: 'settled' }],
  gap_statuses: [{ id: 'open-candidate', description: 'unchecked' }],
  analysis: { trusted_min_strength: 'theorem' },
};

function makeNode(slug: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    slug,
    canonical_name: slug,
    node_type: 'model',
    status: 'established',
    summary: 'a summary',
    fields: [],
    aliases: [],
    assumptions: [],
    canonical_examples: [],
    sections: [],
    html: '',
    backlinks: [],
    connections: [],
    ...overrides,
  };
}

const eigen = makeNode('eigenvalues', {
  canonical_name: 'Eigenvalues and spectral decomposition',
  node_type: 'operation',
  aliases: [
    { name: 'poles / modes / damping', field: 'control' },
    { name: 'principal components', field: 'statistics' },
  ],
});

function makeGraph(version = '1.0.0'): GraphJson {
  return {
    schema_version: version,
    generated_from: 'a'.repeat(40),
    schema,
    nodes: [eigen, makeNode('markov-chains', { canonical_name: 'Markov chains' })],
    edges: [
      {
        from: 'eigenvalues',
        to: 'markov-chains',
        type: 'GOVERNS',
        strength: 'theorem',
        symmetric: false,
        evidence: [],
      },
    ],
    symptoms: [
      {
        id: 'too-many-parameters',
        symptom: 'Too many dimensional parameters',
        moves: ['eigenvalues'],
        mature_fields: ['control'],
      },
    ],
    metrics: {
      trusted: { min_strength: 'theorem', edge_count: 1, excluded_edge_count: 0, node_count: 2 },
      community_count: 1,
      nodes: {
        eigenvalues: {
          degree: 1,
          betweenness: 0,
          community: 0,
          span_entropy: 1,
          field_count: 2,
          dialect_count: 2,
        },
        'markov-chains': {
          degree: 1,
          betweenness: 0,
          community: 0,
          span_entropy: 0,
          field_count: 0,
          dialect_count: 0,
        },
      },
      gaps: [],
      candidate_edges: [{ a: 'eigenvalues', b: 'markov-chains' }],
    },
  };
}

/** Build a real MiniSearch payload the way build/src/emit.ts does. */
function makeSearchArtifact(version = '1.0.0'): SearchArtifact {
  const options = {
    idField: 'id',
    fields: ['name', 'aliases', 'summary'],
    storeFields: ['name', 'kind'],
  };
  const mini = new MiniSearch(options);
  mini.addAll([
    {
      id: 'eigenvalues',
      kind: 'concept',
      name: 'Eigenvalues and spectral decomposition',
      aliases: 'poles / modes / damping ; principal components',
      summary: 'which directions are preserved',
    },
    { id: 'markov-chains', kind: 'concept', name: 'Markov chains', aliases: '', summary: '' },
    {
      id: 'symptom:too-many-parameters',
      kind: 'symptom',
      name: 'Too many dimensional parameters',
      aliases: '',
      summary: '',
    },
  ]);
  return {
    schema_version: version,
    options: { ...options, boost: { aliases: 3, name: 2, summary: 1 } },
    index: mini.toJSON(),
  };
}

function assembled() {
  const result = assembleAtlas(makeGraph(), makeSearchArtifact());
  if (!result.ok) throw new Error(`fixture failed to assemble: ${JSON.stringify(result.error)}`);
  return result.atlas;
}

describe('majorOf', () => {
  it('reads the semver major', () => {
    expect(majorOf('1.0.0')).toBe(1);
    expect(majorOf('12.3.4')).toBe(12);
  });
  it('rejects malformed versions', () => {
    expect(majorOf('nope')).toBeNaN();
    expect(majorOf('1.0')).toBeNaN();
    expect(majorOf(undefined)).toBeNaN();
  });
});

describe('assembleAtlas version gate', () => {
  it('accepts the supported major, any minor/patch', () => {
    expect(assembleAtlas(makeGraph('1.0.0'), makeSearchArtifact('1.0.0')).ok).toBe(true);
    expect(assembleAtlas(makeGraph('1.7.2'), makeSearchArtifact('1.0.1')).ok).toBe(true);
  });
  it('refuses a data major it does not understand', () => {
    const result = assembleAtlas(makeGraph('2.0.0'), makeSearchArtifact('2.0.0'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('version');
      if (result.error.kind === 'version') expect(result.error.found).toBe('2.0.0');
    }
  });
  it('refuses either artifact being too new — they deploy together', () => {
    const result = assembleAtlas(makeGraph('1.0.0'), makeSearchArtifact('2.0.0'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('version');
  });
  it('reports corrupt artifacts instead of throwing', () => {
    expect(assembleAtlas(null, makeSearchArtifact())).toMatchObject({
      ok: false,
      error: { kind: 'corrupt' },
    });
    expect(assembleAtlas({ schema_version: 'x' }, makeSearchArtifact())).toMatchObject({
      ok: false,
      error: { kind: 'corrupt' },
    });
    const noNodes = { ...makeGraph(), nodes: 'not-a-list' };
    expect(assembleAtlas(noNodes, makeSearchArtifact())).toMatchObject({
      ok: false,
      error: { kind: 'corrupt' },
    });
  });
  it('refuses pre-metrics data rather than rendering broken researcher views', () => {
    const noMetrics = { ...makeGraph() } as Record<string, unknown>;
    delete noMetrics['metrics'];
    expect(assembleAtlas(noMetrics, makeSearchArtifact())).toMatchObject({
      ok: false,
      error: { kind: 'corrupt' },
    });
  });
});

describe('Atlas accessors', () => {
  const atlas = assembled();

  it('resolves nodes by slug', () => {
    expect(atlas.node('eigenvalues')?.canonical_name).toMatch(/^Eigenvalues/);
    expect(atlas.node('nope')).toBeUndefined();
    expect(atlas.isSlug('eigenvalues')).toBe(true);
    expect(atlas.isSlug('linearity')).toBe(false);
  });

  it('resolves vocabulary entries and falls back to raw ids', () => {
    expect(atlas.nodeType('operation')?.color_token).toBe('nt-operation');
    expect(atlas.strength('theorem')?.line).toBe('solid');
    expect(atlas.fieldLabel('control')).toBe('Control theory');
    expect(atlas.fieldLabel('unlisted-field')).toBe('unlisted-field');
  });

  it('filters nodes by type and symptoms by move', () => {
    expect(atlas.nodesOfType('operation').map((n) => n.slug)).toEqual(['eigenvalues']);
    expect(atlas.symptomsUsing('eigenvalues').map((s) => s.id)).toEqual(['too-many-parameters']);
    expect(atlas.symptomsUsing('markov-chains')).toEqual([]);
  });
});

describe('Atlas search', () => {
  const atlas = assembled();

  it('returns nothing for a blank query', () => {
    expect(atlas.search('   ')).toEqual([]);
  });

  it('finds concepts by name', () => {
    const hits = atlas.search('markov');
    expect(hits[0]).toMatchObject({ id: 'markov-chains', kind: 'concept' });
  });

  it('frames alias hits as reverse-dialect lookups', () => {
    const hits = atlas.search('poles');
    expect(hits[0]).toMatchObject({ id: 'eigenvalues', kind: 'concept' });
    expect(hits[0]?.aliasMatch).toMatchObject({ field: 'Control theory' });
    expect(hits[0]?.aliasMatch?.name).toContain('poles');
  });

  it('surfaces symptoms', () => {
    const hits = atlas.search('dimensional parameters');
    expect(hits.some((hit) => hit.kind === 'symptom')).toBe(true);
  });
});

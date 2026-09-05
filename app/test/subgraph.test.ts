/**
 * Client-side graph computations (ego / lens / paths) and the dialect
 * lookup, on a hand-checkable fixture: a path a–b–c–d with a parallel edge,
 * a speculative shortcut a–e–d, and a star for the ego node cap.
 */
import MiniSearch from 'minisearch';
import { describe, expect, it } from 'vitest';
import { assembleAtlas, type Atlas } from '../src/data/atlas';
import {
  EGO_NODE_CAP,
  egoNetwork,
  hasLensFilter,
  lensSubgraph,
  matrixSelection,
  pathsBetween,
} from '../src/data/subgraph';
import type {
  GraphEdge,
  GraphJson,
  GraphNode,
  PublicSchema,
  SearchArtifact,
} from '../src/data/types';

const schema: PublicSchema = {
  node_types: [
    { id: 'operation', label: 'Operation', color_token: 'nt-operation', description: 'ops' },
    { id: 'model', label: 'Canonical model', color_token: 'nt-model', description: 'models' },
    { id: 'move', label: 'Reusable move', color_token: 'nt-move', description: 'moves' },
    { id: 'principle', label: 'Principle', color_token: 'nt-principle', description: 'principles' },
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
    {
      id: 'ANALOGOUS-TO',
      label: 'Analogy',
      group: 'equivalence',
      directionality: 'symmetric',
      phrase: 'is analogous to',
      description: 'parallel structure',
    },
    {
      id: 'POSSIBLE-MISSING-MIGRATION',
      label: 'Possible missing migration',
      group: 'migration',
      directionality: 'directed',
      forward: 'might transfer, unverified, to',
      reverse: 'might benefit, unverified, from',
      description: 'gap hypothesis',
    },
  ],
  strengths: [
    { id: 'identity', rank: 1, line: 'solid', emphasis: 'strong', description: 'same' },
    { id: 'theorem', rank: 2, line: 'solid', emphasis: 'strong', description: 'proved' },
    { id: 'special-case', rank: 3, line: 'solid', emphasis: 'medium', description: 'contained' },
    { id: 'strong-analogy', rank: 4, line: 'dashed', emphasis: 'medium', description: 'scoped' },
    { id: 'heuristic-analogy', rank: 5, line: 'dashed', emphasis: 'light', description: 'loose' },
    { id: 'speculative', rank: 6, line: 'dotted', emphasis: 'light', description: 'hypothesis' },
  ],
  fields: [
    { id: 'control', label: 'Control theory' },
    { id: 'biology', label: 'Systems & mathematical biology' },
    { id: 'statistics', label: 'Statistics' },
  ],
  node_statuses: [{ id: 'established', description: 'settled' }],
  gap_statuses: [{ id: 'open-candidate', description: 'unchecked' }],
  analysis: { trusted_min_strength: 'special-case' },
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

function edge(from: string, to: string, type: string, strength: string): GraphEdge {
  return { from, to, type, strength, symmetric: type === 'ANALOGOUS-TO', evidence: [] };
}

function makeAtlas(nodes: GraphNode[], edges: GraphEdge[]): Atlas {
  const graph: GraphJson = {
    schema_version: '1.0.0',
    generated_from: 'a'.repeat(40),
    schema,
    nodes,
    edges,
    symptoms: [],
    non_edges: [],
    references: [],
    walks: [],
    // Subgraph computations never read metrics; an empty block satisfies the contract.
    metrics: {
      trusted: {
        min_strength: 'special-case',
        edge_count: 0,
        excluded_edge_count: 0,
        node_count: 0,
      },
      community_count: 0,
      nodes: {},
      gaps: [],
      candidate_edges: [],
      queue: {
        link_suggestions: [],
        bridge_deficits: [],
        recurring_assumptions: [],
        dialect_gaps: [],
        thin_symptoms: [],
      },
    },
  };
  const options = {
    idField: 'id',
    fields: ['name', 'aliases', 'summary'],
    storeFields: ['name', 'kind'],
  };
  const mini = new MiniSearch(options);
  mini.addAll(nodes.map((n) => ({ id: n.slug, kind: 'concept', name: n.canonical_name })));
  const search: SearchArtifact = {
    schema_version: '1.0.0',
    options: { ...options, boost: { aliases: 3, name: 2, summary: 1 } },
    index: mini.toJSON(),
  };
  const result = assembleAtlas(graph, search);
  if (!result.ok) throw new Error(`fixture failed to assemble: ${JSON.stringify(result.error)}`);
  return result.atlas;
}

/**
 *   a ══ b — c — d        a–b: GOVERNS theorem + ANALOGOUS-TO strong-analogy
 *    \        /           b–c: ANALOGOUS-TO strong-analogy (symmetric)
 *     e ·····             c–d: GOVERNS heuristic-analogy
 *                         a–e: GOVERNS theorem; e–d: gap edge, speculative
 */
const pathAtlas = makeAtlas(
  [
    makeNode('a', { node_type: 'operation', fields: ['control'] }),
    makeNode('b', {
      fields: ['control', 'biology'],
      aliases: [{ name: 'perfect adaptation', field: 'biology' }],
    }),
    makeNode('c', { node_type: 'move', fields: ['biology'] }),
    makeNode('d', { canonical_name: 'D node', fields: ['statistics'] }),
    makeNode('e', { node_type: 'principle' }),
  ],
  [
    edge('a', 'b', 'GOVERNS', 'theorem'),
    edge('a', 'b', 'ANALOGOUS-TO', 'strong-analogy'),
    edge('b', 'c', 'ANALOGOUS-TO', 'strong-analogy'),
    edge('c', 'd', 'GOVERNS', 'heuristic-analogy'),
    edge('a', 'e', 'GOVERNS', 'theorem'),
    { ...edge('e', 'd', 'POSSIBLE-MISSING-MIGRATION', 'speculative'), status: 'open-candidate' },
  ],
);

describe('egoNetwork', () => {
  it('collects the 1-hop induced neighborhood and flags expandability', () => {
    const ego = egoNetwork(pathAtlas, 'a', 1);
    expect(ego).not.toBeNull();
    expect(ego!.nodes.map((n) => n.slug)).toEqual(['a', 'b', 'e']);
    // Induced edges only: both parallel a–b edges and a–e; nothing to c/d.
    expect(ego!.edges).toHaveLength(3);
    expect(ego!.overflow).toEqual([]);
    expect(ego!.expandable).toBe(true); // b reaches c, e reaches d
  });

  it('reaches the second ring only through kept first-ring nodes', () => {
    const ego = egoNetwork(pathAtlas, 'a', 2);
    expect(ego!.nodes.map((n) => n.slug)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(ego!.edges).toHaveLength(6);
    const closed = egoNetwork(pathAtlas, 'a', 2, 3); // cap out the second ring
    expect(closed!.nodes.map((n) => n.slug)).toEqual(['a', 'b', 'e']);
    expect(closed!.overflow.map((n) => n.slug)).toEqual(['c', 'd']);
  });

  it('caps rendered nodes, keeping the strongest-attached, and lists the rest', () => {
    const spokes = Array.from({ length: 30 }, (_, i) => {
      const n = String(i + 1).padStart(2, '0');
      return makeNode(`s${n}`);
    });
    const star = makeAtlas(
      [makeNode('hub'), ...spokes],
      spokes.map((s, i) =>
        edge('hub', s.slug, 'GOVERNS', i < 15 ? 'theorem' : 'heuristic-analogy'),
      ),
    );
    const ego = egoNetwork(star, 'hub', 1);
    expect(ego!.nodes).toHaveLength(EGO_NODE_CAP);
    // All 15 theorem-strength spokes kept; the weakest-attached spill over.
    expect(ego!.nodes.filter((n) => n.slug <= 's15')).toHaveLength(16); // hub sorts as 'hub'
    expect(ego!.overflow.map((n) => n.slug)).toEqual(['s25', 's26', 's27', 's28', 's29', 's30']);
    expect(ego!.edges).toHaveLength(24);
    expect(ego!.expandable).toBe(false);
  });

  it('returns null for an unknown center', () => {
    expect(egoNetwork(pathAtlas, 'nope', 1)).toBeNull();
  });
});

describe('lensSubgraph', () => {
  it('filters by edge type', () => {
    const lens = lensSubgraph(pathAtlas, { edge: 'ANALOGOUS-TO' });
    expect(lens.edges).toHaveLength(2);
    expect(lens.nodes.map((n) => n.slug)).toEqual(['a', 'b', 'c']);
  });

  it('applies the minimum-strength floor', () => {
    const lens = lensSubgraph(pathAtlas, { strength: 'theorem' });
    expect(lens.edges.map((e) => `${e.from}-${e.to}`)).toEqual(['a-b', 'a-e']);
  });

  it('keeps edges touching at least one node matching type/field filters', () => {
    const moves = lensSubgraph(pathAtlas, { type: 'move' });
    expect(moves.edges.map((e) => `${e.from}-${e.to}`)).toEqual(['b-c', 'c-d']);
    const biology = lensSubgraph(pathAtlas, { field: 'biology' });
    // b and c carry the biology field: both a–b parallels, b–c, and c–d.
    expect(biology.edges).toHaveLength(4);
    expect(biology.edges.map((e) => `${e.from}-${e.to}`)).toContain('c-d');
  });

  it('combines filters and reports emptiness honestly', () => {
    const lens = lensSubgraph(pathAtlas, { edge: 'GOVERNS', type: 'move', strength: 'theorem' });
    expect(lens.edges).toEqual([]);
    expect(lens.nodes).toEqual([]);
    expect(hasLensFilter({})).toBe(false);
    expect(hasLensFilter({ field: 'biology' })).toBe(true);
  });
});

describe('matrixSelection', () => {
  it('keeps every node — an empty row is the information (UI_REDESIGN §4.3)', () => {
    const sel = matrixSelection(pathAtlas, {});
    expect(sel.nodes.map((n) => n.slug)).toEqual(['a', 'b', 'c', 'd', 'e']);
    // Default floor matches path finding: the speculative e–d gap edge is out.
    expect(sel.edges).toHaveLength(5);
    expect(sel.edges.some((e) => e.strength === 'speculative')).toBe(false);
  });

  it('includes speculative edges only on explicit opt-in, like lens/path', () => {
    const sel = matrixSelection(pathAtlas, { strength: 'speculative' });
    expect(sel.edges).toHaveLength(6);
    const tight = matrixSelection(pathAtlas, { strength: 'theorem' });
    expect(tight.edges.map((e) => `${e.from}-${e.to}`)).toEqual(['a-b', 'a-e']);
    // Tightening the floor never drops a row — absence stays visible.
    expect(tight.nodes).toHaveLength(5);
  });

  it('node filters narrow rows, and edges to outside nodes drop with them', () => {
    const sel = matrixSelection(pathAtlas, { field: 'biology' });
    expect(sel.nodes.map((n) => n.slug)).toEqual(['b', 'c']);
    // Unlike the lens (edges touching ≥ 1 match), the matrix draws only
    // pairs it has rows for: c–d has no d row to land on.
    expect(sel.edges.map((e) => `${e.from}-${e.to}`)).toEqual(['b-c']);
  });

  it('filters by edge type over the full node set', () => {
    const sel = matrixSelection(pathAtlas, { edge: 'ANALOGOUS-TO' });
    expect(sel.nodes).toHaveLength(5);
    expect(sel.edges).toHaveLength(2);
    expect(sel.edges.every((e) => e.symmetric)).toBe(true);
  });
});

describe('pathsBetween', () => {
  it('finds chains with steps oriented along the walk', () => {
    const result = pathsBetween(pathAtlas, 'a', 'd');
    // Speculative shortcut excluded by default: both a–b variants × b–c–d.
    expect(result.total).toBe(2);
    const first = result.chains[0]!;
    expect(first.steps.map((s) => s.to)).toEqual(['b', 'c', 'd']);
    expect(first.steps[0]).toMatchObject({ from: 'a', to: 'b' });
    // Stronger chain first: the theorem-grade a–b edge beats the analogy.
    expect(first.steps[0]!.edge.type).toBe('GOVERNS');
    expect(result.chains[1]!.steps[0]!.edge.type).toBe('ANALOGOUS-TO');
  });

  it('includes speculative edges only when the floor is loosened', () => {
    const loose = pathsBetween(pathAtlas, 'a', 'd', { strength: 'speculative' });
    // Shortest is now a–e–d (2 steps); the 3-step chains still fit maxLen.
    expect(loose.total).toBe(3);
    expect(loose.chains[0]!.steps.map((s) => s.to)).toEqual(['e', 'd']);
    expect(loose.chains[0]!.steps[1]!.edge.type).toBe('POSSIBLE-MISSING-MIGRATION');
  });

  it('tightening the floor can disconnect the pair', () => {
    expect(pathsBetween(pathAtlas, 'a', 'd', { strength: 'theorem' }).total).toBe(0);
  });

  it('handles identical endpoints, unknown slugs, and the chain cap', () => {
    expect(pathsBetween(pathAtlas, 'a', 'a').total).toBe(0);
    expect(pathsBetween(pathAtlas, 'a', 'nope').total).toBe(0);
    const capped = pathsBetween(pathAtlas, 'a', 'd', { maxChains: 1 });
    expect(capped.chains).toHaveLength(1);
    expect(capped.total).toBe(2);
  });
});

describe('aliasLookup', () => {
  it('matches aliases first, then canonical names, without fuzz', () => {
    const hits = pathAtlas.aliasLookup('perfect adaptation');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ node: { slug: 'b' }, alias: { field: 'biology' } });
    const byName = pathAtlas.aliasLookup('D node');
    expect(byName[0]!.node.slug).toBe('d');
    expect(byName[0]!.alias).toBeUndefined();
    expect(pathAtlas.aliasLookup('perfekt adaptation')).toEqual([]);
    expect(pathAtlas.aliasLookup('   ')).toEqual([]);
  });
});

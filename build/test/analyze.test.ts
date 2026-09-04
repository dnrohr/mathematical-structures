/**
 * Stage-4 metric correctness on small hand-checkable graphs (ARCHITECTURE.md
 * §8): a path, a star, and two cliques joined by a bridge — plus the
 * epistemic rule that unde-trusted edges (analogies, hypotheses) cannot
 * manufacture degree, centrality, or communities.
 */
import { describe, expect, it } from 'vitest';
import { analyzeGraph, spanEntropy } from '../src/analyze.js';
import type { GraphEdge, GraphNode } from '../src/model.js';
import type { AtlasSchema } from '../src/schema.js';

const schema: AtlasSchema = {
  schema_version: '1.0.0',
  node_types: [{ id: 'object', label: 'Object', color_token: 'nt-object', description: 'x' }],
  edge_types: [
    {
      id: 'IS-A',
      label: 'Special case',
      group: 'hierarchy',
      directionality: 'directed',
      forward: 'is a special case of',
      reverse: 'generalizes',
      description: 'x',
    },
    {
      id: 'POSSIBLE-MISSING-MIGRATION',
      label: 'Possible missing migration',
      group: 'migration',
      directionality: 'directed',
      forward: 'might transfer to',
      reverse: 'might benefit from',
      description: 'x',
    },
  ],
  strengths: [
    { id: 'theorem', rank: 1, line: 'solid', emphasis: 'strong', description: 'x' },
    { id: 'heuristic-analogy', rank: 2, line: 'dashed', emphasis: 'light', description: 'x' },
    { id: 'speculative', rank: 3, line: 'dotted', emphasis: 'light', description: 'x' },
  ],
  fields: [{ id: 'control', label: 'Control theory' }],
  node_statuses: [{ id: 'established', description: 'x' }],
  gap_statuses: [{ id: 'open-candidate', description: 'x' }],
  node_requirements: { all: [] },
  analysis: { trusted_min_strength: 'theorem' },
};

function node(slug: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    slug,
    canonical_name: slug,
    node_type: 'object',
    status: 'established',
    summary: 'x',
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

function edge(from: string, to: string, overrides: Partial<GraphEdge> = {}): GraphEdge {
  return {
    from,
    to,
    type: 'IS-A',
    strength: 'theorem',
    symmetric: false,
    evidence: [],
    ...overrides,
  };
}

/** Nodes sorted by slug, as the link stage guarantees. */
function nodes(...slugs: string[]): GraphNode[] {
  return [...slugs].sort().map((s) => node(s));
}

describe('betweenness (Brandes, normalized) on hand-checkable graphs', () => {
  it('path a-b-c-d-e: the middle carries 4 of 6 pairs, its neighbors 3', () => {
    const m = analyzeGraph(
      schema,
      nodes('a', 'b', 'c', 'd', 'e'),
      [edge('a', 'b'), edge('b', 'c'), edge('c', 'd'), edge('d', 'e')],
      [],
    );
    expect(m.nodes['a']!.betweenness).toBe(0);
    expect(m.nodes['b']!.betweenness).toBe(0.5); // (a,c),(a,d),(a,e) of 6 pairs
    expect(m.nodes['c']!.betweenness).toBe(0.6667); // (a,d),(a,e),(b,d),(b,e)
    expect(m.nodes['b']!.degree).toBe(2);
    expect(m.nodes['a']!.degree).toBe(1);
  });

  it('star: the hub scores exactly 1, leaves 0, and one community forms', () => {
    const m = analyzeGraph(
      schema,
      nodes('hub', 'l1', 'l2', 'l3', 'l4', 'l5'),
      ['l1', 'l2', 'l3', 'l4', 'l5'].map((l) => edge('hub', l)),
      [],
    );
    expect(m.nodes['hub']!.betweenness).toBe(1);
    expect(m.nodes['hub']!.degree).toBe(5);
    expect(m.nodes['l1']!.betweenness).toBe(0);
    expect(m.community_count).toBe(1);
  });
});

describe('communities (Louvain) on two 4-cliques joined by a bridge', () => {
  const clique = (members: string[]): GraphEdge[] => {
    const out: GraphEdge[] = [];
    for (let i = 0; i < members.length; i++)
      for (let j = i + 1; j < members.length; j++) out.push(edge(members[i]!, members[j]!));
    return out;
  };
  const edges = [
    ...clique(['a1', 'a2', 'a3', 'a4']),
    ...clique(['b1', 'b2', 'b3', 'b4']),
    edge('a1', 'b1'),
  ];
  const m = analyzeGraph(schema, nodes('a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3', 'b4'), edges, []);

  it('rediscovers the two cliques', () => {
    expect(m.community_count).toBe(2);
    const c = (s: string): number | null => m.nodes[s]!.community;
    expect(c('a1')).toBe(c('a2'));
    expect(c('a2')).toBe(c('a3'));
    expect(c('b1')).toBe(c('b2'));
    expect(c('a1')).not.toBe(c('b1'));
    // Canonical labeling: the community containing the alphabetically first node is 0.
    expect(c('a1')).toBe(0);
  });

  it('the bridge endpoints are the bridges: 12 of 21 pairs cross each', () => {
    expect(m.nodes['a1']!.betweenness).toBe(0.5714);
    expect(m.nodes['b1']!.betweenness).toBe(0.5714);
    expect(m.nodes['a2']!.betweenness).toBe(0);
    expect(m.nodes['a1']!.degree).toBe(4);
  });
});

describe('the epistemic rule: metrics run on the trusted subgraph only', () => {
  const graph = nodes('a', 'b', 'c', 'd', 'e', 'lone');
  const trusted = [edge('a', 'b'), edge('b', 'c'), edge('c', 'd'), edge('d', 'e')];
  const gap = edge('a', 'e', {
    type: 'POSSIBLE-MISSING-MIGRATION',
    strength: 'speculative',
    status: 'open-candidate',
  });
  const analogy = edge('lone', 'c', { strength: 'heuristic-analogy' });
  const m = analyzeGraph(schema, graph, [...trusted, gap, analogy], []);

  it('speculative and analogy edges add no degree and no centrality shortcut', () => {
    // Identical to the plain path: the a-e hypothesis does not close the loop.
    expect(m.nodes['a']!.degree).toBe(1);
    expect(m.nodes['c']!.betweenness).toBe(0.6667);
    expect(m.trusted).toEqual({
      min_strength: 'theorem',
      edge_count: 4,
      excluded_edge_count: 2,
      node_count: 5,
    });
  });

  it('a node with no trusted edges has zero metrics and no community', () => {
    expect(m.nodes['lone']).toMatchObject({ degree: 0, betweenness: 0, community: null });
  });

  it('gap and speculative edges are summarized with their workflow status', () => {
    expect(m.gaps).toEqual([
      {
        from: 'a',
        to: 'e',
        type: 'POSSIBLE-MISSING-MIGRATION',
        strength: 'speculative',
        status: 'open-candidate',
      },
    ]);
  });
});

describe('span entropy and dialect count', () => {
  it('span entropy is log2 of the field count until usage is weighted', () => {
    expect(spanEntropy(0)).toBe(0);
    expect(spanEntropy(1)).toBe(0);
    expect(spanEntropy(2)).toBe(1);
    expect(spanEntropy(3)).toBe(1.585);
    expect(spanEntropy(6)).toBe(2.585);
  });

  it('dialect count is distinct alias fields; candidates pass through', () => {
    const rich = node('rich', {
      fields: ['control', 'statistics', 'probability'],
      aliases: [
        { name: 'x', field: 'control' },
        { name: 'y', field: 'control' },
        { name: 'z', field: 'statistics' },
      ],
    });
    const m = analyzeGraph(schema, [rich], [], [{ a: 'other', b: 'rich' }]);
    expect(m.nodes['rich']).toMatchObject({
      span_entropy: 1.585,
      field_count: 3,
      dialect_count: 2,
    });
    expect(m.candidate_edges).toEqual([{ a: 'other', b: 'rich' }]);
  });
});

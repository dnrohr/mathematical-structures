import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { analyzeGraph } from '../src/analyze.js';
import { buildBridgeAtlas } from '../src/bridge-atlas.js';
import type { GraphEdge, NodeMetrics } from '../src/model.js';
import { runPipeline } from '../src/pipeline.js';

const metrics: Record<string, NodeMetrics> = {
  a: {
    degree: 3,
    betweenness: 0.4,
    community: 0,
    span_entropy: 0,
    field_count: 1,
    dialect_count: 0,
  },
  b: { degree: 1, betweenness: 0, community: 0, span_entropy: 0, field_count: 1, dialect_count: 0 },
  c: {
    degree: 2,
    betweenness: 0.2,
    community: 1,
    span_entropy: 0,
    field_count: 1,
    dialect_count: 0,
  },
  d: { degree: 1, betweenness: 0, community: 2, span_entropy: 0, field_count: 1, dialect_count: 0 },
};

const layout: Record<string, [number, number]> = {
  a: [100, 100],
  b: [140, 100],
  c: [360, 220],
  d: [620, 430],
};

const edges: GraphEdge[] = [
  { from: 'a', to: 'b', type: 'IS-A', strength: 'theorem', symmetric: false, evidence: [] },
  { from: 'c', to: 'a', type: 'GOVERNS', strength: 'theorem', symmetric: false, evidence: [] },
  {
    from: 'b',
    to: 'c',
    type: 'ANALOGOUS-TO',
    strength: 'special-case',
    symmetric: true,
    evidence: [],
  },
  {
    from: 'a',
    to: 'd',
    type: 'POSSIBLE-MISSING-MIGRATION',
    strength: 'speculative',
    symmetric: false,
    evidence: [],
  },
];

describe('Bridge Atlas build contract', () => {
  it('preserves membership, deterministic landmarks, exact trusted indexes, and zero pairs', () => {
    const atlas = buildBridgeAtlas(metrics, layout, edges, [0, 1, 2]);
    expect(atlas.communities.map((community) => community.member_slugs)).toEqual([
      ['a', 'b'],
      ['c'],
      ['d'],
    ]);
    expect(atlas.communities[0]).toMatchObject({
      landmark_slugs: ['a', 'b'],
      member_count: 2,
      internal_trusted_edge_count: 1,
      center: [120, 100],
    });
    expect(atlas.communities[0]!.territory_path).toBe(
      'M 94.5 100 A 25.5 25.5 0 1 0 145.5 100 A 25.5 25.5 0 1 0 94.5 100 Z',
    );
    expect(atlas.bridges).toEqual([
      {
        source_community: 0,
        target_community: 1,
        trusted_edge_count: 2,
        edge_indexes: [2, 1],
        strength_counts: { theorem: 1, 'special-case': 1 },
        type_counts: { GOVERNS: 1, 'ANALOGOUS-TO': 1 },
      },
    ]);
    expect(atlas.frontiers).toEqual([
      { source_community: 0, target_community: 2, trusted_edge_count: 0 },
      { source_community: 1, target_community: 2, trusted_edge_count: 0 },
    ]);
  });

  it('is byte-identical across repeated derivations and never promotes an untrusted edge', () => {
    const first = buildBridgeAtlas(metrics, layout, edges, [0, 1, 2]);
    const second = buildBridgeAtlas(metrics, layout, edges, [0, 1, 2]);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    expect(first.bridges.flatMap((bridge) => bridge.edge_indexes)).not.toContain(3);
  });

  it('keeps existing geography stable when a nearby member joins without causing overlap', () => {
    const before = buildBridgeAtlas(metrics, layout, edges, [0, 1, 2]);
    const expandedMetrics: Record<string, NodeMetrics> = {
      ...metrics,
      e: {
        degree: 1,
        betweenness: 0,
        community: 2,
        span_entropy: 0,
        field_count: 1,
        dialect_count: 0,
      },
    };
    const expandedEdges: GraphEdge[] = [
      ...edges,
      {
        from: 'd',
        to: 'e',
        type: 'IS-A',
        strength: 'theorem',
        symmetric: false,
        evidence: [],
      },
    ];
    const after = buildBridgeAtlas(
      expandedMetrics,
      { ...layout, e: [630, 440] },
      expandedEdges,
      [0, 1, 2, 4],
    );
    expect(after.communities.slice(0, 2)).toEqual(before.communities.slice(0, 2));
    expect(after.communities[2]!.member_slugs).toEqual(['d', 'e']);
  });
});

describe('Bridge Atlas real-dataset audit', () => {
  it('matches a direct trusted-graph scan for membership, bridges, distributions, and frontiers', () => {
    const root = fileURLToPath(new URL('../..', import.meta.url));
    const result = runPipeline(root);
    expect(result.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
    const graph = result.graph!;
    const metrics = analyzeGraph(
      result.schema!,
      graph.nodes,
      graph.edges,
      graph.candidates,
      graph.symptoms,
      graph.nonEdges,
    );
    const bridgeAtlas = metrics.bridge_atlas;
    const rank = new Map(result.schema!.strengths.map((strength) => [strength.id, strength.rank]));
    const trustedRank = rank.get(result.schema!.analysis.trusted_min_strength)!;
    const trustedIndexes = graph.edges
      .map((edge, index) => ({ edge, index }))
      .filter(({ edge }) => rank.get(edge.strength)! <= trustedRank);

    for (const community of bridgeAtlas.communities) {
      expect(community.member_slugs).toEqual(
        Object.entries(metrics.nodes)
          .filter(([, node]) => node.community === community.id)
          .map(([slug]) => slug)
          .sort(),
      );
      expect(community.member_count).toBe(community.member_slugs.length);
      expect(community.internal_trusted_edge_count).toBe(
        trustedIndexes.filter(
          ({ edge }) =>
            metrics.nodes[edge.from]!.community === community.id &&
            metrics.nodes[edge.to]!.community === community.id,
        ).length,
      );
    }

    const populated = new Set<string>();
    for (const bridge of bridgeAtlas.bridges) {
      const key = `${String(bridge.source_community)}-${String(bridge.target_community)}`;
      populated.add(key);
      const direct = trustedIndexes.filter(({ edge }) => {
        const pair = [
          metrics.nodes[edge.from]!.community,
          metrics.nodes[edge.to]!.community,
        ].sort();
        return pair[0] === bridge.source_community && pair[1] === bridge.target_community;
      });
      expect(bridge.trusted_edge_count).toBe(direct.length);
      expect(new Set(bridge.edge_indexes)).toEqual(new Set(direct.map(({ index }) => index)));
      for (const index of bridge.edge_indexes) {
        const edge = graph.edges[index]!;
        expect(
          [metrics.nodes[edge.from]!.community, metrics.nodes[edge.to]!.community].sort(),
        ).toEqual([bridge.source_community, bridge.target_community]);
      }
      expect(Object.values(bridge.type_counts).reduce((sum, count) => sum + count, 0)).toBe(
        direct.length,
      );
      expect(Object.values(bridge.strength_counts).reduce((sum, count) => sum + count, 0)).toBe(
        direct.length,
      );
    }

    const expectedFrontiers: string[] = [];
    for (let a = 0; a < bridgeAtlas.communities.length; a++) {
      for (let b = a + 1; b < bridgeAtlas.communities.length; b++) {
        const key = `${String(a)}-${String(b)}`;
        if (!populated.has(key)) expectedFrontiers.push(key);
      }
    }
    expect(
      bridgeAtlas.frontiers.map(
        (frontier) => `${String(frontier.source_community)}-${String(frontier.target_community)}`,
      ),
    ).toEqual(expectedFrontiers);
  });
});

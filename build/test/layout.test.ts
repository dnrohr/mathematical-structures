/**
 * Stage-4 layout (UI_REDESIGN.md §4.7, ROADMAP M14): the build-time
 * constellation must be deterministic (same input → identical coordinates),
 * fitted to its canvas, rounded for byte-stable emit, and — the epistemic
 * rule — positions exist only for nodes the trusted subgraph touches.
 */
import { describe, expect, it } from 'vitest';
import { analyzeGraph } from '../src/analyze.js';
import { LAYOUT_HEIGHT, LAYOUT_WIDTH, layoutTrustedSubgraph } from '../src/layout.js';
import { stableStringify } from '../src/emit.js';
import type { GraphEdge, GraphNode } from '../src/model.js';
import type { AtlasSchema } from '../src/schema.js';

const slugs = ['a', 'b', 'c', 'd', 'e'];
const edges = [
  { from: 'a', to: 'b' },
  { from: 'b', to: 'c' },
  { from: 'c', to: 'd' },
  { from: 'a', to: 'c' },
];

describe('layoutTrustedSubgraph', () => {
  it('is deterministic: the same input produces byte-identical coordinates', () => {
    const first = layoutTrustedSubgraph(slugs, edges);
    const second = layoutTrustedSubgraph(slugs, edges);
    expect(stableStringify(second)).toBe(stableStringify(first));
  });

  it('positions only nodes touched by a trusted edge — absence is information', () => {
    const layout = layoutTrustedSubgraph(slugs, edges);
    expect(Object.keys(layout).sort()).toEqual(['a', 'b', 'c', 'd']); // e is isolated
  });

  it('fits the canvas with rounded coordinates and no coincident nodes', () => {
    const layout = layoutTrustedSubgraph(slugs, edges);
    const points = Object.values(layout);
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(LAYOUT_WIDTH);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(LAYOUT_HEIGHT);
      // Rounded to one decimal: ten times the value is an integer.
      expect(Math.round(x * 10)).toBeCloseTo(x * 10, 6);
      expect(Math.round(y * 10)).toBeCloseTo(y * 10, 6);
    }
    const keys = new Set(points.map(([x, y]) => `${String(x)},${String(y)}`));
    expect(keys.size).toBe(points.length);
  });

  it('handles the empty and single-edge cases', () => {
    expect(layoutTrustedSubgraph(['a', 'b'], [])).toEqual({});
    const pair = layoutTrustedSubgraph(['a', 'b'], [{ from: 'a', to: 'b' }]);
    expect(Object.keys(pair).sort()).toEqual(['a', 'b']);
  });
});

// ---------------------------------------------------------------------------
// Through analyzeGraph: the layout rides the trusted floor like every metric.
// ---------------------------------------------------------------------------

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

function node(slug: string): GraphNode {
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
  };
}

function edge(from: string, to: string, strength = 'theorem'): GraphEdge {
  return { from, to, type: 'IS-A', strength, symmetric: false, evidence: [] };
}

describe('analyzeGraph layout', () => {
  it('emits metrics.layout over the trusted subgraph; untrusted edges buy no position', () => {
    const m = analyzeGraph(
      schema,
      ['a', 'b', 'c'].map(node),
      [edge('a', 'b'), edge('b', 'c', 'heuristic-analogy')],
      [],
      [],
      [],
    );
    // c's only edge is an analogy below the floor: no constellation position.
    expect(Object.keys(m.layout).sort()).toEqual(['a', 'b']);
    expect(m.trusted.node_count).toBe(2);
  });
});

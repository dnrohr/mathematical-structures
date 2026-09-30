import { describe, expect, it } from 'vitest';
import type { GraphEdge, GraphNode } from '../src/data/types';
import {
  deterministicFlowOrder,
  flowBand,
  flowLayer,
  flowRoute,
  type FlowOrderOptions,
} from '../src/views/atlas/flow-layout';

const node = (slug: string, nodeType: string, fields: string[] = []): GraphNode =>
  ({ slug, canonical_name: slug, node_type: nodeType, fields }) as GraphNode;
const edge = (from: string, to: string, type: string, symmetric = false): GraphEdge =>
  ({ from, to, type, strength: 'theorem', symmetric }) as GraphEdge;
const options: FlowOrderOptions = {
  group: 'field',
  fieldLabel: (id) => ({ biology: 'Biology', control: 'Control theory' })[id] ?? id,
  community: () => 0,
};

describe('Structure to Use projection', () => {
  it('maps every existing ontology type to exactly one presentation layer', () => {
    expect(
      Object.fromEntries(
        [
          'object',
          'principle',
          'model',
          'operation',
          'dialect',
          'move',
          'theorem',
          'phenomenon',
          'application',
        ].map((type) => [type, flowLayer(node(type, type))]),
      ),
    ).toEqual({
      object: 'foundation',
      principle: 'foundation',
      model: 'form',
      operation: 'form',
      dialect: 'form',
      move: 'method',
      theorem: 'method',
      phenomenon: 'behavior',
      application: 'application',
    });
  });

  it('classifies claim bands and routes without changing stored direction or symmetry', () => {
    const nodes = [node('foundation', 'object'), node('method', 'move'), node('peer', 'object')];
    const order = deterministicFlowOrder(nodes, [], options);
    const forward = edge('foundation', 'method', 'SOLVED-BY');
    const backward = edge('method', 'foundation', 'ASSUMES');
    const local = edge('foundation', 'peer', 'ANALOGOUS-TO', true);
    expect(flowBand(forward)).toBe('primary');
    expect(flowBand(backward)).toBe('structural');
    expect(flowBand(local)).toBe('cross-link');
    expect(flowRoute(forward, order.layerBySlug)).toBe('long');
    expect(flowRoute(backward, order.layerBySlug)).toBe('backward');
    expect(flowRoute(local, order.layerBySlug)).toBe('same-layer');
    expect(local).toMatchObject({ from: 'foundation', to: 'peer', symmetric: true });
  });

  it('produces byte-stable ordering with slug ties and field-grouped applications', () => {
    const nodes = [
      node('zeta', 'model'),
      node('alpha', 'model'),
      node('beta-use', 'application', ['control']),
      node('alpha-use', 'application', ['biology']),
      node('root', 'principle'),
    ];
    const edges = [
      edge('root', 'zeta', 'REPRESENTED-BY'),
      edge('alpha', 'alpha-use', 'APPLIED-IN'),
    ];
    const first = deterministicFlowOrder(nodes, edges, options);
    const second = deterministicFlowOrder([...nodes].reverse(), [...edges].reverse(), options);
    const slugs = (value: typeof first) =>
      Object.fromEntries(
        Object.entries(value.layers).map(([layer, members]) => [layer, members.map((n) => n.slug)]),
      );
    expect(JSON.stringify(slugs(first))).toBe(JSON.stringify(slugs(second)));
    expect(first.layers.application.map((n) => n.slug)).toEqual(['alpha-use', 'beta-use']);
  });
});

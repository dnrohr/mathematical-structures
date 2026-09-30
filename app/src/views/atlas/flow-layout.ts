import type { GraphEdge, GraphNode } from '../../data/types';

export const FLOW_LAYERS = ['foundation', 'form', 'method', 'behavior', 'application'] as const;
export type FlowLayer = (typeof FLOW_LAYERS)[number];
export type FlowGroup = 'field' | 'community' | 'none';
export type FlowBand = 'primary' | 'structural' | 'cross-link';
export type FlowRoute = 'forward' | 'long' | 'same-layer' | 'backward';

const LAYER_BY_TYPE: Record<string, FlowLayer> = {
  object: 'foundation',
  principle: 'foundation',
  model: 'form',
  operation: 'form',
  dialect: 'form',
  move: 'method',
  theorem: 'method',
  phenomenon: 'behavior',
  application: 'application',
};

const PRIMARY = new Set([
  'REPRESENTED-BY',
  'EXPOSES',
  'SYMMETRY-SELECTS-REPRESENTATION',
  'SOLVED-BY',
  'APPLIED-IN',
  'GOVERNS',
  'MEASURES-DISTANCE-TO',
  'MIGRATED-TO',
]);
const CROSS_LINK = new Set([
  'FIELD-DIALECT-OF',
  'SAME-SKELETON',
  'ANALOGOUS-TO',
  'TRANSFORM-DUAL',
  'LOCAL-GLOBAL-DUAL',
]);

export function flowLayer(node: Pick<GraphNode, 'node_type'>): FlowLayer {
  const layer = LAYER_BY_TYPE[node.node_type];
  if (!layer) throw new Error(`Unmapped Atlas node type: ${node.node_type}`);
  return layer;
}

export function flowBand(edge: Pick<GraphEdge, 'type'>): FlowBand {
  if (PRIMARY.has(edge.type)) return 'primary';
  if (CROSS_LINK.has(edge.type)) return 'cross-link';
  return 'structural';
}

export function flowRoute(
  edge: Pick<GraphEdge, 'from' | 'to'>,
  layerBySlug: ReadonlyMap<string, FlowLayer>,
): FlowRoute {
  const from = FLOW_LAYERS.indexOf(layerBySlug.get(edge.from)!);
  const to = FLOW_LAYERS.indexOf(layerBySlug.get(edge.to)!);
  if (from === to) return 'same-layer';
  if (to < from) return 'backward';
  return to - from > 1 ? 'long' : 'forward';
}

export interface FlowOrderOptions {
  group: FlowGroup;
  fieldLabel: (id: string) => string;
  community: (slug: string) => number | null;
}

export interface OrderedFlow {
  layers: Record<FlowLayer, GraphNode[]>;
  layerBySlug: Map<string, FlowLayer>;
}

function applicationGroup(node: GraphNode, options: FlowOrderOptions): string {
  if (options.group === 'none') return '';
  if (options.group === 'community') {
    const value = options.community(node.slug);
    return value === null
      ? 'Unassigned community'
      : `Community ${String(value + 1).padStart(4, '0')}`;
  }
  const first = node.fields[0];
  return first ? options.fieldLabel(first) : 'Unassigned field';
}

/**
 * Fixed four-pass median ordering. Seeds and every tie use canonical name +
 * slug, so the same complete trusted graph always produces the same rows.
 */
export function deterministicFlowOrder(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: FlowOrderOptions,
): OrderedFlow {
  const layerBySlug = new Map(nodes.map((node) => [node.slug, flowLayer(node)]));
  const base = (a: GraphNode, b: GraphNode): number =>
    a.canonical_name.localeCompare(b.canonical_name) || a.slug.localeCompare(b.slug);
  const layers = Object.fromEntries(
    FLOW_LAYERS.map((layer) => [
      layer,
      nodes.filter((node) => layerBySlug.get(node.slug) === layer).sort(base),
    ]),
  ) as Record<FlowLayer, GraphNode[]>;
  const primary = edges.filter(
    (edge) =>
      flowBand(edge) === 'primary' && layerBySlug.has(edge.from) && layerBySlug.has(edge.to),
  );

  const sweep = (indexes: number[]): void => {
    const positions = new Map<string, number>();
    for (const layer of FLOW_LAYERS)
      layers[layer].forEach((node, index) => positions.set(node.slug, index));
    for (const layerIndex of indexes) {
      const layer = FLOW_LAYERS[layerIndex]!;
      const score = (node: GraphNode): number => {
        const values = primary
          .filter((edge) => edge.from === node.slug || edge.to === node.slug)
          .map((edge) => positions.get(edge.from === node.slug ? edge.to : edge.from))
          .filter((value): value is number => value !== undefined)
          .sort((a, b) => a - b);
        if (values.length === 0) return positions.get(node.slug) ?? 0;
        const middle = Math.floor(values.length / 2);
        return values.length % 2 ? values[middle]! : (values[middle - 1]! + values[middle]!) / 2;
      };
      layers[layer].sort((a, b) => score(a) - score(b) || base(a, b));
    }
  };

  for (let pass = 0; pass < 2; pass++) {
    sweep([1, 2, 3, 4]);
    sweep([3, 2, 1, 0]);
  }
  layers.application.sort(
    (a, b) =>
      applicationGroup(a, options).localeCompare(applicationGroup(b, options)) || base(a, b),
  );
  return { layers, layerBySlug };
}

export function flowGroupLabel(node: GraphNode, options: FlowOrderOptions): string {
  return applicationGroup(node, options).replace(/Community 0+(\d+)/, 'Community $1');
}

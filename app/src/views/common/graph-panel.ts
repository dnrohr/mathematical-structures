/**
 * Bridge from data-layer subgraphs to the graph-render component: maps
 * schema tokens onto the component's display records (node color by type
 * token, edge line style by strength token) and phrases every edge as a
 * sentence for the hover caption and accessible name.
 */
import type { Atlas } from '../../data/atlas';
import type { Subgraph } from '../../data/subgraph';
import { renderGraph, type GraphPreset, type GraphViewEdge } from '../../graph-render';
import { edgeSentenceText } from './edge-claim';
import { GAP_EDGE_TYPE } from './edge-sentence';

export function graphPanel(
  atlas: Atlas,
  subgraph: Subgraph,
  opts: { preset: GraphPreset; label: string; focus?: string[] },
): HTMLElement {
  const focus = opts.focus ?? [];
  return renderGraph({
    preset: opts.preset,
    label: opts.label,
    nodes: subgraph.nodes.map((node) => {
      const rank = focus.indexOf(node.slug);
      return {
        id: node.slug,
        label: node.canonical_name,
        colorToken: atlas.nodeType(node.node_type)?.color_token ?? 'ink-muted',
        href: `#/c/${node.slug}`,
        ...(rank >= 0 ? { focus: rank } : {}),
      };
    }),
    edges: subgraph.edges.map((edge): GraphViewEdge => {
      const strength = atlas.strength(edge.strength);
      return {
        from: edge.from,
        to: edge.to,
        line: strength?.line ?? 'solid',
        emphasis: strength?.emphasis ?? 'medium',
        gap: edge.type === GAP_EDGE_TYPE,
        sentence: edgeSentenceText(atlas, edge),
      };
    }),
  });
}

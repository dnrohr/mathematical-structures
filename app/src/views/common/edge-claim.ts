/**
 * Full-edge sentences: like edge-sentence.ts, but for contexts where both
 * endpoints must be named (lens lists, path chains, ego supplements, graph
 * captions) rather than a concept page speaking about "the other end".
 * Edges are sentences (spec §3.2): the claim always carries its strength.
 */
import type { Atlas } from '../../data/atlas';
import type { GraphEdge } from '../../data/types';
import { gapStatusChip, strengthBadge } from './badges';
import { citeDetails } from './citations';
import { h } from './dom';
import { GAP_EDGE_TYPE } from './edge-sentence';
import { nodeLink } from './node-link';

/**
 * The display phrasing for an edge read from `from`'s side (defaults to the
 * stored direction). Symmetric types have one phrase; directed types read
 * forward or reverse depending on which end speaks.
 */
export function edgePhrase(atlas: Atlas, edge: GraphEdge, from: string = edge.from): string {
  const type = atlas.edgeType(edge.type);
  if (!type) return edge.type;
  if (type.directionality === 'symmetric') return type.phrase ?? edge.type;
  return (edge.from === from ? type.forward : type.reverse) ?? edge.type;
}

/** Plain-text sentence for graph captions and accessible names. */
export function edgeSentenceText(atlas: Atlas, edge: GraphEdge, from: string = edge.from): string {
  const to = edge.from === from ? edge.to : edge.from;
  const name = (slug: string): string => atlas.node(slug)?.canonical_name ?? slug;
  const qualifier =
    edge.type === GAP_EDGE_TYPE && edge.status
      ? `${edge.strength}, ${edge.status.replace(/-/g, ' ')}`
      : edge.strength.replace(/-/g, ' ');
  return `${name(from)} ${edgePhrase(atlas, edge, from)} ${name(to)} (${qualifier})`;
}

/**
 * One edge as a readable claim with both endpoints linked, oriented from
 * `opts.from` when given. A list item, styled like the concept page's
 * connection entries.
 */
export function edgeClaim(
  atlas: Atlas,
  edge: GraphEdge,
  opts: { from?: string; context?: boolean; notes?: boolean } = {},
): HTMLLIElement {
  const from = opts.from ?? edge.from;
  const to = edge.from === from ? edge.to : edge.from;
  const gap = edge.type === GAP_EDGE_TYPE;
  return h(
    'li',
    { class: `connection claim${gap ? ' gap' : ''}` },
    nodeLink(atlas, from),
    h('span', { class: 'phrase' }, ` ${edgePhrase(atlas, edge, from)} `),
    nodeLink(atlas, to),
    ' ',
    strengthBadge(atlas, edge.strength),
    edge.status && gapStatusChip(atlas, edge.status),
    opts.context !== false &&
      edge.context &&
      h('span', { class: 'context' }, ` — ${edge.context.trim()}`),
    ' ',
    citeDetails(atlas, edge.evidence),
    opts.notes !== false && edge.notes && h('p', { class: 'connection-notes' }, edge.notes.trim()),
  );
}

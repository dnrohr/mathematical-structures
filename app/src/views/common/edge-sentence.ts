/**
 * Edges are sentences (spec §3.2): every rendered connection is a readable
 * claim carrying its qualifiers — strength always, context/workflow status
 * when present. Shared by the concept view now, lens/path/questions views
 * in M4/M5.
 */
import type { Atlas } from '../../data/atlas';
import type { NodeConnection } from '../../data/types';
import { gapStatusChip, strengthBadge } from './badges';
import { citeDetails } from './citations';
import { h } from './dom';
import { nodeLink } from './node-link';

export const GAP_EDGE_TYPE = 'POSSIBLE-MISSING-MIGRATION';

/**
 * One connection as a list item. With `phrase: true` the display phrasing is
 * inlined ("assumes → Smoothness"); otherwise the phrase is expected to be a
 * group heading above the list.
 */
export function connectionItem(
  atlas: Atlas,
  conn: NodeConnection,
  opts: { phrase?: boolean } = {},
): HTMLLIElement {
  const gap = conn.type === GAP_EDGE_TYPE;
  return h(
    'li',
    { class: `connection${gap ? ' gap' : ''}` },
    opts.phrase && h('span', { class: 'phrase' }, `${conn.phrase} `),
    nodeLink(atlas, conn.other),
    ' ',
    strengthBadge(atlas, conn.strength),
    conn.status && gapStatusChip(atlas, conn.status),
    conn.context && h('span', { class: 'context' }, ` — ${conn.context.trim()}`),
    ' ',
    citeDetails(atlas, conn.evidence),
    conn.notes && h('p', { class: 'connection-notes' }, conn.notes.trim()),
  );
}
